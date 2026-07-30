import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { adminSeats, claimAdmin } from "@/lib/roles.functions";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Your Account — A1wan Auto" },
      { name: "description", content: "Sign up to track repairs, message the shop, and pay invoices online at A1wan Auto in Grand Prairie, TX." },
      { property: "og:title", content: "Create Your Account — A1wan Auto" },
      { property: "og:description", content: "Sign up to track repairs, message the shop, and pay invoices online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
});

function SignupPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"customer" | "admin">("customer");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: seats } = useQuery({ queryKey: ["admin-seats"], queryFn: () => adminSeats() });
  const seatsFull = seats ? seats.remaining <= 0 : false;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/portal" }); });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    if (accountType === "admin" && !adminCode.trim()) { toast.error("Enter the admin code"); return; }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    if (error) { setLoading(false); toast.error(error.message); return; }

    if (accountType === "admin") {
      if (!signUpData.session) {
        await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
      }
      try {
        await claimAdmin({ data: { code: adminCode } });
        setLoading(false);
        toast.success("Admin account created!");
        navigate({ to: "/admin" });
        return;
      } catch (err) {
        setLoading(false);
        toast.error(err instanceof Error ? err.message : "Could not verify admin code");
        return;
      }
    }

    setLoading(false);
    toast.success("Account created!");
    navigate({ to: "/customer-portal" });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><Logo size="lg" /></div>
        <div className="rounded-xl bg-surface border border-border p-8">
          <h1 className="font-display uppercase text-3xl tracking-wide mb-1">Create Account</h1>
          <p className="text-sm text-muted-foreground mb-6">Track your repairs and pay invoices online.</p>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-md bg-background border border-border">
            {(["customer", "admin"] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={t === "admin" && seatsFull}
                onClick={() => setAccountType(t)}
                className={`py-2 rounded text-xs font-display uppercase tracking-wider transition disabled:opacity-40 ${
                  accountType === t ? "bg-amber-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "customer" ? "Customer" : "Shop Admin"}
              </button>
            ))}
          </div>
          {accountType === "admin" && (
            <p className="-mt-4 mb-4 text-xs text-muted-foreground">
              {seats ? `${seats.remaining} of ${seats.limit} admin seats available.` : "Checking admin seats…"}
            </p>
          )}
          {seatsFull && accountType === "customer" && (
            <p className="-mt-4 mb-4 text-xs text-muted-foreground">Admin seats are full.</p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {[
              { k: "full_name", label: "Full name", type: "text" },
              { k: "phone", label: "Phone (optional)", type: "tel" },
              { k: "email", label: "Email", type: "email" },
              { k: "password", label: "Password", type: "password" },
            ].map((f) => {
              const isPassword = f.k === "password";
              const inputType = isPassword ? (showPassword ? "text" : "password") : f.type;
              return (
                <div key={f.k}>
                  <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">{f.label}</label>
                  <div className="relative">
                    <input type={inputType} required={f.k !== "phone"} value={(form as Record<string, string>)[f.k]}
                      onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                      className={`w-full rounded-md bg-background border border-border px-4 py-3 ${isPassword ? "pr-20" : ""} focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30`} />
                    {isPassword && (
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 px-3 text-xs font-display uppercase tracking-wider text-primary hover:text-primary/80">
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {accountType === "admin" && (
              <div>
                <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">Admin code</label>
                <input type="password" required value={adminCode} onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full rounded-md bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" />
              </div>
            )}

            <button disabled={loading} className="w-full bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber disabled:opacity-60">
              {loading ? "Creating…" : accountType === "admin" ? "Create Admin Account" : "Create Account"}
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
