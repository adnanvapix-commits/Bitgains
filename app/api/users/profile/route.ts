import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', user!.id).single(),
      sb.from('wallets').select('*').eq('user_id', user!.id).single(),
    ]);
    if (!profile) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { user: { id: profile.id, email: profile.email, name: profile.name, role: profile.role, isActive: profile.is_active, isEmailVerified: true, lastLogin: profile.last_login, createdAt: profile.created_at, updatedAt: profile.updated_at }, wallet: wallet ? { balance: wallet.balance, stakedAmount: wallet.staked_amount, availableBalance: wallet.balance - wallet.staked_amount, totalEarnings: wallet.total_earnings, totalDeposited: wallet.total_deposited, totalWithdrawn: wallet.total_withdrawn, apr: wallet.apr, stakingStartDate: wallet.staking_start_date, lastStakingUpdate: wallet.last_staking_update } : null } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { name, email } = await req.json();
    const sb = getSupabaseAdmin();
    const updates: any = {};
    if (name) updates.name = name.trim();
    if (email && email !== user!.email) {
      const { data: ex } = await sb.from('profiles').select('id').eq('email', email).neq('id', user!.id).single();
      if (ex) return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
      updates.email = email;
      await sb.auth.admin.updateUserById(user!.id, { email });
    }
    const { data: updated } = await sb.from('profiles').update(updates).eq('id', user!.id).select().single();
    return NextResponse.json({ success: true, message: 'Profile updated', data: { user: updated } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
