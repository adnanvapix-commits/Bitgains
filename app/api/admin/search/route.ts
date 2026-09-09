import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');

  if (q.length < 2) return NextResponse.json({ success: false, message: 'Search query must be at least 2 characters' }, { status: 400 });

  try {
    const [
      { data: users },
      { data: transactions },
      { data: issues },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, name, email, role, is_active, created_at, referral_code').or(`email.ilike.%${q}%,name.ilike.%${q}%,referral_code.ilike.%${q}%`).limit(limit),
      supabaseAdmin.from('transactions').select('id, user_id, type, amount, status, created_at, description').or(`description.ilike.%${q}%,tx_hash.ilike.%${q}%`).limit(limit),
      supabaseAdmin.from('issues').select('id, user_id, subject, status, priority, created_at').or(`subject.ilike.%${q}%,description.ilike.%${q}%`).limit(limit),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        query: q,
        counts: { users: users?.length || 0, transactions: transactions?.length || 0, issues: issues?.length || 0 },
        results: { users: users || [], transactions: transactions || [], issues: issues || [] },
      },
    });
  } catch (err) {
    console.error('Admin search error:', err);
    return NextResponse.json({ success: false, message: 'Error performing search' }, { status: 500 });
  }
}
