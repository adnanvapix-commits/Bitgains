import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', user!.id).single(),
      supabaseAdmin.from('wallets').select('balance, staked_amount, total_earnings, total_deposited, total_withdrawn, apr').eq('user_id', user!.id).single(),
    ]);

    if (!profile) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

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
