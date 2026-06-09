import db from './db/schema';

console.log('Seeding database...');

// Create demo users
const users = [
  { npub: 'npub1demo1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1', fedi_username: 'satoshi_india', country: 'IN', preferred_currency: 'INR', trust_score: 92 },
  { npub: 'npub1demo2bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2', fedi_username: 'btc_hodler_mumbai', country: 'IN', preferred_currency: 'INR', trust_score: 67 },
  { npub: 'npub1demo3ccccccccccccccccccccccccccccccccccccccccccccccccc3', fedi_username: 'delhi_stacker', country: 'IN', preferred_currency: 'INR', trust_score: 45 },
  { npub: 'npub1demo4ddddddddddddddddddddddddddddddddddddddddddddddddd4', fedi_username: 'bangalore_bits', country: 'IN', preferred_currency: 'USD', trust_score: 80 },
];

for (const u of users) {
  db.prepare(`
    INSERT OR IGNORE INTO users (npub, fedi_username, country, preferred_currency, trust_score)
    VALUES (?, ?, ?, ?, ?)
  `).run(u.npub, u.fedi_username, u.country, u.preferred_currency, u.trust_score);
}

// Create demo orders
const orders = [
  { poster_npub: users[0].npub, type: 'BUY',  btc_amount: 0.05, price_per_btc: 7200000, currency: 'INR', notes: 'UPI preferred. Quick trade.' },
  { poster_npub: users[1].npub, type: 'SELL', btc_amount: 0.1,  price_per_btc: 7350000, currency: 'INR', notes: 'NEFT only. Will confirm within 30 mins.' },
  { poster_npub: users[2].npub, type: 'BUY',  btc_amount: 0.02, price_per_btc: 7100000, currency: 'INR', notes: 'IMPS ok. First trade, please be patient.' },
  { poster_npub: users[3].npub, type: 'SELL', btc_amount: 0.15, price_per_btc: 850,      currency: 'USD', notes: 'Wise transfer accepted.' },
];

for (const o of orders) {
  db.prepare(`
    INSERT INTO orders (poster_npub, type, btc_amount, price_per_btc, currency, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
  `).run(o.poster_npub, o.type, o.btc_amount, o.price_per_btc, o.currency, o.notes);
}

console.log(`Seeded ${users.length} users and ${orders.length} orders.`);
