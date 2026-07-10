# Customer Messaging in Portal

## What exists today
- Signup → `profiles` row + `customer` role auto-created via `handle_new_user()` trigger. ✅
- Service history (vehicles, work orders, invoices) already shown in `/customer-portal`. ✅
- `customer_messages` table with `sender` (`customer`/`admin`), `read_by_customer`, `read_by_admin`. Admins can send from `/admin/messages`. ✅
- Portal dashboard shows unread-from-admin count but has **no way for the customer to send or read messages**.

## What to build
A new authenticated route `/_authenticated/customer-portal/messages` with a full thread view and compose box, plus a link from the portal dashboard.

### 1. Route file
`src/routes/_authenticated/customer-portal.messages.tsx`
- Loads all `customer_messages` for the current user, ordered ascending by `created_at` (RLS already scopes to `auth.uid()`).
- Renders as a chat-style thread: admin messages left-aligned, customer messages right-aligned, with timestamps.
- On mount, marks all `sender='admin'` unread rows as `read_by_customer = true` so the dashboard badge clears.
- Compose box at bottom: textarea + Send button. Zod-validates (1–2000 chars, trimmed). Inserts a row with `sender='customer'`, `customer_id = auth user id`, `read_by_admin=false`.
- Uses TanStack Query (`useQuery` for the thread, `useMutation` for send) with `invalidateQueries` on success.
- Standard `errorComponent` + `notFoundComponent`.
- `head()` with route-specific title.

### 2. Dashboard entry point
In `src/routes/_authenticated/customer-portal.tsx`:
- Turn the existing "New Messages" stat card into a `<Link to="/customer-portal/messages">`.
- Add a "Messages" section/CTA button so it's discoverable even when the count is 0.

### 3. Verify RLS on `customer_messages`
Confirm the existing 4 policies allow: customer SELECT own rows, customer INSERT own rows (with `sender='customer'` + `customer_id=auth.uid()`), customer UPDATE own rows (for `read_by_customer` flag). If any is missing, add a migration in the same turn. (Will check with `supabase--read_query` at build time before writing code.)

## Out of scope
- Realtime subscriptions (can poll on window focus via Query's default; realtime can be a follow-up).
- File attachments.
- Admin-side changes — `/admin/messages` already handles replies.

## Answer to your question
Signup → profile → service history: **already integrated**. Customer → shop messaging: **half integrated** (schema + admin side done, customer send/read UI missing). This plan closes that gap.
