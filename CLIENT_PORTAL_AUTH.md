# Client portal authentication and messaging

## How login works

1. A lawyer saves a **client** with a valid **email**, then enables **Client portal** on that client (client edit form).
2. The app creates or links a **Supabase Auth** user for that email and sets `clients.auth_user_id` with `portal_enabled = true`.
3. The client signs in at **`/sign-in`** with that email and either:
   - a **magic link** sent to their inbox, or
   - a **password** set by the firm (see below).

## Magic link (default)

When portal is enabled **without** a firm-set password, a **magic link** email is sent (if Resend is configured). Opening it completes sign-in and redirects to `/client/dashboard`.

## Firm-set password (owner / principal partner only)

**Firm owner** or **principal partner** can optionally set an **initial portal password** when enabling the portal, or **update** it later in the same client edit sheet.

- Passwords are applied via Supabase Admin on the server only (never logged in application code).
- **Share credentials securely** with the client (in person or an encrypted channel). Email is not a safe way to send passwords.
- Checkbox **“Also email login link”**: when a password is set, the default is **not** to email the magic link; you can opt in to send both.
- Other firm roles can still enable the portal **without** setting a password (magic link only).

## Messaging

Portal clients can open **`/client/messages`**, pick a **lawyer** at the firm, and send text. Firm users see and reply under **Client portal messages** on that client’s detail page when the portal is enabled. Messages are stored in `client_lawyer_messages` with row-level security.

## Data access

Portal users only receive rows allowed by **RLS** (see `portal_linked_client_id()` and related policies in `supabase/schema.sql` and migrations), including optional read access to non-client **profiles** in their firm for the lawyer picker.

## Self-service password (alternative)

Clients can also use Supabase **password recovery** from `/sign-in` if email is configured, without the firm setting a password.
