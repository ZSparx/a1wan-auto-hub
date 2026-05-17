import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/signup")({ component: SignupPage });

const schema = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/portal" }); });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Check your email to verify.");
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><Logo size="lg" /></div>
        <div className="rounded-xl bg-surface border border-border p-8">
          <h1 className="font-display uppercase text-3xl tracking-wide mb-1">Create Account</h1>
          <p className="text-sm text-muted-foreground mb-6">Track your repairs and pay invoices online.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            {[
              { k: "full_name", label: "Full name", type: "text" },
              { k: "phone", label: "Phone (optional)", type: "tel" },
              { k: "email", label: "Email", type: "email" },
              { k: "password", label: "Password", type: "password" },
            ].map((f) => (
              <div key={f.k}>
                <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">{f.label}</label>
                <input type={f.type} required={f.k !== "phone"} value={(form as Record<string, string>)[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full rounded-md bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            <button disabled={loading} className="w-full bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber disabled:opacity-60">
              {loading ? "Creating…" : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
