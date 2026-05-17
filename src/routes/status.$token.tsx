import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWorkOrderByToken } from "@/lib/public-token.functions";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/status/$token")({
  head: () => ({ meta: [{ title: "Repair Status — A1wan Auto" }] }),
  component: StatusPage,
});

const steps = ["intake", "in_progress", "ready", "completed"] as const;
const labels: Record<string, string> = {
  intake: "Checked In", in_progress: "In Progress", ready: "Ready for Pickup", completed: "Completed",
};

function StatusPage() {
  const { token } = Route.useParams();
  const fetchWO = useServerFn(getWorkOrderByToken);
  const { data, isLoading, error } = useQuery({
    queryKey: ["wo-token", token],
    queryFn: () => fetchWO({ data: { token } }),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-20 text-muted-foreground">Loading status…</div>;
  if (error || !data) return <div className="max-w-3xl mx-auto px-4 py-20 text-muted-foreground">Status link not found.</div>;

  const currentIdx = steps.indexOf(data.status as typeof steps[number]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Repair status</p>
      <h1 className="font-display uppercase text-4xl sm:text-5xl tracking-tight">{data.vehicle_description}</h1>
      <p className="mt-2 text-muted-foreground">Customer: {data.customer_name}</p>

      <div className="mt-10 p-8 rounded-xl bg-surface border border-border">
        <ol className="space-y-6">
          {steps.map((s, i) => {
            const done = i < currentIdx;
            const current = i === currentIdx;
            return (
              <li key={s} className="flex items-start gap-4">
                {done ? (
                  <CheckCircle2 className="h-7 w-7 text-primary shrink-0" />
                ) : current ? (
                  <Loader2 className="h-7 w-7 text-primary shrink-0 animate-spin" />
                ) : (
                  <Circle className="h-7 w-7 text-muted-foreground shrink-0" />
                )}
                <div>
                  <p className={`font-display uppercase tracking-wide text-lg ${current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {labels[s]}
                  </p>
                  {current && <p className="text-sm text-muted-foreground mt-1">Last updated {new Date(data.updated_at).toLocaleString()}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 p-6 rounded-lg bg-surface border border-border">
        <p className="font-display uppercase tracking-wide text-sm text-muted-foreground mb-2">Work Description</p>
        <p>{data.description}</p>
      </div>
    </div>
  );
}
