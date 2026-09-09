import { supabaseAdmin } from '../supabase-server';

const parsePercent = (val: string | undefined, fallback: number) => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n / 100 : fallback;
};

export const FIRST_DEPOSIT_BONUS_PERCENT = parsePercent(
  process.env.REFERRAL_FIRST_DEPOSIT_BONUS_PERCENT, 0.01
);

const REFERRAL_STRUCTURE = [
  { level: 1, percent: parsePercent(process.env.REFERRAL_LEVEL1_PERCENT, 0.08), field: 'referred_by' },
  { level: 2, percent: parsePercent(process.env.REFERRAL_LEVEL2_PERCENT, 0.04), field: 'referred_by_level2' },
  { level: 3, percent: parsePercent(process.env.REFERRAL_LEVEL3_PERCENT, 0.03), field: 'referred_by_level3' },
];

const fmt = (n = 0) => Math.round(n * 100000000) / 100000000;

export const distributeReferralRewards = async ({
  userId,
  depositAmount,
  sourceTransactionId = null,
}: {
  userId: string;
  depositAmount: number;
  sourceTransactionId?: string | null;
}) => {
  try {
    const amount = Number(depositAmount) || 0;
    if (!userId || amount <= 0) return { distributed: [] };

    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('name, email, referred_by, referred_by_level2, referred_by_level3')
      .eq('id', userId)
      .single();
    if (!user) return { distributed: [] };

    const distributed: { level: number; referrerId: string; commission: number }[] = [];

    for (const { level, percent, field } of REFERRAL_STRUCTURE) {
      if (!percent || percent <= 0) continue;
      const referrerId = (user as any)[field];
      if (!referrerId) continue;

      const commission = fmt(amount * percent);
      if (commission <= 0) continue;

      const { data: refWallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', referrerId)
        .single();
      if (!refWallet) continue;

      const earningsField = `referral_earnings_level${level}`;
      await supabaseAdmin.from('wallets').update({
        balance: refWallet.balance + commission,
        total_earnings: refWallet.total_earnings + commission,
        [earningsField]: ((refWallet as any)[earningsField] || 0) + commission,
        referral_earnings_total: (refWallet.referral_earnings_total || 0) + commission,
      }).eq('user_id', referrerId);

      await supabaseAdmin.from('transactions').insert({
        user_id: referrerId,
        type: 'referral_commission',
        amount: commission,
        status: 'completed',
        description: `Level ${level} referral commission from ${user.name || 'a downline user'} deposit`,
        metadata: { referralLevel: level, referredUserId: userId, sourceTransactionId },
      });

      distributed.push({ level, referrerId, commission });
    }

    return { distributed };
  } catch (err) {
    console.error('Error distributing referral rewards:', err);
    return { distributed: [], error: err };
  }
};
