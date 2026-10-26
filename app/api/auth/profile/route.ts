import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const { data: profile } = await sb
      .from('profiles')
      .select('id, name, email, role, is_active, referral_code, created_at, last_login, aadhar_number, pan_number, permanent_address, date_of_birth')
      .eq('id', user!.id)
      .single();
    return NextResponse.json({ success: true, data: { profile } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { name, email, aadhar_number, pan_number, permanent_address, date_of_birth } = await req.json();
    const sb = getSupabaseAdmin();
    const updates: any = {};

    if (name)              updates.name              = name.trim();
    if (aadhar_number !== undefined) updates.aadhar_number    = aadhar_number?.trim() || null;
    if (pan_number    !== undefined) updates.pan_number       = pan_number?.trim()?.toUpperCase() || null;
    if (permanent_address !== undefined) updates.permanent_address = permanent_address?.trim() || null;
    if (date_of_birth !== undefined) updates.date_of_birth   = date_of_birth || null;

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
