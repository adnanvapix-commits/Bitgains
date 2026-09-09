import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';
import { getPaginationData } from '../../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminError = requireAdmin(user!);
  if (adminError) return adminError;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = supabaseAdmin.from('issues').select('*, profiles!issues_user_id_fkey(name, email)', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
    if (status) q = q.eq('status', status);
    if (priority) q = q.eq('priority', priority);
    const { data: issues, count, error: qError } = await q;
    if (qError) throw qError;

    // Stats
    const [{ count: openCount }, { count: inProgressCount }, { count: resolvedCount }, { count: urgentCount }] = await Promise.all([
      supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
      supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('priority', 'urgent'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        issues: issues || [],
        stats: { open: openCount || 0, inProgress: inProgressCount || 0, resolved: resolvedCount || 0, urgent: urgentCount || 0 },
        pagination: getPaginationData(page, limit, count || 0),
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error fetching issues' }, { status: 500 });
  }
}
