# Client portal authentication and messaging

## Password-first (recommended)

1. Save the **client** with a valid **email** on their record.
2. Set a **portal password** (and confirmation) when enabling access, then share **email + password** securely with the client (in person or an encrypted channel—not plain email for the password).
3. The app creates or links a **Supabase Auth** user for that email and sets `clients.auth_user_id` with `portal_enabled = true`.
4. The client signs in at **`/sign-in`** with that email and password. They are redirected to **`/client/dashboard`** and only see **their** matters, hearings, and messages (RLS), similar to a parent portal seeing only their child’s data.

**Where to enable**

- **New client**: In **New client**, check **Enable client portal when saving** and fill password fields (or opt into **Also email login link**).
- **Existing client**: Open the client → **Edit client** (Client Portal section), or use the **Portal access** quick sheet on the client profile.

**API rule**: Enabling the portal requires either a **password** or an explicit **`sendMagicLink: true`** request (login email). You cannot enable with neither.

## Login email (optional alternative)

If **“Also email login link”** is checked when enabling, the app can send a one-time link (Resend + proxy URL to **`/client-login?token=…`**). That page **redirects automatically** to complete sign-in. You still need Supabase and app URLs configured correctly (see below).

## Who can set passwords

Any **firm member** with a profile in the firm can set or update portal passwords (same scope as editing clients). Access is enforced by `firm_id` on the client in the API routes.

## Messaging

Portal clients can open **`/client/messages`**, pick a **lawyer** at the firm, and send text. Firm users see and reply under **Client portal messages** on that client’s detail page when the portal is enabled. Messages are stored in `client_lawyer_messages` with row-level security.

## Data access

Portal users only receive rows allowed by **RLS** (see `portal_linked_client_id()` and related policies in `supabase/schema.sql` and migrations), including optional read access to non-client **profiles** in their firm for the lawyer picker.

## Self-service password (alternative)

Clients can use Supabase **password recovery** from `/sign-in` if email is configured.

---

## Deploy checklist (magic link / OAuth reliability)

Configure these so links are not dropped on the wrong origin:

| Setting | Example |
|--------|---------|
| **Vercel** `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` (no trailing slash) |
| **Supabase** → Authentication → **Site URL** | Same as public site |
| **Supabase** → **Redirect URLs** | `https://yourdomain.com/auth/callback`, `https://yourdomain.com/client-login`, and often `https://yourdomain.com/**` |
| **Google Cloud** (if using Google sign-in) | Authorized JavaScript origins + redirect URIs per Supabase Google provider docs |

The app includes **hash/code recovery** on `/` and `/sign-in` so stray tokens on the homepage still forward to **`/auth/callback`** when Supabase falls back to Site URL.
