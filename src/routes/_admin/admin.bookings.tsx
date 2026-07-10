import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarClock, Wrench, Trash2, Check, FileText, Plus, Send } from "lucide-react";

type LineItem = { description: string; quantity: number; unit_price_cents: number };

export const Route = createFileRoute("/_admin/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Admin" }] }),
  component: BookingsAdmin,
});

type Booking = {
  id: string; service: string; customer_name: string; customer_email: string;
  customer_phone: string | null; vehicle_description: string | null; preferred_date: string | null;
  notes: string | null; status: string; scheduled_at: string | null;
  work_order_id: string | null; created_at: string; customer_id: string | null;
};

const STATUSES = ["requested", "scheduled", "in_progress", "completed", "cancelled"] as const;

function BookingsAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Booking> }) => {
      const { error } = await supabase.from("bookings").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-bookings"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-bookings"] }); toast.success("Deleted"); },
  });

  const convertToWorkOrder = useMutation({
    mutationFn: async (b: Booking) => {
      const { data: wo, error } = await supabase.from("work_orders").insert({
        customer_id: b.customer_id,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        vehicle_description: b.vehicle_description || "Vehicle not specified",
        description: `${b.service}${b.notes ? ` — ${b.notes}` : ""}`,
        status: "intake" as const,
      }).select().single();
      if (error) throw error;
      await supabase.from("bookings").update({ status: "in_progress", work_order_id: wo.id }).eq("id", b.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-bookings"] }); toast.success("Work order created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (bookings ?? []).filter((b) => filter === "all" || b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2"><CalendarClock className="h-6 w-6 text-primary" /> Bookings</h2>
        <div className="flex flex-wrap gap-1">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs uppercase tracking-wider font-display px-3 py-1.5 rounded ${
                filter === s ? "bg-amber-gradient text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-border border-dashed">No bookings match this filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="p-5 rounded-lg bg-surface border border-border">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display uppercase tracking-wide text-lg">{b.customer_name} · <span className="text-primary">{b.service}</span></p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {b.customer_email}{b.customer_phone ? ` · ${b.customer_phone}` : ""}
                  </p>
                  {b.vehicle_description && <p className="text-sm mt-1">🚗 {b.vehicle_description}</p>}
                  {b.preferred_date && <p className="text-sm mt-1 text-muted-foreground">Preferred: {b.preferred_date}</p>}
                  {b.notes && <p className="text-sm mt-2 text-muted-foreground italic">"{b.notes}"</p>}
                  <p className="text-xs text-muted-foreground mt-2">Requested {new Date(b.created_at).toLocaleString()}</p>
                </div>
                <select
                  value={b.status}
                  onChange={(e) => update.mutate({ id: b.id, patch: { status: e.target.value as Booking["status"] } })}
                  className="rounded-md bg-background border border-border px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>

              <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5">Appointment time</label>
                  <input
                    type="datetime-local"
                    defaultValue={b.scheduled_at ? new Date(b.scheduled_at).toISOString().slice(0, 16) : ""}
                    onBlur={(e) => {
                      const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                      if (val !== b.scheduled_at) {
                        update.mutate({ id: b.id, patch: { scheduled_at: val, status: val ? "scheduled" : b.status } });
                      }
                    }}
                    className="rounded-md bg-background border border-border px-3 py-2 text-sm"
                  />
                  {b.scheduled_at && <p className="text-xs text-primary mt-1 inline-flex items-center gap-1"><Check className="h-3 w-3" /> Scheduled for {new Date(b.scheduled_at).toLocaleString()}</p>}
                </div>
                <div className="flex gap-2">
                  {!b.work_order_id && (
                    <button
                      onClick={() => convertToWorkOrder.mutate(b)}
                      disabled={convertToWorkOrder.isPending}
                      className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground px-3 py-2 rounded-md text-sm font-display uppercase tracking-wide shadow-glow-amber"
                    >
                      <Wrench className="h-4 w-4" /> Create Job
                    </button>
                  )}
                  <button
                    onClick={() => setQuoteFor(quoteFor === b.id ? null : b.id)}
                    className="inline-flex items-center gap-2 border border-primary/50 bg-surface text-primary px-3 py-2 rounded-md text-sm font-display uppercase tracking-wide hover:bg-primary/10"
                  >
                    <FileText className="h-4 w-4" /> {quoteFor === b.id ? "Close" : "Quote & Invoice"}
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this booking?")) remove.mutate(b.id); }}
                    className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {quoteFor === b.id && (
                <QuoteInvoiceForm
                  booking={b}
                  onClose={() => setQuoteFor(null)}
                  onCreated={() => { qc.invalidateQueries({ queryKey: ["admin-bookings"] }); setQuoteFor(null); }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteInvoiceForm({ booking, onClose, onCreated }: { booking: Booking; onClose: () => void; onCreated: () => void }) {
  const [items, setItems] = useState<LineItem[]>([
    { description: booking.service, quantity: 1, unit_price_cents: 0 },
  ]);
  const [taxPct, setTaxPct] = useState(8.25);
  const [dueDate, setDueDate] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((a, it) => a + Math.round(it.quantity * it.unit_price_cents), 0);
  const tax = Math.round(subtotal * (taxPct / 100));
  const total = subtotal + tax;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure a work order exists so the invoice attaches to service history
      let workOrderId = booking.work_order_id;
      if (!workOrderId) {
        const { data: wo, error: woErr } = await supabase.from("work_orders").insert({
          customer_id: booking.customer_id,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          vehicle_description: booking.vehicle_description || "Vehicle not specified",
          description: `${booking.service}${booking.notes ? ` — ${booking.notes}` : ""}`,
          status: "intake" as const,
        }).select().single();
        if (woErr) throw woErr;
        workOrderId = wo.id;
        await supabase.from("bookings").update({ status: "in_progress", work_order_id: workOrderId }).eq("id", booking.id);
      }

      const { data: inv, error } = await supabase.from("invoices").insert({
        work_order_id: workOrderId,
        customer_id: booking.customer_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        subtotal_cents: subtotal,
        tax_cents: tax,
        total_cents: total,
        due_date: dueDate || null,
        status: sendNow ? "sent" : "draft",
      }).select().single();
      if (error || !inv) throw error ?? new Error("Failed to create invoice");

      const itemsToInsert = items.filter((it) => it.description.trim()).map((it) => ({
        invoice_id: inv.id, description: it.description, quantity: it.quantity, unit_price_cents: it.unit_price_cents,
      }));
      if (itemsToInsert.length) {
        const { error: e2 } = await supabase.from("invoice_items").insert(itemsToInsert);
        if (e2) throw e2;
      }

      if (booking.customer_id) {
        await supabase.from("customer_messages").insert({
          customer_id: booking.customer_id,
          sender: "admin",
          body: sendNow
            ? `We've sent you an invoice for ${booking.service} — total $${(total / 100).toFixed(2)}. View & pay: ${window.location.origin}/pay/${inv.public_token}`
            : `We've drafted a quote for ${booking.service} — total $${(total / 100).toFixed(2)}. We'll follow up shortly.`,
          read_by_customer: false,
        });
      }

      toast.success(sendNow ? "Invoice sent to customer" : "Draft invoice saved");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 p-4 rounded-lg bg-surface-elevated border border-primary/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display uppercase tracking-wide text-sm inline-flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Quote for {booking.customer_name}</h4>
        <span className="text-xs text-muted-foreground">{booking.customer_email}</span>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_60px_100px_30px] gap-2">
            <input placeholder="Description" value={it.description} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
            <input type="number" min={0} step={0.5} value={it.quantity} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))} className="rounded-md bg-background border border-border px-2 py-2 text-sm" />
            <input type="number" min={0} placeholder="Price $" value={it.unit_price_cents / 100} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, unit_price_cents: Math.round(Number(e.target.value) * 100) } : x))} className="rounded-md bg-background border border-border px-2 py-2 text-sm" />
            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4 mx-auto" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price_cents: 0 }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add line</button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Tax %</label>
          <input type="number" step={0.01} value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value))} className="w-20 rounded-md bg-background border border-border px-2 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Due</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-md bg-background border border-border px-2 py-1.5 text-sm" />
        </div>
        <label className="text-xs font-display uppercase tracking-wider text-muted-foreground inline-flex items-center gap-2 ml-auto">
          <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} /> Send to customer now
        </label>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="text-sm text-muted-foreground">
          Subtotal ${(subtotal / 100).toFixed(2)} · Tax ${(tax / 100).toFixed(2)}
        </div>
        <div className="font-display text-2xl text-primary">${(total / 100).toFixed(2)}</div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button>
        <button disabled={saving || total === 0} className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-display uppercase tracking-wide disabled:opacity-60">
          {sendNow ? <><Send className="h-4 w-4" /> {saving ? "Sending…" : "Send Invoice"}</> : <>{saving ? "Saving…" : "Save Draft"}</>}
        </button>
      </div>
    </form>
  );
}
