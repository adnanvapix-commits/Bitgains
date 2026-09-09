import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { name, email } = await req.json();
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();

    if (email !== undefined && email !== user!.email) {
      const { data: existing } = await getSupabaseAdmin().from('profiles').select('id').eq('email', email).neq('id', user!.id).single();
      if (existing) return NextResponse.json({ success: false, message: 'Email is already in use' }, { status: 400 });
      updates.email = email;
      await getSupabaseAdmin().auth.admin.updateUserById(user!.id, { email });
    }

    const { data: updatedUser } = await getSupabaseAdmin().from('profiles').update(updates).eq('id', user!.id).select().single();
    return NextResponse.json({ success: true, message: 'Profile updated successfully', data: { user: updatedUser } });
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ success: false, message: 'Error updating profile' }, { status: 500 });
  }
}
