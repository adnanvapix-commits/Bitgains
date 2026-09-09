import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { getPaginationData } from '../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = getSupabaseAdmin().from('issues').select('*', { count: 'exact' }).eq('user_id', user!.id).order('created_at', { ascending: false }).range(from, to);
    if (status) q = q.eq('status', status);
    const { data: issues, count, error: qError } = await q;
    if (qError) throw qError;

    return NextResponse.json({ success: true, data: { issues: issues || [], pagination: getPaginationData(page, limit, count || 0) } });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error fetching issues' }, { status: 500 });
  }
}
