import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Car, Plus, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/cars")({
  head: () => ({ meta: [{ title: "Cars — Admin" }] }),
  component: CarsAdmin,
});

const STATUSES = ["available", "pending", "sold"] as const;

function CarsAdmin() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: cars } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: async () => (await supabase.from("cars_for_sale").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("cars_for_sale").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cars"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cars_for_sale").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cars"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2"><Car className="h-6 w-6 text-primary" /> Cars for Sale</h2>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground px-3.5 py-2 rounded-md text-sm font-display uppercase tracking-wide shadow-glow-amber">
          <Plus className="h-4 w-4" /> New listing
        </button>
      </div>

      {showNew && <NewCarForm onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["admin-cars"] })} />}

      {!cars?.length ? (
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-border border-dashed">No listings yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cars.map((c) => (
            <div key={c.id} className="p-4 rounded-lg bg-surface border border-border">
              <div className="aspect-[16/10] bg-muted rounded-md overflow-hidden mb-3">
                {c.image_url && <img src={c.image_url} alt={`${c.year} ${c.make} ${c.model}`} className="w-full h-full object-cover" />}
              </div>
              <p className="font-display uppercase tracking-wide">{c.year} {c.make} {c.model} {c.trim ?? ""}</p>
              <p className="text-primary font-display text-xl mt-1">${(c.price_cents / 100).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{c.mileage?.toLocaleString() ?? "—"} mi</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <select value={c.status} onChange={(e) => update.mutate({ id: c.id, patch: { status: e.target.value } })} className="rounded-md bg-background border border-border px-2 py-1 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => update.mutate({ id: c.id, patch: { featured: !c.featured } })} className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded border ${c.featured ? "bg-amber-gradient text-primary-foreground border-transparent" : "bg-background border-border text-muted-foreground"}`}>
                  <Star className="h-3 w-3" /> {c.featured ? "Featured" : "Feature"}
                </button>
                <button onClick={() => { if (confirm("Delete?")) remove.mutate(c.id); }} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-background text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewCarForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ year: new Date().getFullYear(), make: "", model: "", trim: "", mileage: 0, price: 0, image_url: "", description: "" });
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase.from("cars_for_sale").insert({
          year: form.year, make: form.make, model: form.model, trim: form.trim || null,
          mileage: form.mileage, price_cents: Math.round(form.price * 100),
          image_url: form.image_url || null, description: form.description || null,
        });
        setSaving(false);
        if (error) { toast.error(error.message); return; }
        toast.success("Listing created");
        onCreated(); onClose();
      }}
      className="p-5 rounded-lg bg-surface-elevated border border-primary/30 space-y-3"
    >
      <h3 className="font-display uppercase tracking-wide">New Listing</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input required type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input required placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input required placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input placeholder="Trim" value={form.trim} onChange={(e) => setForm({ ...form, trim: e.target.value })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Mileage" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input required type="number" step={0.01} placeholder="Price $" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
      </div>
      <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
      <textarea rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button>
        <button disabled={saving} className="bg-amber-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-display uppercase tracking-wide disabled:opacity-60">{saving ? "Saving…" : "Create"}</button>
      </div>
    </form>
  );
}
