import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const { data: targetUser } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
    if (!targetUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    if (targetUser.role === 'admin') return NextResponse.json({ success: false, message: 'Cannot delete admin users' }, { status: 403 });

    // Delete related data
    const { count: txCount } = await supabaseAdmin.from('transactions').delete({ count: 'exact' }).eq('user_id', id);
    await supabaseAdmin.from('stakes').delete().eq('user_id', id);
    await supabaseAdmin.from('wallets').delete().eq('user_id', id);
    await supabaseAdmin.from('issues').delete().eq('user_id', id);
    // Nullify referral chains
    await supabaseAdmin.from('profiles').update({ referred_by: null }).eq('referred_by', id);
    await supabaseAdmin.from('profiles').update({ referred_by_level2: null }).eq('referred_by_level2', id);
    // Delete auth user (cascades profile)
    await supabaseAdmin.auth.admin.deleteUser(id);

    return NextResponse.json({ success: true, data: { deletedUser: targetUser, transactionsDeleted: txCount || 0 } });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ success: false, message: 'Error deleting user' }, { status: 500 });
  }
}
