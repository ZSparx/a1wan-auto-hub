import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInvoiceByToken } from "@/lib/public-token.functions";
import { Phone, CreditCard } from "lucide-react";

export const Route = createFileRoute("/pay/$token")({
  head: () => ({ meta: [{ title: "View Invoice — A1wan Auto" }] }),
  component: PayPage,
});

function PayPage() {
  const { token } = Route.useParams();
  const fetchInv = useServerFn(getInvoiceByToken);
  const { data, isLoading, error } = useQuery({
    queryKey: ["inv-token", token],
    queryFn: () => fetchInv({ data: { token } }),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-20 text-muted-foreground">Loading invoice…</div>;
  if (error || !data) return <div className="max-w-3xl mx-auto px-4 py-20 text-muted-foreground">Invoice not found.</div>;

  const { invoice, items } = data;
  const paid = invoice.status === "paid";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Invoice</p>
      <h1 className="font-display uppercase text-4xl sm:text-5xl tracking-tight">A1wan Auto</h1>

      <div className="mt-8 rounded-xl bg-surface border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display uppercase tracking-wide">{invoice.customer_name}</p>
            <p className="text-sm text-muted-foreground">{invoice.customer_email}</p>
          </div>
          <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded font-display ${
            paid ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-gradient text-primary-foreground"
          }`}>{invoice.status}</span>
        </div>

        <div className="divide-y divide-border">
          {items.map((it) => (
            <div key={it.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{it.description}</p>
                <p className="text-xs text-muted-foreground">Qty {it.quantity} × ${(it.unit_price_cents / 100).toFixed(2)}</p>
              </div>
              <p className="font-display text-lg">${((Number(it.quantity) * it.unit_price_cents) / 100).toFixed(2)}</p>
            </div>
          ))}
          {items.length === 0 && <div className="p-5 text-sm text-muted-foreground">No line items.</div>}
        </div>

        <div className="p-6 border-t border-border space-y-2">
          <Row label="Subtotal" value={invoice.subtotal_cents} />
          <Row label="Tax" value={invoice.tax_cents} />
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="font-display uppercase tracking-wider text-lg">Total</span>
            <span className="font-display text-3xl text-primary">${(invoice.total_cents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {!paid && (
        <div className="mt-6 p-6 rounded-lg bg-gradient-to-br from-surface-elevated to-surface border border-primary/30">
          <h2 className="font-display uppercase tracking-wide text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Pay Online
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Online card payments are coming soon. To pay now, call us or visit the shop.
          </p>
          <a href="tel:6827185547" className="mt-4 inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3 rounded-md shadow-glow-amber">
            <Phone className="h-4 w-4" /> Call (682) 718-5547
          </a>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>${(value / 100).toFixed(2)}</span>
    </div>
  );
}
