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
