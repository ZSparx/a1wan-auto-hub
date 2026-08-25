# Reset admins, make the first sign-up the owner

Goal: remove both existing admin accounts, then let the very first person who signs up automatically become the primary admin. From that account, they create and manage everyone else.

## What changes

1. **Erase the admin accounts**
   - Delete the two admin logins (betcastillo21@gmail.com and the demo admin) and their profiles/roles.
   - Demo customer and mechanic accounts plus demo data (bookings, work orders, invoices, messages, vehicles) are also cleared so the shop starts clean.

2. **First sign-up becomes admin**
   - Replace the current "admin signup code" gate with a bootstrap rule: if no admin exists yet, the first account created is granted the admin role automatically; everyone after that signs up as a customer.
   - The signup page drops the role picker and the admin code field — it's just name, email, phone, password.
   - A small banner on the signup page tells the first visitor they're claiming the owner account (only shown while no admin exists).

3. **Admin manages everyone from the dashboard**
   - Admin > Accounts keeps the ability to create customer and mechanic accounts.
   - It also gains a role control: promote a customer to mechanic or admin, or demote back to customer, with the existing 2-admin cap enforced.

## Technical notes

- Database migration: delete the target rows from `auth.users` (cascades to `profiles`, `user_roles`) and truncate the demo data tables.
- New security-definer function `public.bootstrap_first_admin()` (or logic inside the existing `handle_new_user` trigger): if `count(*) from user_roles where role='admin' = 0`, insert `admin` instead of `customer` for the new user. The existing `enforce_admin_limit` trigger still caps admins at 2.
- Update `src/routes/signup.tsx` to remove role selection / admin code, and add a public check for "does an admin exist yet" to show the owner-claim banner.
- Update `src/lib/roles.functions.ts`: drop the `ADMIN_SIGNUP_CODE` path, add an admin-only `setUserRole` server function guarded by `requireSupabaseAuth` + `has_role(admin)`.
- Update `src/routes/_admin/admin.accounts.tsx` with the role dropdown wired to `setUserRole`.
- The `ADMIN_SIGNUP_CODE` secret becomes unused and can be deleted afterwards.

## After it's done

Go to `/signup`, create the owner account with the real email/password, and it lands in `/admin` with full permissions.
