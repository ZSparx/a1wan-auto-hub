import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["work_order_status"];
const STATUSES: Status[] = ["intake", "in_progress", "ready", "completed"];

export const Route = createFileRoute("/_authenticated/mechanic")({
  head: () => ({
    meta: [
      { title: "Mechanic Jobs — A1wan Auto" },
      { name: "description", content: "Assigned repair jobs and status updates for A1wan Auto mechanics." },
    ],
  }),
  component: MechanicDashboard,
});

function MechanicDashboard() {
  const qc = useQueryClient();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["mechanic-jobs"],
    queryFn: async () =>
      (await supabase.from("work_orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("work_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["mechanic-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-1">Mechanic</p>
        <h1 className="font-display font-bold uppercase text-4xl tracking-tight">My Jobs</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !jobs?.length ? (
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-dashed border-border">
          No jobs assigned to you yet.
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((w) => (
            <div key={w.id} className="p-5 rounded-lg bg-surface border border-border">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display uppercase tracking-wide text-lg inline-flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" /> {w.vehicle_description}
                  </p>
                  <p className="text-sm text-muted-foreground">{w.customer_name}</p>
                  <p className="text-sm mt-2">{w.description}</p>
                </div>
                <select
                  value={w.status}
                  onChange={(e) => update.mutate({ id: w.id, status: e.target.value as Status })}
                  className="rounded-md bg-background border border-border px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
