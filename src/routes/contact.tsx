import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Clock, Mail, Send } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — A1wan Auto · Grand Prairie, TX" },
      { name: "description", content: "Reach A1wan Auto at (682) 718-5547 or 2401 Fort Worth St, Grand Prairie, TX 75050." },
      { property: "og:title", content: "Contact A1wan Auto" },
      { property: "og:description", content: "Get a free quote, schedule service, or ask about a car." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(4000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send. Please call us at (682) 718-5547.");
      return;
    }
    toast.success("Message sent! We'll get back to you shortly.");
    setForm({ name: "", email: "", phone: "", message: "" });
  }

  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <p className="text-primary font-display tracking-widest uppercase text-sm mb-3">Get in touch</p>
          <h1 className="font-display font-bold uppercase text-5xl sm:text-6xl tracking-tight">Contact Us</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Questions, quotes, or appointments — send us a message or stop by the shop.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-10">
        <form onSubmit={onSubmit} className="lg:col-span-3 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </div>
          <Field label="Phone (optional)" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">Message</label>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-md bg-surface border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition resize-none"
              placeholder="Tell us about your vehicle or what you need…"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send Message"}
          </button>
        </form>

        <aside className="lg:col-span-2 space-y-4">
          <InfoCard icon={MapPin} title="Visit" lines={["2401 Fort Worth St", "Grand Prairie, TX 75050"]} />
          <InfoCard icon={Phone} title="Call" lines={[{ text: "(682) 718-5547", href: "tel:6827185547" }]} />
          <InfoCard icon={Mail} title="Email" lines={[{ text: "service@a1wanauto.com", href: "mailto:service@a1wanauto.com" }]} />
          <InfoCard icon={Clock} title="Hours" lines={["Mon – Sat: 8am – 7pm", "Sun: Closed"]} />
        </aside>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-surface border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
      />
    </div>
  );
}

type Line = string | { text: string; href: string };
function InfoCard({ icon: Icon, title, lines }: { icon: React.ElementType; title: string; lines: Line[] }) {
  return (
    <div className="p-5 rounded-lg bg-surface border border-border flex gap-4">
      <Icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="font-display uppercase tracking-wide text-sm text-muted-foreground">{title}</p>
        <div className="mt-1 text-foreground space-y-0.5">
          {lines.map((l, i) =>
            typeof l === "string"
              ? <p key={i}>{l}</p>
              : <a key={i} href={l.href} className="block hover:text-primary">{l.text}</a>
          )}
        </div>
      </div>
    </div>
  );
}
