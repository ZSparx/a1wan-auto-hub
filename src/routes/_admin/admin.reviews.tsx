import { createFileRoute } from "@tanstack/react-router";
import { GOOGLE_REVIEW_URL } from "@/lib/config";
import { Star, MapPin, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews Setup — A1wan Auto Admin" },
      { name: "description", content: "Set up Google reviews and manage the customer review prompt." },
    ],
  }),
  component: ReviewsSetupPage,
});

function ReviewsSetupPage() {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(GOOGLE_REVIEW_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-1">Reputation</p>
        <h2 className="font-display uppercase text-3xl tracking-tight">Google Reviews</h2>
        <p className="mt-2 text-muted-foreground">
          After customers pay an invoice or a job is marked completed, they see a prompt asking for a Google review.
        </p>
      </div>

      <section className="p-6 rounded-lg bg-surface border border-border">
        <h3 className="font-display uppercase tracking-wide text-xl flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" /> Current review link
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This is the URL the "Leave a Google review" button opens. Replace it in <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">src/lib/config.ts</code> once your Google Business Profile is live.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-sm px-3 py-2 rounded-md bg-surface-elevated border border-border text-foreground break-all"
          >
            {GOOGLE_REVIEW_URL}
          </a>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-display uppercase tracking-wider hover:border-primary transition"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>

      <section className="p-6 rounded-lg bg-surface border border-border">
        <h3 className="font-display uppercase tracking-wide text-xl flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> How to set up Google Maps and collect reviews
        </h3>
        <ol className="mt-4 space-y-4 text-sm text-muted-foreground list-decimal list-inside">
          <li>
            <strong className="text-foreground">Create or claim the Google Business Profile.</strong>
            {" "}Go to {" "}
            <a
              href="https://business.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Google Business <ExternalLink className="h-3 w-3" />
            </a>
            {" "}and sign in with the business owner’s Google account. Search for "A1wan Auto" at 2401 Fort Worth St, Grand Prairie, TX 75050 and claim it, or create a new listing.
          </li>
          <li>
            <strong className="text-foreground">Verify the business.</strong>
            {" "}Google will ask for verification, usually by postcard to the shop address or by phone. Follow the instructions until the status shows "Verified".
          </li>
          <li>
            <strong className="text-foreground">Open your review link.</strong>
            {" "}On the Google Business dashboard, go to the "Ask for reviews" or "Reviews" section and click "Get more reviews". Copy the generated short URL.
          </li>
          <li>
            <strong className="text-foreground">Update the app.</strong>
            {" "}Paste that URL into the <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">GOOGLE_REVIEW_URL</code> constant in <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">src/lib/config.ts</code> and republish the site.
          </li>
          <li>
            <strong className="text-foreground">Customers see the prompt automatically.</strong>
            {" "}The "Leave a Google review" button appears on the public invoice page once an invoice is paid, and in the customer portal once they have paid invoices or completed work orders.
          </li>
        </ol>
      </section>
    </div>
  );
}
