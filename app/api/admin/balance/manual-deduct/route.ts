import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { userId, amount, reason } = await req.json();
    if (!userId || !amount || !reason) return NextResponse.json({ success: false, message: 'userId, amount and reason are required' }, { status: 400 });

    const { data: targetUser } = await supabaseAdmin.from('profiles').select('email, name').eq('id', userId).single();
    if (!targetUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'User wallet not found' }, { status: 404 });

    const numAmount = parseFloat(amount);
    const available = wallet.balance - wallet.staked_amount;
    if (available < numAmount) return NextResponse.json({ success: false, message: `Insufficient balance. Available: ${available} USDT` }, { status: 400 });

    const prevBalance = wallet.balance;
    await supabaseAdmin.from('wallets').update({ balance: wallet.balance - numAmount, total_withdrawn: wallet.total_withdrawn + numAmount }).eq('user_id', userId);
    await supabaseAdmin.from('transactions').insert({ user_id: userId, type: 'admin_debit', amount: numAmount, status: 'completed', description: `Admin deduction: ${reason}`, metadata: { adminId: user!.id, reason } });
    await supabaseAdmin.from('audit_logs').insert({ admin_id: user!.id, admin_email: user!.email, target_user_id: userId, target_user_email: targetUser.email, action: 'MANUAL_DEDUCT_BALANCE', amount: numAmount, reason, previous_balance: prevBalance, new_balance: prevBalance - numAmount });

    return NextResponse.json({ success: true, message: 'Balance deducted successfully' });
  } catch (err) {
    console.error('Manual deduct error:', err);
    return NextResponse.json({ success: false, message: 'Error deducting balance' }, { status: 500 });
  }
}
