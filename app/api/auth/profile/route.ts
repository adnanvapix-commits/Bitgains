import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

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
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
