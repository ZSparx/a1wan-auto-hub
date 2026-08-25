import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Wrench, FileText, MessageSquare, Car, BarChart3, CalendarClock, Users, UserPlus, Star,
} from "lucide-react";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ location }) => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", sess.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

const links: { to: string; label: string; icon: React.ElementType; exact?: boolean }[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/admin/work-orders", label: "Work Orders", icon: Wrench },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/accounts", label: "Accounts", icon: UserPlus },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/cars", label: "Cars", icon: Car },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-1">Admin</p>
        <h1 className="font-display font-bold uppercase text-4xl tracking-tight">Dashboard</h1>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
            {links.map((l) => {
              const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`shrink-0 inline-flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-display uppercase tracking-wide transition ${
                    active
                      ? "bg-amber-gradient text-primary-foreground shadow-glow-amber"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
