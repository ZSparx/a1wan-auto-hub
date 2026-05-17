## Goal

Let the very first user become the shop admin without needing manual SQL, while keeping the system safe from privilege escalation afterward.

## How it works

1. New page at `/admin-setup` (public route).
2. Page calls a server function `bootstrapAdmin` that:
   - Checks `user_roles` — if ANY row with `role = 'admin'` already exists, the function refuses (returns "Admin already configured").
   - Otherwise, requires the caller to be authenticated (via `requireSupabaseAuth`) and inserts an `admin` role row for `auth.uid()` using the service-role client (bypasses RLS safely because of the "no existing admin" guard).
3. UI flow on `/admin-setup`:
   - If not signed in → shows "Sign up or log in first" with links to `/signup` and `/login?redirect=/admin-setup`.
   - If signed in and no admin exists → shows a "Make me the admin" button. On success, redirects to `/admin`.
   - If signed in and an admin already exists → shows "Admin is already configured. Contact the current admin to grant you access." with a link home.
4. Add a subtle "First-time setup" link in the footer pointing to `/admin-setup` so the owner can find it; remove/hide it automatically once an admin exists (server fn `adminExists` checked on mount).

## Security

- Single-use by construction: the "no existing admin" check makes the endpoint inert after first use.
- Uses `supabaseAdmin` only inside the server fn after both checks pass.
- No client-side role assignment; RLS on `user_roles` remains "admins only".

## Files

- New: `src/lib/admin-bootstrap.functions.ts` — `adminExists`, `bootstrapAdmin` server fns.
- New: `src/routes/admin-setup.tsx` — the setup page.
- Edit: `src/components/Footer.tsx` — conditional "First-time setup" link.

## After this ships

Owner flow: sign up at `/signup` → visit `/admin-setup` → click the button → land on `/admin`. From then on, additional admins are added by the existing admin from within the dashboard (future enhancement, not in this plan).