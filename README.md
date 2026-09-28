# Zap

Zap is a minimalist black-and-white social app with a React web client and an Express, Prisma, PostgreSQL, and Socket.IO backend. The interface uses Space Grotesk and supports posts, comments, likes, follows, saved posts, profile editing, search, messaging, and a vertical video feed.

## Repository

- [Client setup and routes](client/README.md)
- [Server setup, migrations, and seeding](server/README.md)
- [API documentation](API_DOCUMENTATION.md)
- [React architecture](REACT_ARCHITECTURE.md)

## Local Development

1. Configure `server/.env` using the variables in [server/README.md](server/README.md).
2. From `server/`, install dependencies, apply migrations with `npm run db:deploy`, then start the API with `npm run dev`.
3. Configure `client/.env.local` if needed, then from `client/` run `npm install` and `npm run dev`.
4. Open the Vite URL shown in the client terminal.

The client defaults to `http://localhost:3000/api/v1` on localhost and connects to Socket.IO at `http://localhost:3000`. Configure `VITE_API_URL` and `VITE_SOCKET_URL` to override those defaults.

## Demo Content

To add sample posts and interactions to the configured database, follow the explicit opt-in seeding instructions in [server/README.md](server/README.md). Seeding writes to the database specified by `DATABASE_URL` and should only be run against a database where demo content is desired.
