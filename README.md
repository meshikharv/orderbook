# Bitcoin P2P Orderbook

A full-stack Bitcoin P2P trading orderbook for the Indian Bitcoin community. Uses NOSTR npub as identity, designed to run as a Mini App inside the Fedi app with graceful fallback for desktop browsers.

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via `better-sqlite3`
- **Auth**: NOSTR npub identity (auto-detected from Fedi context)
- **Real-time**: WebSockets (`ws`) for live orderbook and trade status

---

## Project Structure

```
/
├── client/          React frontend (Vite + TypeScript)
├── server/          Express backend (TypeScript)
├── shared/          Shared TypeScript types
└── README.md
```

---

## Setup

### 1. Install dependencies

```bash
npm install          # installs root devDeps (concurrently)
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env:
#   PORT=3001
#   ADMIN_PASSWORD=your_secure_password
#   DB_PATH=./data/orderbook.db
```

### 3. Seed demo data (optional)

```bash
cd server && npm run seed
```

Creates 4 demo users (satoshi_india, btc_hodler_mumbai, delhi_stacker, bangalore_bits) and 4 open orders.

### 4. Start development servers

```bash
# From repo root — starts both server and client with hot reload:
npm run dev

# Or separately:
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

### 5. Access the app

- **User app**: http://localhost:5173
  - On desktop: enter any valid `npub1…` (e.g. from the seeded demo users)
  - On mobile inside Fedi: npub auto-detected

- **Admin dashboard**: http://localhost:5173/admin
  - Password: value of `ADMIN_PASSWORD` in `server/.env`

---

## Testing with seed data

After running the seed script, use one of these test npubs on the desktop fallback prompt:

```
npub1demo1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1   (satoshi_india, trust 92)
npub1demo2bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2   (btc_hodler_mumbai, trust 67)
npub1demo3ccccccccccccccccccccccccccccccccccccccccccccccccc3   (delhi_stacker, trust 45)
npub1demo4ddddddddddddddddddddddddddddddddddddddddddddddddd4   (bangalore_bits, trust 80)
```

---

## Environment Variables

| Variable         | Default                  | Description                              |
|------------------|--------------------------|------------------------------------------|
| `PORT`           | `3001`                   | Express server port                      |
| `ADMIN_PASSWORD` | *(required)*             | Password for the `/admin` dashboard      |
| `DB_PATH`        | `./data/orderbook.db`    | SQLite database file path                |

---

## API Overview

All user-facing endpoints require the `X-User-Npub` header. Admin endpoints require `X-Admin-Password`.

| Method | Path                          | Description                      |
|--------|-------------------------------|----------------------------------|
| GET    | `/api/users/me`               | Check if user is onboarded       |
| POST   | `/api/users/onboard`          | Complete onboarding              |
| GET    | `/api/orders`                 | List open orders                 |
| POST   | `/api/orders`                 | Post a new order                 |
| DELETE | `/api/orders/:id`             | Cancel your order                |
| POST   | `/api/trades/accept/:order_id`| Accept an order (start trade)    |
| GET    | `/api/trades/active`          | Get your active trade            |
| GET    | `/api/trades/:id`             | Get trade details                |
| POST   | `/api/trades/:id/confirm`     | Mark trade as complete           |
| POST   | `/api/trades/:id/dispute`     | Raise a dispute                  |
| GET    | `/api/admin/stats`            | Admin: stats                     |
| GET    | `/api/admin/disputes`         | Admin: open disputes             |
| POST   | `/api/admin/disputes/:id/rule`| Admin: rule on dispute           |
| GET    | `/api/admin/users`            | Admin: user list                 |
| POST   | `/api/admin/users/:npub/trust`| Admin: adjust trust score        |
| GET    | `/api/admin/trades`           | Admin: all trades                |
| GET    | `/api/admin/orders`           | Admin: all orders                |

---

## Trust Score System

| Event                               | Delta |
|-------------------------------------|-------|
| Starting score                      | 50    |
| Trade closed successfully           | +5    |
| Admin rules dispute against you     | -15   |
| Trade abandoned (auto-expire 48h)   | -10   |

Score range: 0–100. Color coding: 80–100 = Trusted (green), 50–79 = Neutral (yellow), 0–49 = Caution (red).

---

## Fedi Integration TBDs

These items need confirmation from the Fedi team before production deployment:

### 1. Confirmed npub injection method

Currently the app checks for the npub in this order:

1. `?npub=npub1…` URL query param
2. `window.fedi.npub` or `window.fedi.getUser().npub` (Fedi JS bridge)
3. `localStorage` cache from a previous session

**TBD**: The exact API surface for `window.fedi` inside a Fedi Mini App. Reference: https://docs.fedi.xyz

The detection logic lives in `client/src/hooks/useFediIdentity.ts`.

### 2. Confirmed deep link format for Fedi DMs

The Trade Room currently generates chat deep links in the format:

```
fedi://chat/[fedi_username]
```

**TBD**: The exact deep link scheme and parameter format supported by Fedi for opening a DM with another user by username or npub.

The link is constructed in `client/src/pages/TradeRoom.tsx` in the `fediChatLink()` function.

---

## Production Deployment Notes

- Set `NODE_ENV=production` and use `npm run build` for production builds.
- Serve the built client (`client/dist/`) as static files from the Express server or a CDN.
- Use a process manager like `pm2` for the Node.js server.
- The SQLite database file should be on persistent storage (not ephemeral).
- `ADMIN_PASSWORD` must be a strong password in production — the admin panel can adjust trust scores and rule on disputes.
