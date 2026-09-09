import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../lib/api-auth';
import { getPaginationData } from '../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const action = searchParams.get('action');
  const adminId = searchParams.get('adminId');
  const targetUserId = searchParams.get('targetUserId');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = supabaseAdmin.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
    if (action) q = q.eq('action', action);
    if (adminId) q = q.eq('admin_id', adminId);
    if (targetUserId) q = q.eq('target_user_id', targetUserId);

    const { data: logs, count, error: qError } = await q;
    if (qError) throw qError;

    return NextResponse.json({ success: true, data: { logs: logs || [], pagination: getPaginationData(page, limit, count || 0) } });
  } catch (err) {
    console.error('Audit logs error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching audit logs' }, { status: 500 });
  }
}
