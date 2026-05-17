import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Plus, ExternalLink, Send, Ban, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Admin" }] }),
  component: InvoicesAdmin,
});

type LineItem = { description: string; quantity: number; unit_price_cents: number };

function InvoicesAdmin() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: invoices } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => (await supabase.from("invoices").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: string } }) => {
      const { error } = await supabase.from("invoices").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-invoices"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-invoices"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Invoices</h2>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground px-3.5 py-2 rounded-md text-sm font-display uppercase tracking-wide shadow-glow-amber">
          <Plus className="h-4 w-4" /> New invoice
        </button>
      </div>

      {showNew && <NewInvoiceForm onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["admin-invoices"] })} />}

      {!invoices?.length ? (
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-border border-dashed">No invoices yet.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((i) => (
            <div key={i.id} className="p-5 rounded-lg bg-surface border border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display uppercase tracking-wide">{i.customer_name}</p>
                <p className="text-sm text-muted-foreground">{i.customer_email ?? "—"}</p>
                <p className="mt-2 font-display text-2xl text-primary">${(i.total_cents / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Due {i.due_date ?? "—"} · created {new Date(i.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded font-display ${
                  i.status === "paid" ? "bg-emerald-500/15 text-emerald-400" :
                  i.status === "sent" ? "bg-amber-gradient text-primary-foreground" :
                  i.status === "void" ? "bg-destructive/15 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{i.status}</span>
                <div className="flex flex-wrap gap-2 justify-end">
                  {i.status === "draft" && (
                    <button onClick={() => update.mutate({ id: i.id, patch: { status: "sent" } })} className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider">
                      <Send className="h-3 w-3" /> Send
                    </button>
                  )}
                  {i.status === "sent" && (
                    <button onClick={() => update.mutate({ id: i.id, patch: { status: "void" } })} className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-background text-muted-foreground hover:text-destructive">
                      <Ban className="h-3 w-3" /> Void
                    </button>
                  )}
                  <a href={`/pay/${i.public_token}`} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-background hover:underline">
                    <ExternalLink className="h-3 w-3" /> Pay link
                  </a>
                  <button onClick={() => { if (confirm("Delete?")) remove.mutate(i.id); }} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-background">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewInvoiceForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [meta, setMeta] = useState({ customer_name: "", customer_email: "", due_date: "" });
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price_cents: 0 }]);
  const [taxPct, setTaxPct] = useState(8.25);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((a, it) => a + Math.round(it.quantity * it.unit_price_cents), 0);
  const tax = Math.round(subtotal * (taxPct / 100));
  const total = subtotal + tax;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const { data: inv, error } = await supabase.from("invoices").insert({
          customer_name: meta.customer_name,
          customer_email: meta.customer_email || null,
          due_date: meta.due_date || null,
          subtotal_cents: subtotal,
          tax_cents: tax,
          total_cents: total,
          status: "draft",
        }).select().single();
        if (error || !inv) { setSaving(false); toast.error(error?.message ?? "Failed"); return; }
        const itemsToInsert = items.filter((it) => it.description.trim()).map((it) => ({
          invoice_id: inv.id, description: it.description, quantity: it.quantity, unit_price_cents: it.unit_price_cents,
        }));
        if (itemsToInsert.length) {
          const { error: e2 } = await supabase.from("invoice_items").insert(itemsToInsert);
          if (e2) { setSaving(false); toast.error(e2.message); return; }
        }
        setSaving(false);
        toast.success("Invoice created as draft");
        onCreated(); onClose();
      }}
      className="p-5 rounded-lg bg-surface-elevated border border-primary/30 space-y-4"
    >
      <h3 className="font-display uppercase tracking-wide">New Invoice</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        <input required placeholder="Customer name" value={meta.customer_name} onChange={(e) => setMeta({ ...meta, customer_name: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input type="email" placeholder="Email" value={meta.customer_email} onChange={(e) => setMeta({ ...meta, customer_email: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input type="date" value={meta.due_date} onChange={(e) => setMeta({ ...meta, due_date: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-display uppercase tracking-wider text-muted-foreground">Line items</p>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_60px_100px_30px] gap-2">
            <input placeholder="Description" value={it.description} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
            <input type="number" min={0} step={0.5} value={it.quantity} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))} className="rounded-md bg-background border border-border px-2 py-2 text-sm" />
            <input type="number" min={0} placeholder="Price $" value={it.unit_price_cents / 100} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, unit_price_cents: Math.round(Number(e.target.value) * 100) } : x))} className="rounded-md bg-background border border-border px-2 py-2 text-sm" />
            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4 mx-auto" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price_cents: 0 }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add item</button>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Tax %</label>
        <input type="number" step={0.01} value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value))} className="w-24 rounded-md bg-background border border-border px-2 py-1.5 text-sm" />
      </div>
      <div className="text-right space-y-1 text-sm">
        <p>Subtotal: <span className="font-display">${(subtotal / 100).toFixed(2)}</span></p>
        <p>Tax: <span className="font-display">${(tax / 100).toFixed(2)}</span></p>
        <p className="text-lg">Total: <span className="font-display text-primary text-2xl">${(total / 100).toFixed(2)}</span></p>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button>
        <button disabled={saving} className="bg-amber-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-display uppercase tracking-wide disabled:opacity-60">{saving ? "Saving…" : "Create draft"}</button>
      </div>
    </form>
  );
}
