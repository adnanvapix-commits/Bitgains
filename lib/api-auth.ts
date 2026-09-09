import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase-server';

export interface AuthUser {
  id: string;
  _id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  referralCode: string | null;
}

// Verify JWT from Authorization header and return the user profile
export async function getAuthUser(req: NextRequest): Promise<{ user: AuthUser | null; error: NextResponse | null }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Access denied. No token provided.' }, { status: 401 }),
    };
  }

  const token = authHeader.split(' ')[1];

  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Invalid or expired token. Please login again.', code: 'INVALID_TOKEN' }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name, role, is_active, referral_code, referral_count, referral_earnings')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'User profile not found.' }, { status: 401 }),
    };
  }

  if (!profile.is_active) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Account has been deactivated.' }, { status: 401 }),
    };
  }

  return {
    user: {
      id: profile.id,
      _id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      is_active: profile.is_active,
      referralCode: profile.referral_code,
    },
    error: null,
  };
}

// Require admin role
export function requireAdmin(user: AuthUser): NextResponse | null {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Access denied. Admin privileges required.' }, { status: 403 });
  }
  return null;
}
