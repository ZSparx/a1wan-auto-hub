import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Mail, Check } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/messages")({
  head: () => ({ meta: [{ title: "Messages — Admin" }] }),
  component: MessagesAdmin,
});

function MessagesAdmin() {
  const qc = useQueryClient();
  const { data: messages } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => (await supabase.from("contact_messages").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Messages</h2>
      {!messages?.length ? (
        <p className="text-muted-foreground p-6 rounded-lg bg-surface border border-border border-dashed">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`p-5 rounded-lg border ${m.read ? "bg-surface border-border" : "bg-surface-elevated border-primary/40"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display uppercase tracking-wide">{m.name}{!m.read && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-gradient text-primary-foreground">NEW</span>}</p>
                  <p className="text-sm text-muted-foreground">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`mailto:${m.email}?subject=Re: Your message to A1wan Auto`} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider">
                    <Mail className="h-3 w-3" /> Reply
                  </a>
                  {!m.read && (
                    <button onClick={() => markRead.mutate(m.id)} className="text-xs px-3 py-1.5 rounded border border-border bg-background text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      <Check className="h-3 w-3" /> Mark read
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
