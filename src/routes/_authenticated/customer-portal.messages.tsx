import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/customer-portal/messages")({
  head: () => ({
    meta: [
      { title: "Messages — A1wan Auto" },
      { name: "description", content: "Message the A1wan Auto team directly from your customer portal." },
    ],
  }),
  component: MessagesPage,
  errorComponent: ({ error }) => (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

const bodySchema = z.string().trim().min(1, "Type a message first").max(2000, "Message is too long");

function MessagesPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ["portal-messages", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_messages")
        .select("*")
        .eq("customer_id", userId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchOnWindowFocus: true,
  });

  // Mark admin messages as read on view
  useEffect(() => {
    if (!userId || !messages.length) return;
    const unread = messages.filter((m) => m.sender === "admin" && !m.read_by_customer);
    if (!unread.length) return;
    supabase
      .from("customer_messages")
      .update({ read_by_customer: true })
      .in("id", unread.map((m) => m.id))
      .then(() => {
        qc.invalidateQueries({ queryKey: ["portal-unread-messages"] });
      });
  }, [messages, userId, qc]);

  // Auto-scroll to latest
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const parsed = bodySchema.safeParse(text);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid message");
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("customer_messages").insert({
        customer_id: userId,
        sender: "customer",
        body: parsed.data,
        read_by_admin: false,
        read_by_customer: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["portal-messages", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/customer-portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to portal
      </Link>
      <header className="mb-6">
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Direct line</p>
        <h1 className="font-display font-bold uppercase text-3xl sm:text-4xl tracking-tight">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Talk directly with the A1wan Auto team about your vehicles, quotes, or open work orders.
        </p>
      </header>

      <div className="rounded-xl bg-surface border border-border flex flex-col h-[65vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No messages yet — send us a note below and we'll reply as soon as we can.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender === "customer";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-foreground"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 uppercase tracking-wider font-display ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send.mutate(body); }}
          className="border-t border-border p-3 flex items-end gap-2"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send.mutate(body);
              }
            }}
            rows={2}
            placeholder="Type your message… (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none rounded-md bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={send.isPending || !body.trim()}
            className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider text-sm px-4 py-2.5 rounded-md shadow-glow-amber disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {send.isPending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
