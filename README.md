# Small Business POS

Record a sale, update stock, print a receipt, and see today's revenue. Next.js and SQLite. The database starts empty.

## Setup

Node.js 24. Dependencies: Next.js, React, and `better-sqlite3`.

```bash
npm install
cp .env.example .env.local
```

Set `POS_PIN` (8+ characters) and `SESSION_SECRET` (32+ random characters). Optional: `STORE_NAME`, `DATABASE_PATH`.

```bash
npm run dev
```

Open http://localhost:3000. The database file is `data/pos.sqlite`. "Today" uses the server clock.

```bash
npm test
npm run build
npm start
```

## Deploy

Use a Node host with a disk that keeps `data/pos.sqlite`. Serverless hosts that wipe the filesystem will drop sales.

Set `POS_PIN`, `SESSION_SECRET`, and optionally `STORE_NAME` and `DATABASE_PATH`. Then `npm ci`, `npm run build`, and `npm start`.

The session cookie is `Secure` in production, so serve the app over HTTPS. Change the PIN before anyone else can reach the server.

`Dockerfile` runs the same server. Mount a volume at `/app/data`.
