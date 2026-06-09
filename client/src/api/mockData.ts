import type { Order, Trade, User } from '../../../shared/types';

const NOW = new Date().toISOString().replace('Z', '');
const minus = (mins: number) => new Date(Date.now() - mins * 60000).toISOString().replace('Z', '');

export const MOCK_USERS: User[] = [
  { npub: 'npub1demo1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1', fedi_username: 'satoshi_india', country: 'IN', preferred_currency: 'INR', trust_score: 92, created_at: minus(60 * 24 * 10) },
  { npub: 'npub1demo2bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2', fedi_username: 'btc_hodler_mumbai', country: 'IN', preferred_currency: 'INR', trust_score: 67, created_at: minus(60 * 24 * 5) },
  { npub: 'npub1demo3ccccccccccccccccccccccccccccccccccccccccccccccccc3', fedi_username: 'delhi_stacker', country: 'IN', preferred_currency: 'INR', trust_score: 45, created_at: minus(60 * 24 * 2) },
  { npub: 'npub1demo4ddddddddddddddddddddddddddddddddddddddddddddddddd4', fedi_username: 'bangalore_bits', country: 'IN', preferred_currency: 'USD', trust_score: 80, created_at: minus(60 * 24 * 7) },
];

export const MOCK_ORDERS: (Order & { poster_username: string; poster_trust_score: number })[] = [
  {
    id: 1,
    poster_npub: MOCK_USERS[0].npub,
    poster_username: 'satoshi_india',
    poster_trust_score: 92,
    type: 'BUY',
    btc_amount: 0.05,
    price_per_btc: 7200000,
    currency: 'INR',
    notes: 'UPI preferred. Quick trade, usually respond within 5 mins.',
    status: 'OPEN',
    created_at: minus(12),
  },
  {
    id: 2,
    poster_npub: MOCK_USERS[1].npub,
    poster_username: 'btc_hodler_mumbai',
    poster_trust_score: 67,
    type: 'SELL',
    btc_amount: 0.1,
    price_per_btc: 7350000,
    currency: 'INR',
    notes: 'NEFT only. Will confirm within 30 mins after transfer.',
    status: 'OPEN',
    created_at: minus(45),
  },
  {
    id: 3,
    poster_npub: MOCK_USERS[2].npub,
    poster_username: 'delhi_stacker',
    poster_trust_score: 45,
    type: 'BUY',
    btc_amount: 0.02,
    price_per_btc: 7100000,
    currency: 'INR',
    notes: 'IMPS ok. First few trades here, please be patient.',
    status: 'OPEN',
    created_at: minus(90),
  },
  {
    id: 4,
    poster_npub: MOCK_USERS[3].npub,
    poster_username: 'bangalore_bits',
    poster_trust_score: 80,
    type: 'SELL',
    btc_amount: 0.15,
    price_per_btc: 850,
    currency: 'USD',
    notes: 'Wise transfer accepted. Can also do USDT on Lightning.',
    status: 'OPEN',
    created_at: minus(180),
  },
  {
    id: 5,
    poster_npub: MOCK_USERS[0].npub,
    poster_username: 'satoshi_india',
    poster_trust_score: 92,
    type: 'SELL',
    btc_amount: 0.025,
    price_per_btc: 7280000,
    currency: 'INR',
    notes: 'PhonePe / GPay accepted.',
    status: 'OPEN',
    created_at: minus(5),
  },
];

export const MOCK_DEMO_USER: User = {
  npub: 'npub1yourdemoaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa9',
  fedi_username: 'demo_user',
  country: 'IN',
  preferred_currency: 'INR',
  trust_score: 55,
  created_at: NOW,
};

export const MOCK_ACTIVE_TRADE: Trade & { order: Order; poster_username: string; acceptor_username: string } = {
  id: 101,
  order_id: 2,
  poster_npub: MOCK_USERS[1].npub,
  acceptor_npub: MOCK_DEMO_USER.npub,
  poster_username: 'btc_hodler_mumbai',
  acceptor_username: 'demo_user',
  status: 'IN_PROGRESS',
  poster_confirmed: false,
  acceptor_confirmed: false,
  created_at: minus(8),
  order: { ...MOCK_ORDERS[1] },
};
