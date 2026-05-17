import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_admin/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: ReportsAdmin,
});

const PIE_COLORS = ["#f97316", "#fbbf24", "#fb923c", "#facc15", "#ea580c", "#d97706", "#92400e"];

function ReportsAdmin() {
  const year = new Date().getFullYear();

  const { data: invoices } = useQuery({
    queryKey: ["report-invoices", year],
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("total_cents, paid_at, status")
        .eq("status", "paid")
        .gte("paid_at", `${year}-01-01`).lte("paid_at", `${year}-12-31`);
      return data ?? [];
    },
  });

  const { data: workOrders } = useQuery({
    queryKey: ["report-work-orders"],
    queryFn: async () => (await supabase.from("work_orders").select("description")).data ?? [],
  });

  const { data: bookings } = useQuery({
    queryKey: ["report-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("service")).data ?? [],
  });

  const months = Array.from({ length: 12 }, (_, m) => ({
    month: new Date(year, m, 1).toLocaleString("en-US", { month: "short" }),
    revenue: 0,
  }));
  (invoices ?? []).forEach((i) => {
    if (!i.paid_at) return;
    const m = new Date(i.paid_at).getMonth();
    months[m].revenue += (i.total_cents ?? 0) / 100;
  });

  const ytd = months.reduce((a, m) => a + m.revenue, 0);

  // Top services breakdown — count from bookings + work order descriptions
  const SERVICE_KEYWORDS = ["oil change", "brake", "engine", "diagnostic", "suspension", "transmission", "air conditioning", "a/c", "tire", "alignment"];
  const counts: Record<string, number> = {};
  (bookings ?? []).forEach((b) => { counts[b.service] = (counts[b.service] ?? 0) + 1; });
  (workOrders ?? []).forEach((w) => {
    const txt = (w.description ?? "").toLowerCase();
    for (const kw of SERVICE_KEYWORDS) {
      if (txt.includes(kw)) {
        const key = kw === "a/c" ? "Air Conditioning" : kw.split(" ").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
        counts[key] = (counts[key] ?? 0) + 1;
        break;
      }
    }
  });
  const topServices = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Reports — {year}</h2>
      </div>

      <div className="p-6 rounded-lg bg-surface border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display uppercase tracking-wide text-xl inline-flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Revenue (YTD)</h3>
          <p className="font-display text-3xl text-primary text-glow-amber">${ytd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "oklch(0.205 0.014 50)", border: "1px solid oklch(0.3 0.014 50)", borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-surface border border-border">
        <h3 className="font-display uppercase tracking-wide text-xl mb-4">Top Services</h3>
        {topServices.length === 0 ? (
          <p className="text-muted-foreground text-sm">Not enough data yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topServices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50}>
                    {topServices.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.205 0.014 50)", border: "1px solid oklch(0.3 0.014 50)", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2">
              {topServices.map((s, i) => (
                <li key={s.name} className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name}
                  </span>
                  <span className="font-display text-primary">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
