# Amebo 'n Tech

A Next.js App Router blog CMS with TypeScript, Tailwind CSS, Prisma/PostgreSQL, Cloudinary, Markdown, signed admin sessions, and shared login rate limiting.

## Stack and features

- Public responsive homepage and article pages
- Markdown rendering with GitHub Flavored Markdown
- Protected admin area with create/edit/delete, drafts, and publishing
- Cloudinary cover uploads with MIME and size checks
- PostgreSQL database with separate pooled and direct connection strings
- Signed, HTTP-only admin session cookie
- Upstash Redis-backed sliding-window login rate limit (5 attempts / 15 minutes)
- Basic security headers and database health endpoint
- Scheduled PostgreSQL backups through GitHub Actions

## Requirements

- Node.js 20.9+
- PostgreSQL database (Neon, Supabase, or another managed PostgreSQL provider)
- Upstash Redis REST database for shared rate limiting
- Cloudinary account for image uploads

## Local setup

1. Install packages:

   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in the values.

   Generate `AUTH_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. For a fresh database, create a migration:

   ```bash
   npx prisma migrate dev --name init
   ```

   For a deployed database, apply committed migrations:

   ```bash
   npm run db:deploy
   ```

4. Run checks and start the app:

   ```bash
   npm run typecheck
   npm test
   npm run dev
   ```

5. Visit `http://localhost:3000`; admin login is at `/admin/login`.

## Environment variables

- `DATABASE_URL`: pooled PostgreSQL URL used by the application. Use the provider's pooled connection URL where supported.
- `DIRECT_URL`: direct PostgreSQL URL used by Prisma migrations and backup jobs.
- `AUTH_SECRET`: random secret, at least 32 characters.
- `ADMIN_PASSWORD`: long, unique admin password. Never commit `.env.local`.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: shared rate limiter. Required in production; login fails closed if the limiter is unavailable.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server-side upload credentials.
- `NEXT_PUBLIC_SITE_URL`: canonical public site URL, such as `https://your-domain.example`.

## Automated database backups

1. Push this repository to a private GitHub repository.
2. In repository Settings → Secrets and variables → Actions, add `DIRECT_URL` as an Actions secret.
3. Enable GitHub Actions. The workflow runs daily at 03:23 UTC and can also be triggered manually.
4. Download the generated compressed SQL artifact from the workflow run. Artifacts are retained for 30 days.

A local backup can be made with `DIRECT_URL=... ./scripts/backup-postgres.sh`. Local backups are retained for 14 days by default.

For stronger disaster recovery, enable the database provider's native point-in-time recovery and export copies to a separate storage account. GitHub artifacts are an additional backup path, not a replacement for provider-native recovery.

## Production checklist

- Deploy to a Node-compatible Next.js host and set all environment variables in the hosting dashboard.
- Set `NODE_ENV=production` through the platform and use HTTPS.
- Configure `NEXT_PUBLIC_SITE_URL` to the real canonical domain.
- Configure a managed PostgreSQL database, pooled `DATABASE_URL`, and direct `DIRECT_URL`.
- Run `npm run db:deploy` as a deployment migration step.
- Configure Upstash Redis credentials; production login intentionally fails closed without them.
- Configure Cloudinary credentials and restrict access to the Cloudinary account.
- Set a unique admin password and rotate it if it is ever exposed.
- Set GitHub Actions `DIRECT_URL` secret and verify a scheduled/manual backup completes; periodically test restore into a separate database.
- Configure hosting logs, error alerts, database monitoring, and provider-native backups/PITR.
- Review your hosting provider's trusted proxy/IP headers before relying on IP-based rate limiting.
- Run `npm run typecheck`, `npm test`, and `npm run build` in CI before deploying.

## Operational scope

This application is prepared for production deployment, but production verification depends on your actual PostgreSQL, Redis, Cloudinary, domain, hosting, and backup secrets. Those services cannot be configured or verified without access to your accounts. The project includes the code and workflow needed to perform those checks after credentials are added.
