import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Phone, Calendar, Wrench, FileText, Car, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/customers/$id")({
  head: () => ({ meta: [{ title: "Customer Detail — Admin" }] }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: async () => {
      const [profile, vehicles, bookings, workOrders, invoices] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("vehicles").select("*").eq("owner_id", id).order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase.from("work_orders").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      ]);
      return {
        profile: profile.data,
        vehicles: vehicles.data ?? [],
        bookings: bookings.data ?? [],
        workOrders: workOrders.data ?? [],
        invoices: invoices.data ?? [],
      };
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data?.profile) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-border border-dashed">
          Customer not found.
        </p>
      </div>
    );
  }

  const { profile, vehicles, bookings, workOrders, invoices } = data;
  const unpaid = invoices.filter((i) => i.status === "sent");
  const paid = invoices.filter((i) => i.status === "paid");
  const unpaidTotal = unpaid.reduce((a, i) => a + (i.total_cents ?? 0), 0);
  const paidTotal = paid.reduce((a, i) => a + (i.total_cents ?? 0), 0);
  const activeOrders = workOrders.filter((w) => w.status !== "completed");

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Profile header */}
      <div className="p-6 rounded-lg bg-surface border border-border">
        <h2 className="font-display uppercase tracking-wide text-3xl">
          {profile.full_name ?? "Unnamed customer"}
        </h2>
        <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
          {profile.email && (
            <p className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {profile.email}
            </p>
          )}
          {profile.phone && (
            <p className="inline-flex items-center gap-1.5">
              <Phone className="h-4 w-4" /> {profile.phone}
            </p>
          )}
          <p className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Invoice summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Unpaid" value={`$${(unpaidTotal / 100).toFixed(2)}`} sub={`${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}`} accent={unpaid.length > 0} />
        <Stat label="Paid (lifetime)" value={`$${(paidTotal / 100).toFixed(2)}`} sub={`${paid.length} invoice${paid.length === 1 ? "" : "s"}`} />
        <Stat label="Active work orders" value={activeOrders.length} sub={`${workOrders.length} total`} />
      </div>

      {/* Unpaid invoices */}
      <Section title="Unpaid Invoices" icon={FileText}>
        {!unpaid.length ? (
          <Empty>No outstanding invoices.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {unpaid.map((i) => (
              <li key={i.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-lg text-primary">${(i.total_cents / 100).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(i.created_at).toLocaleDateString()}
                    {i.due_date ? ` · Due ${i.due_date}` : ""}
                  </p>
                </div>
                <a
                  href={`/pay/${i.public_token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-background hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Pay link
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Work orders */}
      <Section title="Recent Work Orders" icon={Wrench}>
        {!workOrders.length ? (
          <Empty>No work orders yet.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {workOrders.slice(0, 10).map((w) => (
              <li key={w.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{w.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.vehicle_description} · {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Service history / bookings */}
      <Section title="Service History" icon={Calendar}>
        {!bookings.length ? (
          <Empty>No bookings on record.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.map((b) => (
              <li key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{b.service}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.vehicle_description ?? "—"} ·{" "}
                    {b.scheduled_at
                      ? new Date(b.scheduled_at).toLocaleString()
                      : b.preferred_date
                        ? `Preferred ${b.preferred_date}`
                        : `Requested ${new Date(b.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Vehicles */}
      <Section title="Vehicles" icon={Car}>
        {!vehicles.length ? (
          <Empty>No vehicles on file.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {vehicles.map((v) => (
              <li key={v.id} className="py-3">
                <p className="font-medium">
                  {[v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[v.color, v.plate && `Plate ${v.plate}`, v.vin && `VIN ${v.vin}`].filter(Boolean).join(" · ") || "No details"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/customers" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
      <ArrowLeft className="h-4 w-4" /> Back to customers
    </Link>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-5 rounded-lg border ${accent ? "border-primary/50 bg-surface-elevated" : "border-border bg-surface"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">{label}</p>
      <p className={`mt-1 text-3xl font-display ${accent ? "text-primary" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-lg bg-surface border border-border">
      <h3 className="font-display uppercase tracking-wide text-xl inline-flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-2">{children}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed" || status === "paid"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "void" || status === "cancelled"
        ? "bg-destructive/15 text-destructive"
        : "bg-amber-gradient text-primary-foreground";
  return (
    <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded font-display ${tone}`}>
      {status}
    </span>
  );
}
