import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, Phone, FileText, ChevronRight, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: CustomersAdmin,
});

function CustomersAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [profilesRes, rolesRes, invoicesRes, unreadRes, vehiclesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("invoices").select("customer_id, total_cents, status"),
        supabase
          .from("customer_messages")
          .select("customer_id")
          .eq("sender", "customer")
          .eq("read_by_admin", false),
        supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
      ]);
      const excludedIds = new Set(
        (rolesRes.data ?? [])
          .filter((r) => r.role === "admin" || r.role === "mechanic")
          .map((r) => r.user_id),
      );
      const customers = (profilesRes.data ?? []).filter((p) => !excludedIds.has(p.id));
      const invoiceMap = new Map<string, { count: number; unpaid: number; paid: number }>();
      for (const inv of invoicesRes.data ?? []) {
        if (!inv.customer_id) continue;
        const m = invoiceMap.get(inv.customer_id) ?? { count: 0, unpaid: 0, paid: 0 };
        m.count += 1;
        if (inv.status === "paid") m.paid += inv.total_cents ?? 0;
        else if (inv.status === "sent") m.unpaid += inv.total_cents ?? 0;
        invoiceMap.set(inv.customer_id, m);
      }
      const unreadMap = new Map<string, number>();
      for (const r of unreadRes.data ?? []) {
        unreadMap.set(r.customer_id, (unreadMap.get(r.customer_id) ?? 0) + 1);
      }
      const vehicleMap = new Map<string, string[]>();
      for (const v of vehiclesRes.data ?? []) {
        const label = [v.year, v.make, v.model].filter(Boolean).join(" ") || v.plate || v.vin || "Vehicle";
        vehicleMap.set(v.owner_id, [...(vehicleMap.get(v.owner_id) ?? []), label]);
      }
      return { customers, invoiceMap, unreadMap, vehicleMap };
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" /> Customers
      </h2>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data?.customers.length ? (
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-border border-dashed">
          No customers have signed up yet.
        </p>
      ) : (
        <div className="space-y-3">
          {data.customers.map((c) => {
            const stats = data.invoiceMap.get(c.id) ?? { count: 0, unpaid: 0, paid: 0 };
            const unread = data.unreadMap.get(c.id) ?? 0;
            return (
              <Link
                key={c.id}
                to="/admin/customers/$id"
                params={{ id: c.id }}
                className="p-5 rounded-lg bg-surface border border-border flex flex-wrap items-start justify-between gap-4 hover:border-primary/40 transition"
              >
                <div>
                  <p className="font-display uppercase tracking-wide text-lg inline-flex items-center gap-2">
                    {c.full_name ?? "Unnamed customer"}
                    {unread > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-gradient text-primary-foreground">
                        <MessageSquare className="h-3 w-3" /> {unread} new
                      </span>
                    )}
                  </p>
                  <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                    {c.email && (
                      <p className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </p>
                    )}
                    {c.phone && (
                      <p className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Joined {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xs font-display uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-end">
                    <FileText className="h-3 w-3" /> {stats.count} invoice{stats.count === 1 ? "" : "s"}
                  </p>
                  {stats.unpaid > 0 && (
                    <p className="text-sm mt-1 text-amber-400">
                      Unpaid: ${(stats.unpaid / 100).toFixed(2)}
                    </p>
                  )}
                  {stats.paid > 0 && (
                    <p className="text-sm text-emerald-400">
                      Paid: ${(stats.paid / 100).toFixed(2)}
                    </p>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
