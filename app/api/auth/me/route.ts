import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const supabase = getSupabaseAdmin();

    const [{ data: profile }, walletResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase.from('wallets').select('balance, staked_amount, total_earnings, total_deposited, total_withdrawn, apr').eq('user_id', user!.id).single(),
    ]);

    if (!profile) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    let wallet = walletResult.data;
    // Auto-create wallet if missing (trigger may not have fired)
    if (!wallet) {
      const { data: newWallet } = await supabase.from('wallets').insert({
        user_id: user!.id, balance: 0, staked_amount: 0, total_earnings: 0,
        total_deposited: 0, total_withdrawn: 0, apr: 12.5,
      }).select('balance, staked_amount, total_earnings, total_deposited, total_withdrawn, apr').single();
      wallet = newWallet;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          isEmailVerified: true,
          lastLogin: profile.last_login,
          createdAt: profile.created_at,
          referralCode: profile.referral_code,
          referralCount: profile.referral_count || 0,
        },
        wallet: wallet ? {
          balance: wallet.balance,
          stakedAmount: wallet.staked_amount,
          availableBalance: wallet.balance - wallet.staked_amount,
          totalEarnings: wallet.total_earnings,
          totalDeposited: wallet.total_deposited,
          totalWithdrawn: wallet.total_withdrawn,
          apr: wallet.apr,
        } : null,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching user profile' }, { status: 500 });
  }
}
