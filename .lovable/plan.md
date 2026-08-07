# Add Google Review CTA for A1wan Auto

## Goal
Let customers leave a Google review after paying an invoice, and give the business owner a clear path to set up their Google Maps listing so they can collect reviews.

## What we'll build

1. **Post-payment review prompt**
   - On the public invoice pay page (`/pay/$token`) and the customer portal, show a friendly "How did we do?" card once the invoice is marked `paid`.
   - Card includes a primary CTA button: "Leave us a Google review".
   - Use a configurable placeholder review URL for now; the owner can swap it once their Google Business Profile is live.
   - Make the URL easy to find in one place (e.g., a constant in a config file or an environment variable).

2. **Persistent footer review link**
   - Add a small "Review us on Google" link in the site footer alongside existing contact info.

3. **Owner-facing setup guide**
   - Add a short, non-technical section on the `/install` or `/settings` page (or a new `/admin/reviews` panel) explaining how to:
     1. Create a Google Business Profile for A1wan Auto.
     2. Verify the business with Google.
     3. Find and copy the "Write a review" link.
     4. Paste that link into the app so the CTA button points to the real review form.

## Defaults chosen
- Show the review prompt after invoice payment.
- Also show it when a work order is completed (status link / portal).
- Add a footer link site-wide.
- Use a placeholder review URL until the owner supplies the real one.

## Files likely to change
- `src/routes/pay.$token.tsx` — add post-payment review card
- `src/routes/_authenticated/customer-portal.index.tsx` — add review card for paid invoices
- `src/components/Footer.tsx` — add "Review us on Google" link
- New or updated config module for the review URL
- Possibly `src/routes/settings.tsx` or a new admin page for the setup guide
