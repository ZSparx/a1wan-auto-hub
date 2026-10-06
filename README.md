# A1wan Auto Hub

I'd like to build a website. A full-stack progressive web app (PWA) for A1wan Auto, a mechanic shop located at 2401 Fort Worth St, Grand Prairie, TX 75050, phone (682) 718-5547. The site uses a dark, warm near-black color scheme with amber/orange accents, the Oswald display font for headings, and Inter for body text. The logo is an orange gradient square badge reading "A1" with a glow effect, next to the wordmark "A1WAN AUTO". The hero section features a full-bleed garage background photo of a black sports car with welding sparks, overlaid with a dark left-to-right gradient to keep text readable. Navigation includes Home, Services, Cars for Sale, Contact, a "Message Now" amber CTA button, a settings gear icon, and a customer sign-in link. Public pages include: a Home page with hero, featured services grid, featured cars for sale, and a contact CTA section; a Services page listing Oil Change, Brake Service, Engine Diagnostics, Suspension & Steering, Transmission Service, and Air Conditioning; a Cars for Sale gallery with vehicle detail pages; and a Contact page with a message form that routes to the admin inbox. A Customer Portal at /portal allows customers to register and log in with email/password, view their vehicle service history, active work orders, invoices, and pay outstanding balances online. Token-based public pages (no login required) allow customers to check vehicle repair status and pay invoices via a unique private link.

An Admin Dashboard at /admin is password-protected and includes: an overview with revenue, active jobs, unpaid invoices, messages, and car stats; a Work Orders panel to create and manage jobs with status tracking (intake → in progress → ready → completed) and a shareable customer status link; an Invoices panel with line items, send/void actions, and Stripe payment integration; a Messages panel for replying to customer conversations; a Cars panel for managing listings and photos; and a Reports panel with an annual revenue chart and top services breakdown. For the back end, I would like it to be cost effective for the customer im building for so supabase should be a good host.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://a1wan-auto-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7bffc6dd-46a8-43fb-bf4f-5f8cb0ea43d2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
