import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { getAuthUser } from '../../../../lib/api-auth';

const MAX_ADDRESSES = 5;

// GET /api/auth/address-book — list all saved addresses for the logged-in user
export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const sb = getSupabaseAdmin();
    const { data, error: dbErr } = await sb
      .from('address_book')
      .select('id, label, address, network, is_verified, is_default, last_used_at, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (dbErr) throw dbErr;
    return NextResponse.json({ success: true, data: { addresses: data || [] } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/auth/address-book — save a new address (max 5)
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { label, address, network = 'TRC-20', is_default = false } = await req.json();

    if (!label?.trim() || !address?.trim()) {
      return NextResponse.json({ success: false, message: 'Label and address are required' }, { status: 400 });
    }
    if (label.trim().length > 100) {
      return NextResponse.json({ success: false, message: 'Label must be under 100 characters' }, { status: 400 });
    }
    if (address.trim().length < 10 || address.trim().length > 200) {
      return NextResponse.json({ success: false, message: 'Invalid address length' }, { status: 400 });
    }
    if (!['ERC-20', 'TRC-20', 'BEP-20'].includes(network)) {
      return NextResponse.json({ success: false, message: 'Invalid network' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    // Enforce 5-address limit
    const { count } = await sb
      .from('address_book')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id);

    if ((count ?? 0) >= MAX_ADDRESSES) {
      return NextResponse.json({
        success: false,
        message: `You can save a maximum of ${MAX_ADDRESSES} addresses. Please delete one before adding a new one.`,
      }, { status: 400 });
    }

    // If marking as default, clear other defaults first
    if (is_default) {
      await sb.from('address_book').update({ is_default: false }).eq('user_id', user!.id);
    }

    const { data, error: dbErr } = await sb
      .from('address_book')
      .insert({
        user_id: user!.id,
        label: label.trim(),
        address: address.trim(),
        network,
        is_default,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;
    return NextResponse.json({ success: true, data: { address: data } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/auth/address-book?id=<uuid>
export async function DELETE(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Address ID required' }, { status: 400 });

    const sb = getSupabaseAdmin();
    const { error: dbErr } = await sb
      .from('address_book')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id); // ensure user can only delete own addresses

    if (dbErr) throw dbErr;
    return NextResponse.json({ success: true, message: 'Address deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH /api/auth/address-book — update last_used_at when address is used for withdrawal
export async function PATCH(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'Address ID required' }, { status: 400 });

    const sb = getSupabaseAdmin();
    await sb.from('address_book')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
