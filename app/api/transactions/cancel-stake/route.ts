import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;

  try {
    const { stakeId } = await req.json();
    const sb = getSupabaseAdmin();
    const uid = user!.id;

    // Look up the specific stake or get first active stake
    let stakeQuery = sb.from('stakes').select('*').eq('user_id', uid).eq('status', 'active');
    if (stakeId) stakeQuery = stakeQuery.eq('stake_id', stakeId);
    const { data: stakes } = await stakeQuery;

    if (!stakes || stakes.length === 0) {
      return NextResponse.json({ success: false, message: 'No active stake found' }, { status: 404 });
    }

    const stake = stakes[0];

    // Build the auto-ticket message
    const stakeInfo = `Stake ID: ${stake.stake_id}
Package: ${stake.package_type}
Amount: ${stake.amount} USDT
Start Date: ${new Date(stake.start_date).toLocaleDateString()}
End Date: ${new Date(stake.end_date).toLocaleDateString()}`;

    const subject = `Cancel Staking Request -- ${stake.stake_id}`;
    const description = `I would like to request cancellation of my active stake.

${stakeInfo}

Please process my cancellation request and contact me to discuss the next steps.

This ticket was automatically raised from the staking dashboard.`;

    // Create support ticket (issue)
    const { data: issue, error: issueErr } = await sb.from('issues').insert({
      user_id: uid,
      subject,
      description,
      priority: 'high',
      status: 'open',
      metadata: {
        type: 'stake_cancellation',
        stakeId: stake.stake_id,
        packageType: stake.package_type,
        amount: stake.amount,
        startDate: stake.start_date,
        endDate: stake.end_date,
      },
    }).select().single();

    if (issueErr) throw issueErr;

    // Send notification to user confirming ticket creation
    await sb.from('notifications').insert({
      user_id: uid,
      title: '📋 Cancellation Request Submitted',
      message: `Your stake cancellation request has been submitted (Ticket #${issue.id.slice(0, 8)}). Our support team will contact you shortly.`,
      type: 'info',
      action_url: '/support',
      is_broadcast: false,
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Cancellation request submitted. Our support team will contact you shortly.',
      data: {
        issue: {
          id: issue.id,
          subject: issue.subject,
          status: issue.status,
          createdAt: issue.created_at,
        },
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
