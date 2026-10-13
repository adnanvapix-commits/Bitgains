import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  try {
    const body = await req.json();
    const { percentage, userIds } = body;

    if (!percentage || isNaN(parseFloat(percentage)) || parseFloat(percentage) <= 0 || parseFloat(percentage) > 100) {
      return NextResponse.json({ success: false, message: 'Percentage must be between 0.01 and 100' }, { status: 400 });
    }

    const pct = parseFloat(percentage);
    const now = new Date().toISOString();
    const sb = getSupabaseAdmin();

    // Find all active matured stakes
    let stakeQuery = sb
      .from('stakes')
      .select(`
        id, stake_id, user_id, wallet_id, amount, package_type, start_date, end_date,
        profiles!stakes_user_id_fkey(id, name, email)
      `)
      .eq('status', 'active')
      .lte('end_date', now); // only matured stakes

    if (userIds && userIds.length > 0) {
      stakeQuery = stakeQuery.in('user_id', userIds);
    }

    const { data: maturedStakes, error: stakeErr } = await stakeQuery;
    if (stakeErr) throw stakeErr;

    if (!maturedStakes || maturedStakes.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No matured stakes found for the selected users',
      }, { status: 400 });
    }

    const results: any[] = [];
    const failedUsers: any[] = [];

    // Group stakes by user
    const stakesByUser = new Map<string, any[]>();
    for (const stake of maturedStakes) {
      if (!stakesByUser.has(stake.user_id)) {
        stakesByUser.set(stake.user_id, []);
      }
      stakesByUser.get(stake.user_id)!.push(stake);
    }

    for (const [userId, userStakes] of stakesByUser) {
      try {
        const { data: wallet } = await sb.from('wallets').select('*').eq('user_id', userId).single();
        if (!wallet) {
          failedUsers.push({ userId, reason: 'Wallet not found' });
          continue;
        }

        const userProfile = (userStakes[0] as any).profiles;
        let totalPayout = 0;
        const stakePayouts: any[] = [];

        for (const stake of userStakes) {
          const payoutAmount = Math.round(Number(stake.amount) * (pct / 100) * 100000000) / 100000000;
          totalPayout += payoutAmount;
          stakePayouts.push({
            stakeId: stake.stake_id,
            stakedAmount: Number(stake.amount),
            payoutAmount,
            packageType: stake.package_type,
          });
        }

        const previousBalance = wallet.balance;

        // Credit wallet
        await sb.from('wallets').update({
          balance: wallet.balance + totalPayout,
          total_earnings: wallet.total_earnings + totalPayout,
          last_staking_update: now,
        }).eq('user_id', userId);

        // Mark stakes as matured
        for (const stake of userStakes) {
          const actualReward = Math.round(Number(stake.amount) * (pct / 100) * 100000000) / 100000000;
          await sb.from('stakes').update({
            status: 'matured',
            actual_rewards: actualReward,
            matured_at: now,
          }).eq('id', stake.id);
        }

        // Create payout transaction
        await sb.from('transactions').insert({
          user_id: userId,
          type: 'staking_payout',
          amount: totalPayout,
          currency: 'USDT',
          status: 'completed',
          description: `Admin staking payout – ${pct}% of staked amount`,
          completed_at: now,
          reviewed_by: user!.id,
          reviewed_at: now,
          metadata: {
            adminId: user!.id,
            adminEmail: user!.email,
            payoutPercentage: pct,
            stakePayouts,
            previousBalance,
            newBalance: previousBalance + totalPayout,
          },
        });

        // Send in-app notification
        await sb.from('notifications').insert({
          user_id: userId,
          title: '🎉 Staking Payout Received!',
          message: `Your staking payout of ${totalPayout.toFixed(4)} USDT (${pct}% of your staked amount) has been credited to your wallet. Keep staking to earn more!`,
          type: 'success',
          is_broadcast: false,
          sent_by: user!.id,
        });

        // Audit log
        await sb.from('audit_logs').insert({
          admin_id: user!.id,
          admin_email: user!.email,
          target_user_id: userId,
          target_user_email: userProfile?.email || '',
          action: 'STAKING_PAYOUT',
          amount: totalPayout,
          reason: `Staking payout at ${pct}%`,
          previous_balance: previousBalance,
          new_balance: previousBalance + totalPayout,
          metadata: { payoutPercentage: pct, stakePayouts },
        });

        results.push({
          userId,
          name: userProfile?.name || 'Unknown',
          email: userProfile?.email || '',
          totalPayout,
          stakePayouts,
        });
      } catch (userErr: any) {
        failedUsers.push({ userId, reason: userErr.message });
      }
    }

    const totalDistributed = results.reduce((s, r) => s + r.totalPayout, 0);

    return NextResponse.json({
      success: true,
      message: `Payout of ${pct}% distributed to ${results.length} user(s)`,
      data: {
        percentage: pct,
        usersProcessed: results.length,
        usersFailed: failedUsers.length,
        totalDistributed,
        results,
        failedUsers,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Error distributing payouts' }, { status: 500 });
  }
}
