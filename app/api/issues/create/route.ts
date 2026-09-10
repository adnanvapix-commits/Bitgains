import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';
import { getClientIP, getUserAgent } from '../../../../lib/server/helpers';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { subject, description, priority = 'medium' } = await req.json();
    if (!subject || !description) return NextResponse.json({ success: false, message: 'Subject and description required' }, { status: 400 });
    const { data: issue, error: e } = await getSupabaseAdmin().from('issues').insert({ user_id: user!.id, subject: subject.trim(), description: description.trim(), priority, status: 'open', metadata: { ipAddress: getClientIP(req), userAgent: getUserAgent(req) } }).select().single();
    if (e) throw e;
    return NextResponse.json({ success: true, message: 'Issue submitted successfully.', data: { issue: { id: issue.id, subject: issue.subject, description: issue.description, priority: issue.priority, status: issue.status, createdAt: issue.created_at } } }, { status: 201 });
  } catch (err: any) { return NextResponse.json({ success: false, message: err.message }, { status: 500 }); }
}
