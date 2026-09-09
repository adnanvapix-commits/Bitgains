import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { amount, packageType = '30-day' } = await req.json();
    const stakeAmount = parseFloat(amount);
    if (!stakeAmount || stakeAmount <= 0) return NextResponse.json({ success: false, message: 'Invalid stake amount' }, { status: 400 });
    if (!['30-day', '90-day'].includes(packageType)) return NextResponse.json({ success: false, message: "Invalid package type. Must be '30-day' or '90-day'" }, { status: 400 });

    const minStake = packageType === '90-day' ? 500 : 100;
    if (stakeAmount < minStake) return NextResponse.json({ success: false, message: `Minimum stake for ${packageType} is ${minStake} USDT` }, { status: 400 });

    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', user!.id).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });

    const available = wallet.balance - wallet.staked_amount;
    if (available < stakeAmount) return NextResponse.json({ success: false, message: `Insufficient balance. Available: ${available} USDT` }, { status: 400 });

    const daysToAdd = packageType === '90-day' ? 90 : 30;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const stakeId = `STK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expectedRewards = Math.round(stakeAmount * 0.08 * (daysToAdd / 30) * 100000000) / 100000000;

    const { data: stakeRecord, error: stakeErr } = await supabaseAdmin.from('stakes').insert({
      stake_id: stakeId,
      wallet_id: wallet.id,
      user_id: user!.id,
      amount: stakeAmount,
      package_type: packageType,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      expected_rewards: expectedRewards,
    }).select().single();
    if (stakeErr) throw stakeErr;

    await supabaseAdmin.from('wallets').update({
      staked_amount: wallet.staked_amount + stakeAmount,
      staking_start_date: wallet.staking_start_date || startDate.toISOString(),
      last_staking_update: startDate.toISOString(),
    }).eq('user_id', user!.id);

    const { data: tx } = await supabaseAdmin.from('transactions').insert({
      user_id: user!.id, type: 'stake', amount: stakeAmount, currency: 'USDT', status: 'completed',
      description: `Staked ${stakeAmount} USDT (${packageType} package)`,
      completed_at: startDate.toISOString(),
      metadata: { stakeId, packageType, startDate, endDate, expectedRewards },
    }).select().single();

    return NextResponse.json({
      success: true,
      message: 'Funds staked successfully',
      data: {
        transaction: { id: tx!.id, type: tx!.type, amount: tx!.amount, status: tx!.status, completedAt: tx!.completed_at },
        stake: { stakeId, amount: stakeAmount, packageType, startDate, endDate, expectedRewards, status: 'active' },
        wallet: { balance: wallet.balance, stakedAmount: wallet.staked_amount + stakeAmount, availableBalance: available - stakeAmount },
      },
    });
  } catch (err: any) {
    console.error('Stake error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Error staking funds' }, { status: 500 });
  }
}
