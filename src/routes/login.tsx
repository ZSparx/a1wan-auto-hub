import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/portal" }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect });
    });
  }, [navigate, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    navigate({ to: redirect });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><Logo size="lg" /></div>
        <div className="rounded-xl bg-surface border border-border p-8">
          <h1 className="font-display uppercase text-3xl tracking-wide mb-1">Sign In</h1>
          <p className="text-sm text-muted-foreground mb-6">Access your service history and invoices.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" />
            </div>
            <button disabled={loading} className="w-full bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber disabled:opacity-60">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            New customer? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
