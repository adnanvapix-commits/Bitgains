import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase-server';
import { getAuthUser, requireAdmin } from '../../../../../lib/api-auth';
import { sanitizeTransactionId, isValidUUID } from '../../../../../lib/server/helpers';

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser(req);
  if (error) return error;
  const adminErr = requireAdmin(user!);
  if (adminErr) return adminErr;

  try {
    const { searchParams } = new URL(req.url);
    const testType = searchParams.get('type') || 'connectivity';

    const sb = getSupabaseAdmin();
    const results: any = {
      testType,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Database connectivity
    if (testType === 'connectivity' || testType === 'all') {
      try {
        const { data, error } = await sb.from('transactions').select('id').limit(1);
        results.tests.connectivity = {
          success: !error,
          error: error?.message,
          recordsFound: data?.length || 0
        };
      } catch (err: any) {
        results.tests.connectivity = {
          success: false,
          error: err.message
        };
      }
    }

    // Test 2: Transaction queries
    if (testType === 'queries' || testType === 'all') {
      try {
        const { data: pendingTxs, error: pendingError } = await sb
          .from('transactions')
          .select('id, type, amount, status, user_id, created_at')
          .eq('status', 'pending')
          .limit(5);

        const { data: completedTxs, error: completedError } = await sb
          .from('transactions')
          .select('id, type, amount, status, user_id, created_at')
          .eq('status', 'completed')
          .limit(5);

        results.tests.queries = {
          pending: {
            success: !pendingError,
            error: pendingError?.message,
            count: pendingTxs?.length || 0,
            transactions: pendingTxs?.slice(0, 3) || []
          },
          completed: {
            success: !completedError,
            error: completedError?.message,
            count: completedTxs?.length || 0,
            transactions: completedTxs?.slice(0, 3) || []
          }
        };
      } catch (err: any) {
        results.tests.queries = {
          success: false,
          error: err.message
        };
      }
    }

    // Test 3: UUID validation
    if (testType === 'uuid' || testType === 'all') {
      const testIds = [
        '123e4567-e89b-12d3-a456-426614174000', // valid UUID
        'invalid-uuid',
        '',
        '123e4567-e89b-12d3-a456-42661417400', // missing char
        '123e4567-e89b-12d3-a456-4266141740000' // extra char
      ];

      results.tests.uuid = testIds.map(id => {
        const validation = sanitizeTransactionId(id);
        return {
          input: id,
          isValid: validation.isValid,
          sanitized: validation.sanitizedId,
          error: validation.error
        };
      });
    }

    // Test 4: Specific transaction lookup
    if (testType === 'lookup' || testType === 'all') {
      const transactionId = searchParams.get('id');
      if (transactionId) {
        const validation = sanitizeTransactionId(transactionId);
        if (validation.isValid) {
          try {
            const { data: tx, error: txError } = await sb
              .from('transactions')
              .select('*, profiles!transactions_user_id_fkey(id, name, email)')
              .eq('id', validation.sanitizedId)
              .single();

            results.tests.lookup = {
              requestedId: transactionId,
              sanitizedId: validation.sanitizedId,
              found: !!tx && !txError,
              error: txError?.message,
              transaction: tx ? {
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                status: tx.status,
                user_id: tx.user_id,
                created_at: tx.created_at
              } : null
            };
          } catch (err: any) {
            results.tests.lookup = {
              requestedId: transactionId,
              sanitizedId: validation.sanitizedId,
              found: false,
              error: err.message
            };
          }
        } else {
          results.tests.lookup = {
            requestedId: transactionId,
            found: false,
            error: `Invalid UUID: ${validation.error}`
          };
        }
      } else {
        results.tests.lookup = {
          error: 'No transaction ID provided. Use ?id=<uuid> parameter'
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test completed',
      data: results
    });

  } catch (err: any) {
    console.error('Test endpoint error:', err);
    return NextResponse.json({ 
      success: false, 
      message: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}

// Instructions for using this endpoint:
// GET /api/admin/transactions/test?type=all - Run all tests
// GET /api/admin/transactions/test?type=connectivity - Test DB connection
// GET /api/admin/transactions/test?type=queries - Test transaction queries
// GET /api/admin/transactions/test?type=uuid - Test UUID validation
// GET /api/admin/transactions/test?type=lookup&id=<uuid> - Test specific transaction lookup