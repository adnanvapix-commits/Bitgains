import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

// Package definitions
const STAKING_PACKAGES: Record<string, { days: number; maxMonthlyRate: number; label: string }> = {
  '6-month': { days: 180, maxMonthlyRate: 0.12, label: '6-Month Stake' },
  '12-month': { days: 360, maxMonthlyRate: 0.15, label: '12-Month Stake' },
};

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { amount, packageType = '6-month' } = await req.json();
    const num = parseFloat(amount);
    if (!num || num <= 0) return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });

    const pkg = STAKING_PACKAGES[packageType];
    if (!pkg) return NextResponse.json({ success: false, message: 'Invalid package. Choose 6-month or 12-month.' }, { status: 400 });

    const minStake = 100;
    if (num < minStake) return NextResponse.json({ success: false, message: `Minimum stake is ${minStake} USDT` }, { status: 400 });

    const sb = getSupabaseAdmin();
    const { data: wallet } = await sb.from('wallets').select('*').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    if (wallet.balance - wallet.staked_amount < num) {
      return NextResponse.json({ success: false, message: `Insufficient balance. Available: ${wallet.balance - wallet.staked_amount} USDT` }, { status: 400 });
    }

    const months = pkg.days / 30;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + pkg.days * 86400000);
    const stakeId = `STK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Expected rewards: average monthly rate * months
    const avgRate = pkg.maxMonthlyRate * 0.85; // conservative average
    const expectedRewards = Math.round(num * avgRate * months * 1e8) / 1e8;

    const { data: stake, error: stakeErr } = await sb.from('stakes').insert({
      stake_id: stakeId,
      wallet_id: wallet.id,
      user_id: user!.id,
      amount: num,
      package_type: packageType,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      expected_rewards: expectedRewards,
    }).select().single();

    if (stakeErr) throw stakeErr;

    await sb.from('wallets').update({
      staked_amount: wallet.staked_amount + num,
      staking_start_date: wallet.staking_start_date || startDate.toISOString(),
      last_staking_update: startDate.toISOString(),
    }).eq('user_id', user!.id);

    const { data: tx } = await sb.from('transactions').insert({
      user_id: user!.id,
      type: 'stake',
      amount: num,
      currency: 'USDT',
      status: 'completed',
      description: `Staked ${num} USDT (${pkg.label})`,
      completed_at: startDate.toISOString(),
      metadata: { stakeId, packageType, startDate, endDate, expectedRewards },
    }).select().single();

    return NextResponse.json({
      success: true,
      message: `Funds staked successfully! 🎉 Congratulations on your ${pkg.label}! Admin will distribute monthly payouts to eligible users. Keep your funds staked to maximize your earnings!`,
      showCongratsMessage: true,
      data: {
        transaction: { id: tx!.id, type: tx!.type, amount: tx!.amount, status: tx!.status },
        stake: { stakeId, amount: num, packageType, startDate, endDate, expectedRewards, status: 'active' },
        wallet: { balance: wallet.balance, stakedAmount: wallet.staked_amount + num, availableBalance: wallet.balance - wallet.staked_amount - num },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
