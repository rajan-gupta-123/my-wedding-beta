# Wedding Guest RSVP Tracker

A single-organizer app for recording wedding guest replies and tracking the current confirmed count.

## Stack

- React and TypeScript client, built with Vite
- Node.js and TypeScript API, built with Express
- MongoDB using the official Node.js driver
- MongoDB-backed admin sessions

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+
- A MongoDB instance

## Getting started

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `SESSION_SECRET`.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Create the initial admin account:

   ```sh
   npm run admin:create
   ```

   The command prompts for a username and a password (the password is not echoed). It stores a bcrypt hash, never the plaintext password.
4. Start the client and API:

   ```sh
   npm run dev
   ```

   Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The client proxies `/api` requests to the API on port 3001.

## Useful commands

| Command | Description |
|---|---|
| `npm run dev` | Start the client and API in development |
| `npm run build` | Build both workspaces |
| `npm run typecheck` | Type-check both workspaces |
| `npm test` | Run focused API validation tests |
| `npm run start -w server` | Run the built API and serve the built client |
| `npm run admin:create` | Interactively add an admin account |

Build both workspaces before using the production start command. The API serves the client build from `client/dist`.

## Configuration

| Variable | Required | Default | Description |
|---|---:|---|---|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `MONGODB_DATABASE` | No | `wedding_rsvp` | Database name |
| `SESSION_SECRET` | Yes | — | Secret used to sign the session cookie; use a random value |
| `SESSION_TTL_SECONDS` | No | `604800` | Session lifetime in seconds |
| `PORT` | No | `3001` | API port |
| `NODE_ENV` | No | `development` | Set to `production` to enable secure cookies |

Admin sessions are stored in MongoDB and survive API process restarts. The session collection is an infrastructure collection managed by the session store; the app's data collections are `admins` and `guests`.

## API

All guest endpoints require an authenticated admin session. Login sets an HTTP-only session cookie.

| Method and path | Purpose |
|---|---|
| `POST /api/login` | Authenticate the admin |
| `GET /api/guests` | List guest IDs, names, and RSVP statuses |
| `GET /api/guests/summary` | Return the current confirmed count |
| `POST /api/guests` | Add a guest; omitted status defaults to `pending` |
| `PATCH /api/guests/:id` | Change a guest's RSVP status |

The guest list intentionally returns only `id`, `name`, and `status`; the create/update responses also return `phone` and `address`. Phone numbers are stored as strings to preserve prefixes and leading zeros. Each guest is a separate record, even when contact details are shared.

## Project layout

```text
client/
  src/
    app/
    components/
    features/
      auth/
      guests/
    lib/
    styles/
server/
  src/
    config/
    db/
    middleware/
    modules/
      auth/
      guests/
    scripts/
```
