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

    const prevBalance = wallet.balance;
    const numAmount = parseFloat(amount);
    await supabaseAdmin.from('wallets').update({ balance: wallet.balance + numAmount, total_deposited: wallet.total_deposited + numAmount }).eq('user_id', userId);
    await supabaseAdmin.from('transactions').insert({ user_id: userId, type: 'admin_credit', amount: numAmount, status: 'completed', description: `Admin credit: ${reason}`, metadata: { adminId: user!.id, reason } });
    await supabaseAdmin.from('audit_logs').insert({ admin_id: user!.id, admin_email: user!.email, target_user_id: userId, target_user_email: targetUser.email, action: 'MANUAL_ADD_BALANCE', amount: numAmount, reason, previous_balance: prevBalance, new_balance: prevBalance + numAmount });

    return NextResponse.json({ success: true, message: 'Balance added successfully', data: { wallet: { previousBalance: prevBalance, newBalance: prevBalance + numAmount, amountAdded: numAmount } } });
  } catch (err) {
    console.error('Manual add balance error:', err);
    return NextResponse.json({ success: false, message: 'Error adding balance' }, { status: 500 });
  }
}
