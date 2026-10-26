import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';
import { distributeReferralRewards } from '../../../../../lib/server/referralRewards';

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
    const now = new Date();
    const nowISO = now.toISOString();
    const sb = getSupabaseAdmin();

    // Fetch all active stakes
    let stakeQuery = sb
      .from('stakes')
      .select(`
        id, stake_id, user_id, wallet_id, amount, package_type, start_date, end_date,
        profiles!stakes_user_id_fkey(id, name, email)
      `)
      .eq('status', 'active');

    if (userIds && userIds.length > 0) {
      stakeQuery = stakeQuery.in('user_id', userIds);
    }

    const { data: allStakes, error: stakeErr } = await stakeQuery;
    if (stakeErr) throw stakeErr;

    // Count existing payouts per stake from transaction metadata
    const { data: payoutTxs } = await sb
      .from('transactions')
      .select('metadata')
      .eq('type', 'staking_payout');

    const payoutCountMap = new Map<string, number>();
    for (const tx of (payoutTxs || [])) {
      const stakePayouts = tx.metadata?.stakePayouts || [];
      for (const sp of stakePayouts) {
        if (sp.stakeId) {
          payoutCountMap.set(sp.stakeId, (payoutCountMap.get(sp.stakeId) || 0) + 1);
        }
      }
    }

    // Filter to only stakes eligible for next 30-day interval payout
    const eligibleStakes = (allStakes || []).filter((stake: any) => {
      const startDate = new Date(stake.start_date);
      const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const payoutsGiven = payoutCountMap.get(stake.stake_id) || 0;
      const nextPayoutDueAtDay = (payoutsGiven + 1) * 30;
      return daysElapsed >= nextPayoutDueAtDay && payoutsGiven < 3;
    });

    if (eligibleStakes.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No stakes are due for a 30-day interval payout. Stakes become eligible every 30 days (3 payouts per 90-day stake).',
      }, { status: 400 });
    }

    const results: any[] = [];
    const failedUsers: any[] = [];

    // Group eligible stakes by user
    const stakesByUser = new Map<string, any[]>();
    for (const stake of eligibleStakes) {
      if (!stakesByUser.has(stake.user_id)) stakesByUser.set(stake.user_id, []);
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
          const payoutsGiven = payoutCountMap.get(stake.stake_id) || 0;
          const payoutNumber = payoutsGiven + 1;
          const payoutAmount = Math.round(Number(stake.amount) * (pct / 100) * 1e8) / 1e8;
          totalPayout += payoutAmount;
          stakePayouts.push({
            stakeId: stake.stake_id,
            stakedAmount: Number(stake.amount),
            payoutAmount,
            payoutNumber,
            totalPayoutSlots: 3,
            packageType: stake.package_type,
          });

          // Final payout -- mark stake as matured
          if (payoutNumber === 3) {
            await sb.from('stakes').update({
              status: 'matured',
              actual_rewards: payoutAmount,
              matured_at: nowISO,
            }).eq('id', stake.id);
          }
        }

        const previousBalance = wallet.balance;

        // Credit wallet
        await sb.from('wallets').update({
          balance: wallet.balance + totalPayout,
          total_earnings: wallet.total_earnings + totalPayout,
          last_staking_update: nowISO,
        }).eq('user_id', userId);

        // Distribute referral commissions on staking profit to referrers
        await distributeReferralRewards({
          userId,
          depositAmount: totalPayout,
          sourceTransactionId: null,
        }).catch((e) => console.error('Referral reward distribution error:', e));

        // Create payout transaction
        const payoutNumbers = stakePayouts.map(s => s.payoutNumber);
        const payoutLabel = payoutNumbers.length === 1
          ? `Payout ${payoutNumbers[0]} of 3`
          : `Payouts ${payoutNumbers.join(', ')} of 3`;

        await sb.from('transactions').insert({
          user_id: userId,
          type: 'staking_payout',
          amount: totalPayout,
          currency: 'USDT',
          status: 'completed',
          description: `30-day staking payout (${payoutLabel}) - ${pct}% of staked amount`,
          completed_at: nowISO,
          reviewed_by: user!.id,
          reviewed_at: nowISO,
          metadata: {
            adminId: user!.id,
            adminEmail: user!.email,
            payoutPercentage: pct,
            payoutInterval: '30days',
            stakePayouts,
            previousBalance,
            newBalance: previousBalance + totalPayout,
          },
        });

        // Send notification
        const payoutNum = stakePayouts[0]?.payoutNumber || 1;
        await sb.from('notifications').insert({
          user_id: userId,
          title: `Staking Payout ${payoutNum}/3 Received!`,
          message: `Your 30-day staking payout of ${totalPayout.toFixed(4)} USDT (${pct}% of your staked amount) has been credited. ${payoutNum < 3 ? `Next payout in 30 days (${payoutNum + 1}/3).` : 'This was your final payout for this stake.'}`,
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
          reason: `30-day interval staking payout at ${pct}%`,
          previous_balance: previousBalance,
          new_balance: previousBalance + totalPayout,
          metadata: { payoutPercentage: pct, payoutInterval: '30days', stakePayouts },
        });

        results.push({
          userId,
          name: userProfile?.name || 'Unknown',
          email: userProfile?.email || '',
          totalPayout,
          stakePayouts,
        });
      } catch (userErr: any) {
        failedUsers.push({ userId, reason: (userErr as any).message });
      }
    }

    const totalDistributed = results.reduce((s, r) => s + r.totalPayout, 0);

    return NextResponse.json({
      success: true,
      message: `30-day interval payout of ${pct}% distributed to ${results.length} user(s)`,
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
