import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    const { error: updateError } = await getSupabaseAdmin().auth.admin.updateUserById(user!.id, { password: newPassword });
    if (updateError) throw updateError;
    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
