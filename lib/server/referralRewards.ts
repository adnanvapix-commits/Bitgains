import { getSupabaseAdmin } from '../supabase-server';

const pct = (val: string | undefined, def: number) => { const n = Number(val); return Number.isFinite(n) && n > 0 ? n / 100 : def; };
export const FIRST_DEPOSIT_BONUS_PERCENT = pct(process.env.REFERRAL_FIRST_DEPOSIT_BONUS_PERCENT, 0.01);
const fmt = (n: number) => Math.round(n * 1e8) / 1e8;

const LEVELS = [
  { level: 1, percent: () => pct(process.env.REFERRAL_LEVEL1_PERCENT, 0.08), field: 'referred_by' },
  { level: 2, percent: () => pct(process.env.REFERRAL_LEVEL2_PERCENT, 0.04), field: 'referred_by_level2' },
  { level: 3, percent: () => pct(process.env.REFERRAL_LEVEL3_PERCENT, 0.02), field: 'referred_by_level3' },
];

export const distributeReferralRewards = async ({ userId, depositAmount, sourceTransactionId = null }: { userId: string; depositAmount: number; sourceTransactionId?: string | null }) => {
  try {
    const amount = Number(depositAmount) || 0;
    if (!userId || amount <= 0) return { distributed: [] };
    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase.from('profiles').select('name, email, referred_by, referred_by_level2, referred_by_level3').eq('id', userId).single();
    if (!user) return { distributed: [] };
    const distributed: any[] = [];
    for (const { level, percent, field } of LEVELS) {
      const p = percent();
      const referrerId = (user as any)[field];
      if (!p || !referrerId) continue;
      const commission = fmt(amount * p);
      if (commission <= 0) continue;
      const { data: w } = await supabase.from('wallets').select('*').eq('user_id', referrerId).single();
      if (!w) continue;
      await supabase.from('wallets').update({
        balance: w.balance + commission,
        total_earnings: w.total_earnings + commission,
        [`referral_earnings_level${level}`]: ((w as any)[`referral_earnings_level${level}`] || 0) + commission,
        referral_earnings_total: (w.referral_earnings_total || 0) + commission,
      }).eq('user_id', referrerId);
      await supabase.from('transactions').insert({
        user_id: referrerId, type: 'referral_commission', amount: commission, status: 'completed',
        description: `Level ${level} referral commission from ${user.name || 'downline'} deposit`,
        metadata: { referralLevel: level, referredUserId: userId, sourceTransactionId },
      });
      distributed.push({ level, referrerId, commission });
    }
    return { distributed };
  } catch (err) { return { distributed: [], error: err }; }
};
