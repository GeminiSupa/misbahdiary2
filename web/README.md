## Lawyer Diary Web App

This is the Next.js 16 App Router front-end for the Lawyer Diary & Case Management platform. It is wired to Supabase for authentication, database access, and storage.

### Local environment

1. Copy `.env.local` (already created) and adjust values when pointing at a different Supabase project. Be sure to set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PROJECT_ID`
   - `NEXT_PUBLIC_SITE_URL` (used for Supabase auth redirects)

2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Visit `http://localhost:3000`. Unauthenticated users redirect to `/sign-in`; signed-in users land on `/dashboard`.

### Deploy to Vercel

See [../VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set root directory to `web`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy!

**Or use Vercel CLI:**

```bash
npm i -g vercel
cd web
vercel
```

Follow the prompts and set the root directory to the current directory.

### Supabase toolbelt

The project includes helper scripts for keeping the database schema and generated types in sync.

| Command | Description |
|---------|-------------|
| `npm run supabase:types` | Uses the Supabase CLI to regenerate `lib/supabase/database.types.ts`. Requires a Supabase personal access token (`SUPABASE_ACCESS_TOKEN`) with access to the project. |
| `npm run supabase:apply` | Applies `../supabase/schema.sql` directly to the cloud database. Requires `SUPABASE_DB_URL` (the Postgres connection string from Supabase Project Settings → Database). |
| `npm run supabase:seed` | Inserts sample clients, cases, and hearings for a given firm. Requires `SUPABASE_DB_URL`, `SUPABASE_FIRM_ID`, and `SUPABASE_USER_ID` (lead counsel) environment variables. |

### Scheduled reminders (Edge Function)

An edge function at `supabase/functions/reminders` generates hearing and invoice reminders.

1. Deploy the function:
   ```bash
   supabase functions deploy reminders
   ```
2. Schedule it inside Supabase (runs hourly by default):
   ```bash
   supabase functions schedule create reminders-hourly \
     --function reminders \
     --cron "0 * * * *"
   ```

The function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (set automatically in the Supabase dashboard). Update the cron expression or reminder windows as your practice requires.

Optional email delivery uses [Resend](https://resend.com/). Provide:

```bash
export RESEND_API_KEY=your_resend_key
export RESEND_FROM_EMAIL="Lawyer Diary <no-reply@yourdomain.com>"
```

If unset, the function still writes in-app notifications without sending email.

Example usage:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
npm run supabase:types

export SUPABASE_DB_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
npm run supabase:apply

export SUPABASE_FIRM_ID=<uuid>
export SUPABASE_USER_ID=<uuid>
npm run supabase:seed
```

### Invoice PDFs

Invoice exports are generated with `@react-pdf/renderer`. Downloading `/api/invoices/:id/pdf` now streams a branded PDF containing totals, line items, and client contact details.

### Auth flows

The following routes are scaffolded and ready to wire into the rest of the modules:

- `/sign-in` — email/password or passwordless magic link sign-in.
- `/sign-up` — account creation with full-name capture.
- `/auth/callback` — Supabase OAuth / magic link callback that establishes the server session.
- `/dashboard` — protected area (redirects unauthenticated users to `/sign-in`).

Every successful sign-in/out refreshes server-side session state via the Supabase helpers.

### Next steps

- Integrate email/SMS delivery for reminders (Re-send or WhatsApp/SMS provider).
- Swap the invoice export route for a real PDF renderer and templatized layout.
- Add charts/analytics to `/dashboard` and `/billing` backed by the new notification + revenue data.
