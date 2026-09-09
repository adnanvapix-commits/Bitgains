import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const { isActive } = await req.json();
    if (typeof isActive !== 'boolean') return NextResponse.json({ success: false, message: 'isActive must be a boolean' }, { status: 400 });

    const { data: targetUser } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
    if (!targetUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    if (targetUser.role === 'admin' && !isActive) return NextResponse.json({ success: false, message: 'Cannot deactivate admin users' }, { status: 403 });

    await supabaseAdmin.from('profiles').update({ is_active: isActive }).eq('id', id);
    await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: isActive ? 'none' : '876000h' }).catch(() => {});

    return NextResponse.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    console.error('Update user status error:', err);
    return NextResponse.json({ success: false, message: 'Error updating user status' }, { status: 500 });
  }
}
