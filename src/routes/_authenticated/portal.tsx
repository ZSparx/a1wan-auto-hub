import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Car, Wrench, FileText, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: "Customer Portal — A1wan Auto" }] }),
  component: Portal,
});

function Portal() {
  const [displayName, setDisplayName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(
        profile?.full_name?.trim() ||
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          (user.email ? user.email.split("@")[0] : "")
      );
    });
  }, []);

  const { data: vehicles } = useQuery({
    queryKey: ["portal-vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: workOrders } = useQuery({
    queryKey: ["portal-work-orders"],
    queryFn: async () => (await supabase.from("work_orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: invoices } = useQuery({
    queryKey: ["portal-invoices"],
    queryFn: async () => (await supabase.from("invoices").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const unpaid = invoices?.filter((i) => i.status === "sent") ?? [];
  const active = workOrders?.filter((w) => w.status !== "completed") ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <header className="mb-10">
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Your account</p>
        <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl tracking-tight">Customer Portal</h1>
        {displayName && <p className="mt-2 text-xl font-display tracking-wide">{displayName}</p>}
        {userEmail && <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>}
      </header>

      <div className="grid md:grid-cols-3 gap-5 mb-10">
        <StatCard icon={Car} label="Vehicles" value={vehicles?.length ?? 0} />
        <StatCard icon={Wrench} label="Active Jobs" value={active.length} />
        <StatCard icon={FileText} label="Unpaid Invoices" value={unpaid.length} accent />
      </div>

      <Section title="Active Work Orders">
        {active.length === 0 ? (
          <Empty text="No active jobs right now." />
        ) : (
          <div className="space-y-3">
            {active.map((w) => (
              <div key={w.id} className="p-5 rounded-lg bg-surface border border-border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display uppercase tracking-wide">{w.vehicle_description}</p>
                  <p className="text-sm text-muted-foreground mt-1">{w.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={w.status} />
                  <a href={`/status/${w.public_token}`} className="text-xs inline-flex items-center gap-1 text-primary hover:underline">
                    Share status <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Invoices">
        {!invoices?.length ? (
          <Empty text="No invoices yet." />
        ) : (
          <div className="space-y-3">
            {invoices.map((i) => (
              <div key={i.id} className="p-5 rounded-lg bg-surface border border-border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display uppercase tracking-wide">${(i.total_cents / 100).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Due {i.due_date ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded font-display ${
                    i.status === "paid" ? "bg-emerald-500/15 text-emerald-400" :
                    i.status === "sent" ? "bg-amber-gradient text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>{i.status}</span>
                  {i.status === "sent" && (
                    <a href={`/pay/${i.public_token}`} className="text-xs inline-flex items-center gap-1 text-primary hover:underline">
                      View & pay <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Service History">
        {!workOrders?.length ? (
          <Empty text="No service history yet — your first visit will show up here." />
        ) : (
          <div className="space-y-2">
            {workOrders.map((w) => (
              <div key={w.id} className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{w.vehicle_description} — <span className="text-muted-foreground">{w.description}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <StatusPill status={w.status} />
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-lg border ${accent && value > 0 ? "border-primary/50 bg-surface-elevated" : "border-border bg-surface"}`}>
      <Icon className={`h-6 w-6 ${accent && value > 0 ? "text-primary" : "text-muted-foreground"}`} />
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground font-display">{label}</p>
      <p className="mt-1 text-3xl font-display">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display uppercase tracking-wide text-2xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-muted-foreground text-sm p-6 rounded-lg bg-surface border border-border border-dashed">{text}</p>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    intake: "bg-muted text-muted-foreground",
    in_progress: "bg-amber-gradient text-primary-foreground",
    ready: "bg-emerald-500/20 text-emerald-400",
    completed: "bg-secondary text-secondary-foreground",
  };
  return <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded font-display ${map[status] ?? "bg-muted"}`}>{status.replace("_", " ")}</span>;
}
