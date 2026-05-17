import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminExists, bootstrapAdmin } from "@/lib/admin-bootstrap.functions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin-setup")({
  component: AdminSetupPage,
  head: () => ({
    meta: [
      { title: "Admin Setup · A1wan Auto" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminSetupPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(adminExists);
  const claim = useServerFn(bootstrapAdmin);

  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [exists, setExists] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
      setCheckingSession(false);
    });
    checkAdmin()
      .then((r) => setExists(r.exists))
      .catch(() => setExists(null));
  }, [checkAdmin]);

  async function onClaim() {
    setSubmitting(true);
    try {
      await claim();
      toast.success("You're now the admin!");
      navigate({ to: "/admin" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to claim admin");
      const r = await checkAdmin().catch(() => null);
      if (r) setExists(r.exists);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl tracking-wide">First-Time Admin Setup</h1>
          </div>
          <p className="text-muted-foreground mb-8 text-sm">
            Claim the admin account for A1wan Auto. This page works only once — after the first
            admin is created, it becomes inert.
          </p>

          {checkingSession || exists === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : exists ? (
            <div className="space-y-4">
              <p className="text-sm">
                An admin has already been configured. If you need access, please contact the
                current admin.
              </p>
              <Link to="/" className="text-primary hover:underline text-sm">← Back to home</Link>
            </div>
          ) : !sessionEmail ? (
            <div className="space-y-4">
              <p className="text-sm">You need to sign in first, then return to this page.</p>
              <div className="flex gap-3">
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
                >
                  Sign up
                </Link>
                <Link
                  to="/login"
                  search={{ redirect: "/admin-setup" }}
                  className="px-5 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-surface"
                >
                  Log in
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Signed in as <span className="text-foreground font-medium">{sessionEmail}</span>.
                Click below to grant this account admin access.
              </p>
              <button
                onClick={onClaim}
                disabled={submitting}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Granting…" : "Make me the admin"}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
