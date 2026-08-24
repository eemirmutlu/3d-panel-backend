# 3D Blog Backend API

Production-ready Node.js REST API for a blog and content platform — **Authentication module**.

Built with Clean Architecture principles; designed to scale incrementally with additional modules (posts, comments, tags, notifications, subscriptions, admin).

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript (strict) |
| Framework | Express.js |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT) |
| Validation | Zod |
| Docs | Swagger UI / OpenAPI 3.0 |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Linting | ESLint (flat config) |
| Formatting | Prettier |
| Deployment | Vercel (serverless) |

---

## Project Structure

```
src/
├── config/
│   ├── env.ts              ← Env variable validation & typed config
│   └── supabase.ts         ← Supabase client factory (anon + admin)
│
├── modules/
│   └── auth/               ← Self-contained auth module
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.repository.ts
│       ├── auth.routes.ts
│       └── auth.validator.ts
│
├── middlewares/
│   ├── auth.middleware.ts       ← authenticate + authorize(role)
│   ├── error.middleware.ts      ← Global error handler
│   └── validation.middleware.ts ← Zod schema validation factory
│
├── types/
│   ├── auth.types.ts       ← Domain types
│   ├── database.types.ts   ← Supabase DB types (auto-generate in CI)
│   └── express.d.ts        ← req.user augmentation
│
├── utils/
│   ├── api-response.ts     ← sendSuccess / sendCreated / sendError
│   └── errors.ts           ← AppError hierarchy
│
├── docs/
│   └── swagger.ts          ← OpenAPI 3.0 spec + Swagger UI setup
│
├── routes/
│   └── index.ts            ← Central route registry (/api/v1, /api/health)
│
├── app.ts                  ← Express app (exported for Vercel)
└── server.ts               ← Local dev entry point
```

---

## 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/3d-blog-backend.git
cd 3d-blog-backend

# Install dependencies
npm install
```

---

## 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `SUPABASE_URL` | **Yes** | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role key — **never expose to frontend** |
| `CORS_ORIGIN` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: `900000` = 15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: `100`) |

> **Security:** Never commit `.env` to version control. The `.gitignore` already excludes it.

---

## 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

3. In Supabase Dashboard → **Authentication → Settings**:
   - Set **Site URL** to your app's URL
   - For local development, add `http://localhost:3000` to allowed redirect URLs
   - **Disable email confirmation** for local development (optional — simplifies testing)

---

## 4. Database Migrations

Run all migration SQL files in order in the Supabase SQL Editor:

1. **`001_create_profiles.sql`** — Base `profiles` table, auto-create trigger from Auth, RLS.
2. **`002_add_locale_and_media.sql`** — `locale` column in profiles, base `media` table.
3. **`003_media_url_storage.sql`** — Upgrades `media` to URL-based Supabase Storage approach.
4. **`004_profiles_extend.sql`** — Adds `username`, `bio`, `website_url`, `location`, `is_verified` (blue tick), `is_private`, constraints, indexes, and enables **Supabase Realtime**.

---

## 5. Local Development

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

Available endpoints:
- **Swagger UI:** `http://localhost:3000/api/docs`
- **Health:** `http://localhost:3000/api/health`
- **API:** `http://localhost:3000/api/v1`

---

## 6. Swagger Usage

1. Open `http://localhost:3000/api/docs`
2. Register a user: **POST /api/v1/auth/register**
3. Copy the `accessToken` from the response
4. Click the **Authorize 🔒** button
5. Enter your token (just the token, not "Bearer ")
6. Protected endpoints (`/me`, `/logout`) are now accessible

---

## 7. API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | ✗ | Register a new account (accepts `locale`) |
| `POST` | `/api/v1/auth/login` | ✗ | Login (accepts `locale`, updates stored preference) |
| `POST` | `/api/v1/auth/logout` | ✓ | Logout (invalidate session) |
| `GET` | `/api/v1/auth/me` | ✓ | Get current user profile |
| `POST` | `/api/v1/auth/refresh` | ✗ | Refresh access token |

### Profiles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/profiles/me` | ✓ | Get own full profile (ID not in URL) |
| `PATCH` | `/api/v1/profiles/me` | ✓ | Update own profile (name, username, bio, avatarUrl, websiteUrl, location, isPrivate, locale) |
| `DELETE` | `/api/v1/profiles/me` | ✓ | Soft-delete own account |
| `GET` | `/api/v1/profiles/username/:username` | ✗ | Public profile lookup by @username (filters private profiles) |
| `GET` | `/api/v1/profiles/:userId` | ✗ | Public profile lookup by UUID (filters private profiles) |

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | ✗ | Health check |
| `GET` | `/api/docs` | ✗ | Swagger UI |
| `GET` | `/api/docs.json` | ✗ | OpenAPI JSON spec |

### Authentication Flow

```
Client                          API                       Supabase Auth
  │                              │                              │
  │  POST /auth/register         │                              │
  │  { email, password, name }   │                              │
  │─────────────────────────────>│                              │
  │                              │  signUp(email, password)     │
  │                              │─────────────────────────────>│
  │                              │    { user, session }         │
  │                              │<─────────────────────────────│
  │                              │  INSERT INTO profiles        │
  │                              │────────────────────>         │
  │  201 { user, tokens }        │                              │
  │<─────────────────────────────│                              │
  │                              │                              │
  │  GET /auth/me                │                              │
  │  Authorization: Bearer <jwt> │                              │
  │─────────────────────────────>│                              │
  │                              │  getUser(token)              │
  │                              │─────────────────────────────>│
  │                              │    { user }                  │
  │                              │<─────────────────────────────│
  │  200 { profile }             │                              │
  │<─────────────────────────────│                              │
```

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "Emir", "role": "user" },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresAt": 1704067200,
      "tokenType": "bearer"
    }
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": { "code": "INVALID_CREDENTIALS" }
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "password", "message": "Password must contain at least one special character" }
  ]
}
```

---

## 8. Build

```bash
npm run build
```

Compiles TypeScript to `dist/`. The `dist/` folder is what Vercel deploys.

---

## 9. Vercel Deployment

### Prerequisites

- A [Vercel account](https://vercel.com)
- Vercel CLI: `npm install -g vercel`

### Deploy

```bash
# First time setup
vercel

# Deploy to production
vercel --prod
```

### Production Environment Variables

Set the following in Vercel Dashboard → **Project → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `CORS_ORIGIN` | Your frontend domain (e.g., `https://yourdomain.com`) |

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` must be added as a **Secret** (not a plain env var) for security.

### Deployment Notes

- Vercel imports `dist/app.js` directly as a serverless function
- `server.ts` is only used for local development
- Each request spins up a cold-start function — stateless design ensures this works correctly
- The Supabase clients are singletons within each function invocation

---

## 10. Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled output (production)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check (CI)
npm run type-check   # TypeScript compile check (no emit)
```

---

## 11. Adding New Modules

To add a new module (e.g., `posts`):

1. Create `src/modules/posts/` with:
   - `posts.validator.ts` (Zod schemas)
   - `posts.repository.ts` (DB queries)
   - `posts.service.ts` (business logic)
   - `posts.controller.ts` (HTTP layer)
   - `posts.routes.ts` (route definitions)

2. Register in `src/routes/index.ts`:
   ```ts
   import postsRouter from '../modules/posts/posts.routes';
   v1Router.use('/posts', postsRouter);
   ```

3. Add types to `src/types/database.types.ts`

4. Create SQL migration in `supabase/migrations/`

5. Add Swagger paths to `src/docs/swagger.ts`

---

## 12. Security Considerations

- **Service role key** is never sent in API responses or logged
- **Passwords** are handled entirely by Supabase Auth (bcrypt internally)
- **SQL injection** is prevented by Supabase's parameterized queries
- **Stack traces** are never exposed to clients in production
- **Authorization header** is never logged by Morgan
- **Rate limiting** protects against brute force attacks
- **CORS** is restricted to configured origins in production
- **RLS policies** ensure database-level access control

---

## 13. TypeScript Database Types (CI Automation)

The file `src/types/database.types.ts` is currently maintained manually.
In CI, generate it automatically using the Supabase CLI:

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  --schema public \
  > src/types/database.types.ts
```

---

## License

MIT
