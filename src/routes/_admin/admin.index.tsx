import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, Wrench, FileText, MessageSquare, DollarSign, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — A1wan Auto" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [bookings, workOrders, invoices, messages] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      ]);
      return {
        bookings: bookings.data ?? [],
        workOrders: workOrders.data ?? [],
        invoices: invoices.data ?? [],
        messages: messages.data ?? [],
      };
    },
  });

  const newBookings = data?.bookings.filter((b) => b.status === "requested").length ?? 0;
  const activeJobs = data?.workOrders.filter((w) => w.status !== "completed").length ?? 0;
  const unpaid = data?.invoices.filter((i) => i.status === "sent") ?? [];
  const unpaidTotal = unpaid.reduce((acc, i) => acc + (i.total_cents ?? 0), 0);
  const unreadMessages = data?.messages.filter((m) => !m.read).length ?? 0;

  const monthRevenue = (data?.invoices ?? [])
    .filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at).getMonth() === new Date().getMonth())
    .reduce((a, i) => a + (i.total_cents ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={CalendarClock} label="New Bookings" value={newBookings} accent={newBookings > 0} href="/admin/bookings" />
        <Stat icon={Wrench} label="Active Jobs" value={activeJobs} href="/admin/work-orders" />
        <Stat icon={FileText} label="Unpaid Invoices" value={`$${(unpaidTotal / 100).toFixed(0)}`} sub={`${unpaid.length} open`} href="/admin/invoices" />
        <Stat icon={MessageSquare} label="Unread Messages" value={unreadMessages} accent={unreadMessages > 0} href="/admin/messages" />
      </div>

      <Card>
        <Header title="This Month" icon={DollarSign} />
        <p className="font-display text-5xl text-primary text-glow-amber">
          ${(monthRevenue / 100).toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Revenue collected this month</p>
      </Card>

      <Card>
        <Header title="Recent Booking Requests" icon={CalendarClock} action={<Link to="/admin/bookings" className="text-primary text-sm inline-flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>} />
        {!data?.bookings.length ? (
          <p className="text-sm text-muted-foreground py-4">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.bookings.slice(0, 5).map((b) => (
              <li key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{b.customer_name} — <span className="text-muted-foreground">{b.service}</span></p>
                  <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                </div>
                <span className="text-xs font-display uppercase tracking-wider px-2 py-1 rounded bg-muted text-muted-foreground">{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, accent, href }: { icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; accent?: boolean; href: string }) {
  return (
    <Link to={href} className={`block p-5 rounded-lg border transition ${accent ? "border-primary/50 bg-surface-elevated hover:bg-surface-elevated/80" : "border-border bg-surface hover:border-primary/30"}`}>
      <Icon className={`h-5 w-5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground font-display">{label}</p>
      <p className="mt-1 text-3xl font-display">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Link>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="p-6 rounded-lg bg-surface border border-border">{children}</div>;
}
function Header({ title, icon: Icon, action }: { title: string; icon: React.ElementType; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display uppercase tracking-wide text-xl inline-flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {title}</h2>
      {action}
    </div>
  );
}
