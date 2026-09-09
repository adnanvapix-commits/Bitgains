import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { userId, amount, reason } = await req.json();
    if (!userId || !amount || !reason) return NextResponse.json({ success: false, message: 'userId, amount and reason are required' }, { status: 400 });

    const { data: targetUser } = await getSupabaseAdmin().from('profiles').select('email').eq('id', userId).single();
    if (!targetUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const { data: wallet } = await getSupabaseAdmin().from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return NextResponse.json({ success: false, message: 'User wallet not found' }, { status: 404 });

    const numAmount = parseFloat(amount);
    const prevBalance = wallet.balance;
    await getSupabaseAdmin().from('wallets').update({ balance: wallet.balance + numAmount, total_earnings: wallet.total_earnings + numAmount }).eq('user_id', userId);
    await getSupabaseAdmin().from('transactions').insert({ user_id: userId, type: 'manual_bonus', amount: numAmount, status: 'completed', description: `Admin bonus: ${reason}`, reviewed_by: user!.id, reviewed_at: new Date().toISOString() });
    await getSupabaseAdmin().from('audit_logs').insert({ admin_id: user!.id, admin_email: user!.email, target_user_id: userId, target_user_email: targetUser.email, action: 'MANUAL_ADD_BONUS', amount: numAmount, reason, previous_balance: prevBalance, new_balance: prevBalance + numAmount });

    return NextResponse.json({ success: true, message: 'Bonus added successfully' });
  } catch (err) {
    console.error('Manual bonus error:', err);
    return NextResponse.json({ success: false, message: 'Error adding bonus' }, { status: 500 });
  }
}
