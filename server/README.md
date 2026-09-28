# Zap Server

The API is an Express 5 and TypeScript service backed by PostgreSQL through Prisma. Socket.IO handles direct-message delivery and live like/comment/follow notifications.

## Environment

Create `server/.env` with:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket
```

Use the database and cloud account intended for this environment. Keep `.env` out of version control.

## Commands

```powershell
npm install
npm run db:deploy
npm run dev
```

`npm run db:deploy` applies checked-in migrations to `DATABASE_URL`; it does not reset the database. `npm run build` compiles the server and `npm start` runs the compiled output.

## Demo Data

The seed is additive and repeatable. It creates only `zap_seed_*` identities and records, uses stable IDs/upserts, and does not delete existing content or set a reusable password for seeded accounts. It includes sample text/image/video posts, likes, comments, follows, and one bookmark. Image/video sample URLs are external.

Because the command writes to the database in `DATABASE_URL`, opt in explicitly. In PowerShell:

```powershell
$env:ZAP_SEED_DEMO_DATA = "1"
try { npm run db:seed } finally { Remove-Item Env:ZAP_SEED_DEMO_DATA -ErrorAction SilentlyContinue }
```

Re-running the command updates the same seed-owned rows rather than adding duplicates. Review `prisma/seed.ts` before using it against a production database.

## API and Realtime

The REST base path is `/api/v1`; the full endpoint contract is in [API_DOCUMENTATION.md](../API_DOCUMENTATION.md). Socket clients authenticate with the same bearer JWT. Notifications are currently transient server events; the browser stores received events locally.
