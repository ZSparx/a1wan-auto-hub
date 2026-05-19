import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Car, Plus, Trash2, Star, Upload, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/cars")({
  head: () => ({ meta: [{ title: "Cars — Admin" }] }),
  component: CarsAdmin,
});

const STATUSES = ["available", "pending", "sold"] as const;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

function sanitize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-").slice(0, 80);
}

function pathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/car-photos/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

async function uploadCarPhoto(file: File, folder: string): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Use JPG, PNG, or WebP.");
  if (file.size > MAX_BYTES) throw new Error("Max file size is 8 MB.");
  const key = `${folder}/${Date.now()}-${sanitize(file.name)}`;
  const { error } = await supabase.storage.from("car-photos").upload(key, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from("car-photos").getPublicUrl(key).data.publicUrl;
}

async function removeCarPhoto(url: string) {
  const path = pathFromPublicUrl(url);
  if (!path) return;
  await supabase.storage.from("car-photos").remove([path]);
}

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
    mutationFn: async ({ id, image_url }: { id: string; image_url: string | null }) => {
      if (image_url) await removeCarPhoto(image_url);
      const { error } = await supabase.from("cars_for_sale").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cars"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
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
              <ExistingCarPhoto carId={c.id} imageUrl={c.image_url} label={`${c.year} ${c.make} ${c.model}`} />
              <p className="font-display uppercase tracking-wide mt-3">{c.year} {c.make} {c.model} {c.trim ?? ""}</p>
              <p className="text-primary font-display text-xl mt-1">${(c.price_cents / 100).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{c.mileage?.toLocaleString() ?? "—"} mi</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <select value={c.status} onChange={(e) => update.mutate({ id: c.id, patch: { status: e.target.value } })} className="rounded-md bg-background border border-border px-2 py-1 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => update.mutate({ id: c.id, patch: { featured: !c.featured } })} className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded border ${c.featured ? "bg-amber-gradient text-primary-foreground border-transparent" : "bg-background border-border text-muted-foreground"}`}>
                  <Star className="h-3 w-3" /> {c.featured ? "Featured" : "Feature"}
                </button>
                <button onClick={() => { if (confirm("Delete?")) remove.mutate({ id: c.id, image_url: c.image_url }); }} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-background text-muted-foreground hover:text-destructive">
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

function PhotoDropZone({
  value,
  onPick,
  onClear,
  busy,
  label,
}: {
  value: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
  busy?: boolean;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) { toast.error("Use JPG, PNG, or WebP."); return; }
    if (file.size > MAX_BYTES) { toast.error("Max file size is 8 MB."); return; }
    onPick(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      className={`relative aspect-[16/10] rounded-md overflow-hidden border-2 border-dashed transition ${
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40"
      }`}
    >
      {value ? (
        <>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          {!busy && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs bg-background/90 border border-border rounded px-2 py-1 hover:text-destructive"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Upload className="h-6 w-6" />
          <span className="font-display uppercase tracking-wide text-xs">Upload photo</span>
          <span className="text-[11px]">JPG, PNG, or WebP · up to 8 MB</span>
        </button>
      )}
      {busy && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}

function ExistingCarPhoto({ carId, imageUrl, label }: { carId: string; imageUrl: string | null; label: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const replace = async (file: File) => {
    setBusy(true);
    try {
      const newUrl = await uploadCarPhoto(file, carId);
      if (imageUrl) await removeCarPhoto(imageUrl);
      const { error } = await supabase.from("cars_for_sale").update({ image_url: newUrl }).eq("id", carId);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["admin-cars"] });
      toast.success("Photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!imageUrl) return;
    setBusy(true);
    try {
      await removeCarPhoto(imageUrl);
      const { error } = await supabase.from("cars_for_sale").update({ image_url: null }).eq("id", carId);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["admin-cars"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return <PhotoDropZone value={imageUrl} onPick={replace} onClear={clear} busy={busy} label={label} />;
}

function NewCarForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ year: new Date().getFullYear(), make: "", model: "", trim: "", mileage: 0, price: 0, description: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickPhoto = (file: File) => {
    setPhotoFile(file);
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };
  const clearPhoto = () => {
    setPhotoFile(null);
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          const folder = crypto.randomUUID();
          const image_url = photoFile ? await uploadCarPhoto(photoFile, folder) : null;
          const { error } = await supabase.from("cars_for_sale").insert({
            year: form.year, make: form.make, model: form.model, trim: form.trim || null,
            mileage: form.mileage, price_cents: Math.round(form.price * 100),
            image_url, description: form.description || null,
          });
          if (error) throw error;
          toast.success("Listing created");
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          onCreated(); onClose();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to create listing");
        } finally {
          setSaving(false);
        }
      }}
      className="p-5 rounded-lg bg-surface-elevated border border-primary/30 space-y-3"
    >
      <h3 className="font-display uppercase tracking-wide">New Listing</h3>
      <PhotoDropZone value={previewUrl} onPick={pickPhoto} onClear={clearPhoto} label="New listing photo" />
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
      <textarea rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button>
        <button disabled={saving} className="bg-amber-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-display uppercase tracking-wide disabled:opacity-60 inline-flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}
