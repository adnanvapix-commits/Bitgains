import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

// GET  /api/users/auto-compound  — load current compound settings
export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const { data: wallet, error: wErr } = await sb
      .from('wallets')
      .select('auto_compound_enabled, auto_compound_percent, auto_compound_frequency, auto_compound_threshold')
      .eq('user_id', user!.id)
      .single();

    if (wErr || !wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled:   wallet.auto_compound_enabled   ?? false,
        percent:   wallet.auto_compound_percent   ?? 100,
        frequency: wallet.auto_compound_frequency ?? 'monthly',
        threshold: wallet.auto_compound_threshold ?? 50,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT  /api/users/auto-compound  — save compound settings
export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const body = await req.json();
    const { enabled, percent, frequency, threshold } = body;

    // Validate
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, message: 'enabled must be a boolean' }, { status: 400 });
    }
    if (percent !== undefined && (percent < 10 || percent > 100)) {
      return NextResponse.json({ success: false, message: 'percent must be between 10 and 100' }, { status: 400 });
    }
    if (frequency !== undefined && !['30days', '90days'].includes(frequency)) {
      return NextResponse.json({ success: false, message: 'frequency must be 30days or 90days' }, { status: 400 });
    }
    if (threshold !== undefined && threshold < 0) {
      return NextResponse.json({ success: false, message: 'threshold must be >= 0' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const updateData: any = {
      auto_compound_enabled: enabled,
    };
    if (percent    !== undefined) updateData.auto_compound_percent    = percent;
    if (frequency  !== undefined) updateData.auto_compound_frequency  = frequency;
    if (threshold  !== undefined) updateData.auto_compound_threshold  = parseFloat(threshold);

    const { error: uErr } = await sb
      .from('wallets')
      .update(updateData)
      .eq('user_id', user!.id);

    if (uErr) {
      console.error('Auto-compound update error:', uErr);
      return NextResponse.json({ success: false, message: uErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-compound settings saved successfully',
      data: { enabled, percent, frequency, threshold },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
