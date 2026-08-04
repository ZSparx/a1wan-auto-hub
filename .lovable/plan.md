# Sample data + full dashboard screenshot tour

The database is currently empty (zero accounts, zero records), so every dashboard renders as a blank shell. This plan seeds a small, realistic set of demo data, captures screenshots of every signed-in screen, and leaves you with a clean way to wipe the demo data afterward.

## What gets seeded

Login accounts (real, working logins):

- 1 shop admin — claims admin seat 1
- 1 mechanic
- 3 customers

Shop data tied to those accounts:

- 4 registered vehicles across the 3 customers
- 3 booking requests in different states (requested, scheduled, completed)
- 4 work orders spanning intake, in progress, ready and completed, two assigned to the mechanic
- 4 invoices with line items: two paid, one sent/unpaid, one draft — enough to make the revenue chart and "unpaid" tiles show real numbers
- Revenue spread across several months so the Reports annual chart has a curve instead of one bar
- 2 customer message threads, one with unread messages so the unread badges are visible
- 2 contact form messages in the admin inbox
- 3 car listings with photos for the Cars for Sale page and Cars panel

## What you get back

Screenshots of every screen not yet covered, saved to your Files:

- Admin: Overview, Bookings, Work Orders, Invoices, Customers, Customer detail (with message thread), Messages, Cars, Reports, Accounts
- Mechanic dashboard with assigned jobs
- Customer portal + customer messages
- Settings (all tabs)
- Cars for Sale gallery and a car detail page, now populated
- Public status link and public pay link, generated from a real work order and invoice

Each image is reviewed before delivery and I'll flag anything that looks broken.

## Cleanup

Sample data is tagged so it can be removed in one step. Say the word after the tour and I'll wipe it, leaving the database empty and ready for your real admin signup.

## Technical notes

- Seeding uses data-insert operations only. No schema changes, no application code changes.
- Accounts are created directly in the auth tables with hashed passwords and confirmed emails; the existing signup trigger creates the matching profile and role rows.
- The admin seat limit of 2 stays intact — the demo admin takes seat 1, so you can still claim seat 2 with your admin code. If you'd rather keep both seats free, I can delete the demo admin right after the screenshots.
- Screenshots are captured against the local preview with Playwright at 1280px wide.
