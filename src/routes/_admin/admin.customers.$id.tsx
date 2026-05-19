import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, Calendar, Wrench, FileText, Car, ExternalLink, MessageSquare, Send } from "lucide-react";

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

      {/* Messages */}
      <MessagesPanel customerId={profile.id} customerName={profile.full_name ?? "customer"} />
    </div>
  );
}

function MessagesPanel({ customerId, customerName }: { customerId: string; customerName: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-messages", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_messages")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Mark customer messages as read by admin when opened
  useEffect(() => {
    if (!messages?.some((m) => m.sender === "customer" && !m.read_by_admin)) return;
    supabase
      .from("customer_messages")
      .update({ read_by_admin: true })
      .eq("customer_id", customerId)
      .eq("sender", "customer")
      .eq("read_by_admin", false)
      .then(() => qc.invalidateQueries({ queryKey: ["admin-messages", customerId] }));
  }, [messages, customerId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages?.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("customer_messages").insert({
        customer_id: customerId,
        sender: "admin",
        body,
        read_by_admin: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["admin-messages", customerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 rounded-lg bg-surface border border-border">
      <h3 className="font-display uppercase tracking-wide text-xl inline-flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" /> Messages
      </h3>

      <div
        ref={scrollRef}
        className="max-h-96 overflow-y-auto space-y-3 p-3 rounded-md bg-background border border-border mb-3"
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !messages?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No messages yet. Start the conversation with {customerName}.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === "admin";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    mine
                      ? "bg-amber-gradient text-primary-foreground"
                      : "bg-surface-elevated border border-border"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body) return;
          send.mutate(body);
        }}
        className="flex gap-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const body = draft.trim();
              if (body) send.mutate(body);
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder={`Reply to ${customerName}…`}
          className="flex-1 rounded-md bg-background border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={send.isPending || !draft.trim()}
          className="inline-flex items-center gap-1.5 bg-amber-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-display uppercase tracking-wide disabled:opacity-50 self-end"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
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
