import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const SERVICES = [
  "Oil Change",
  "Brake Service",
  "Engine Diagnostics",
  "Suspension & Steering",
  "Transmission Service",
  "Air Conditioning",
  "Other",
] as const;

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>) => ({
    service: typeof s.service === "string" ? s.service : "",
  }),
  head: () => ({
    meta: [
      { title: "Book Service — A1wan Auto" },
      { name: "description", content: "Request a service appointment at A1wan Auto in Grand Prairie, TX." },
    ],
  }),
  component: BookPage,
});

const schema = z.object({
  service: z.string().min(1).max(120),
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().trim().email().max(200),
  customer_phone: z.string().trim().max(40).optional().or(z.literal("")),
  vehicle_description: z.string().trim().max(200).optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

function BookPage() {
  const { service: preselected } = Route.useSearch();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    service: preselected || "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    vehicle_description: "",
    preferred_date: "",
    notes: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setForm((f) => ({ ...f, customer_email: f.customer_email || data.user!.email! }));
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("bookings").insert({
      service: parsed.data.service,
      customer_name: parsed.data.customer_name,
      customer_email: parsed.data.customer_email,
      customer_phone: parsed.data.customer_phone || null,
      vehicle_description: parsed.data.vehicle_description || null,
      preferred_date: parsed.data.preferred_date || null,
      notes: parsed.data.notes || null,
      customer_id: userData.user?.id ?? null,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted(true);
    toast.success("Booking request sent — we'll be in touch shortly.");
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl">Request Received</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Thanks, {form.customer_name.split(" ")[0]}. We'll text or email you within one business day to confirm your appointment.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 border border-border bg-surface px-5 py-3 rounded-md font-display uppercase tracking-wider text-sm">
            Back home
          </Link>
          <button
            onClick={() => navigate({ to: "/services" })}
            className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground px-5 py-3 rounded-md font-display uppercase tracking-wider text-sm shadow-glow-amber"
          >
            Browse services <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Book an appointment</p>
      <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl tracking-tight">Request Service</h1>
      <p className="mt-3 text-muted-foreground">
        Tell us what your vehicle needs and your preferred day. We'll confirm a time that works.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5 rounded-xl bg-surface border border-border p-6 sm:p-8">
        <Field label="Service">
          <select
            required
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            className="w-full rounded-md bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary"
          >
            <option value="">Select a service…</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Your name">
            <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <Field label="Email">
          <input type="email" required value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className={inputCls} />
        </Field>

        <Field label="Vehicle (year, make, model)">
          <input placeholder="2018 Toyota Camry" value={form.vehicle_description} onChange={(e) => setForm({ ...form, vehicle_description: e.target.value })} className={inputCls} />
        </Field>

        <Field label="Preferred date">
          <input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} className={inputCls} />
        </Field>

        <Field label="Notes (optional)">
          <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
        </Field>

        <button
          disabled={loading}
          className="w-full bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber disabled:opacity-60"
        >
          {loading ? "Sending…" : "Request Appointment"}
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-md bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">{label}</label>
      {children}
    </div>
  );
}
