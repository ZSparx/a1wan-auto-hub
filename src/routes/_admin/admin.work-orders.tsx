import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, Plus, ExternalLink, Trash2 } from "lucide-react";
import { listMechanics } from "@/lib/roles.functions";

export const Route = createFileRoute("/_admin/admin/work-orders")({
  head: () => ({ meta: [{ title: "Work Orders — Admin" }] }),
  component: WorkOrdersAdmin,
});

const STATUSES = ["intake", "in_progress", "ready", "completed"] as const;

function WorkOrdersAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("active");
  const [showNew, setShowNew] = useState(false);

  const { data: orders } = useQuery({
    queryKey: ["admin-work-orders"],
    queryFn: async () => (await supabase.from("work_orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: mechanics } = useQuery({ queryKey: ["mechanics"], queryFn: () => listMechanics() });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: string; notes?: string; mechanic_id?: string | null } }) => {
      const { error } = await supabase.from("work_orders").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-work-orders"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-work-orders"] }); toast.success("Deleted"); },
  });

  const filtered = (orders ?? []).filter((w) => {
    if (filter === "all") return true;
    if (filter === "active") return w.status !== "completed";
    return w.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2"><Wrench className="h-6 w-6 text-primary" /> Work Orders</h2>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground px-3.5 py-2 rounded-md text-sm font-display uppercase tracking-wide shadow-glow-amber"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {(["active", "all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs uppercase tracking-wider font-display px-3 py-1.5 rounded ${
              filter === s ? "bg-amber-gradient text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
            }`}
          >{s.replace("_", " ")}</button>
        ))}
      </div>

      {showNew && <NewWorkOrderForm onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["admin-work-orders"] })} />}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-border border-dashed">No work orders.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div key={w.id} className="p-5 rounded-lg bg-surface border border-border">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display uppercase tracking-wide text-lg">{w.customer_name}</p>
                  <p className="text-sm text-primary">{w.vehicle_description}</p>
                  <p className="text-sm text-muted-foreground mt-1">{w.description}</p>
                  {w.customer_phone && <p className="text-xs text-muted-foreground mt-1">📞 {w.customer_phone}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Created {new Date(w.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <select
                    value={w.status}
                    onChange={(e) => update.mutate({ id: w.id, patch: { status: e.target.value } })}
                    className="rounded-md bg-background border border-border px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <select
                    value={w.mechanic_id ?? ""}
                    onChange={(e) => update.mutate({ id: w.id, patch: { mechanic_id: e.target.value || null } })}
                    className="rounded-md bg-background border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {(mechanics ?? []).map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
                    ))}
                  </select>
                  <a href={`/status/${w.public_token}`} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                    Customer link <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    onClick={() => { if (confirm("Delete?")) remove.mutate(w.id); }}
                    className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                  ><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
              <textarea
                defaultValue={w.notes ?? ""}
                placeholder="Internal notes…"
                onBlur={(e) => { if (e.target.value !== (w.notes ?? "")) update.mutate({ id: w.id, patch: { notes: e.target.value } }); }}
                rows={2}
                className="mt-3 w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewWorkOrderForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", vehicle_description: "", description: "" });
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase.from("work_orders").insert({
          customer_name: form.customer_name,
          customer_phone: form.customer_phone || null,
          vehicle_description: form.vehicle_description,
          description: form.description,
        });
        setSaving(false);
        if (error) { toast.error(error.message); return; }
        toast.success("Work order created");
        onCreated(); onClose();
      }}
      className="p-5 rounded-lg bg-surface-elevated border border-primary/30 space-y-3"
    >
      <h3 className="font-display uppercase tracking-wide">New Work Order</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <input required placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input placeholder="Phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
      </div>
      <input required placeholder="Vehicle (year make model)" value={form.vehicle_description} onChange={(e) => setForm({ ...form, vehicle_description: e.target.value })} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
      <textarea required rows={3} placeholder="Work description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button>
        <button disabled={saving} className="bg-amber-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-display uppercase tracking-wide disabled:opacity-60">{saving ? "Saving…" : "Create"}</button>
      </div>
    </form>
  );
}
