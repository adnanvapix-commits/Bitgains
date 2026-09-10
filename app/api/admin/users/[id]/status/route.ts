import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../../lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;
  try {
    const { id } = await params;
    const { isActive } = await req.json();
    if (typeof isActive !== 'boolean') return NextResponse.json({ success: false, message: 'isActive must be boolean' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: target } = await sb.from('profiles').select('role').eq('id', id).single();
    if (!target) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    if (target.role === 'admin' && !isActive) return NextResponse.json({ success: false, message: 'Cannot deactivate admin' }, { status: 403 });
    await sb.from('profiles').update({ is_active: isActive }).eq('id', id);
    await sb.auth.admin.updateUserById(id, { ban_duration: isActive ? 'none' : '876000h' }).catch(() => {});
    return NextResponse.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}

// Support PATCH too (frontend uses PATCH)
export const PATCH = PUT;
