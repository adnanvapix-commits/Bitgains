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
  try {
    const sb = getSupabaseAdmin();
    let q = sb.from('issues').select('*', { count: 'exact' }).eq('user_id', user!.id).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (status) q = q.eq('status', status);
    const { data, count } = await q;
    return NextResponse.json({ success: true, data: { issues: data || [], pagination: getPaginationData(page, limit, count || 0) } });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
