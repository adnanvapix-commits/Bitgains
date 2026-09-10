import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { userId, amount, reason } = await req.json();
    if (!userId || !amount || !reason) return NextResponse.json({ success: false, message: 'userId, amount and reason required' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: target } = await sb.from('profiles').select('email').eq('id', userId).single();
    if (!target) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    const { data: wallet } = await sb.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    const num = parseFloat(amount);
    const available = wallet.balance - wallet.staked_amount;
    if (available < num) return NextResponse.json({ success: false, message: `Insufficient. Available: ${available} USDT` }, { status: 400 });
    const prev = wallet.balance;
    await sb.from('wallets').update({ balance: wallet.balance - num, total_withdrawn: wallet.total_withdrawn + num }).eq('user_id', userId);
    await sb.from('transactions').insert({ user_id: userId, type: 'admin_debit', amount: num, status: 'completed', description: `Admin deduction: ${reason}`, metadata: { adminId: user!.id, reason } });
    await sb.from('audit_logs').insert({ admin_id: user!.id, admin_email: user!.email, target_user_id: userId, target_user_email: target.email, action: 'MANUAL_DEDUCT_BALANCE', amount: num, reason, previous_balance: prev, new_balance: prev - num });
    return NextResponse.json({ success: true, message: 'Balance deducted' });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
