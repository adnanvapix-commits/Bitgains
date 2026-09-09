import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  _id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  referralCode: string | null;
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`Missing env: NEXT_PUBLIC_SUPABASE_URL=${url ? 'OK' : 'MISSING'}, SUPABASE_SERVICE_ROLE_KEY=${key ? 'OK' : 'MISSING'}`);
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

  try {
    const supabase = getAdmin();

    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      return {
        user: null,
        error: NextResponse.json({ success: false, message: 'Invalid or expired token. Please login again.', code: 'INVALID_TOKEN' }, { status: 401 }),
      };
    }

    const { data: profile, error: profileError } = await supabase
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
  } catch (err: any) {
    console.error('[getAuthUser] error:', err.message);
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Server configuration error: ' + err.message }, { status: 500 }),
    };
  }
}

// Require admin role
export function requireAdmin(user: AuthUser): NextResponse | null {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Access denied. Admin privileges required.' }, { status: 403 });
  }
  return null;
}
