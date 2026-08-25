import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { UserPlus, Users } from "lucide-react";
import { createAccount, adminSeats, listAccounts, setUserRole } from "@/lib/roles.functions";

export const Route = createFileRoute("/_admin/admin/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Admin" }] }),
  component: AccountsAdmin,
});

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().max(40),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  role: z.enum(["customer", "mechanic"]),
});

const ROLES = ["customer", "mechanic", "admin"] as const;

function AccountsAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role: "customer" as "customer" | "mechanic" });

  const { data: seats } = useQuery({ queryKey: ["admin-seats"], queryFn: () => adminSeats() });
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["admin-seats"] });
    qc.invalidateQueries({ queryKey: ["mechanics"] });
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
  };

  const create = useMutation({
    mutationFn: async () => createAccount({ data: schema.parse(form) }),
    onSuccess: () => {
      toast.success("Account created");
      setForm({ full_name: "", email: "", phone: "", password: "", role: form.role });
      refresh();
    },
    onError: (e: unknown) => {
      const msg = e instanceof z.ZodError ? e.issues[0]?.message : e instanceof Error ? e.message : "Failed";
      toast.error(msg ?? "Failed");
    },
  });

  const changeRole = useMutation({
    mutationFn: async (vars: { user_id: string; role: (typeof ROLES)[number] }) => setUserRole({ data: vars }),
    onSuccess: () => { toast.success("Role updated"); refresh(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not update role"),
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display uppercase tracking-wide text-2xl inline-flex items-center gap-2">
        <UserPlus className="h-6 w-6 text-primary" /> Accounts
      </h2>

      <div className="p-5 rounded-lg bg-surface border border-border">
        <p className="text-sm text-muted-foreground">
          Admin seats used: <span className="text-foreground font-medium">{seats?.used ?? "—"} / {seats?.limit ?? 2}</span>.
          Promote any existing account to admin below, up to the seat limit.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
        className="p-5 rounded-lg bg-surface border border-border space-y-4"
      >
        <h3 className="font-display uppercase tracking-wide text-lg">Create a profile</h3>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-background border border-border max-w-xs">
          {(["customer", "mechanic"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
              className={`py-2 rounded text-xs font-display uppercase tracking-wider transition ${
                form.role === r ? "bg-amber-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {r}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {([
            { k: "full_name", label: "Full name", type: "text" },
            { k: "email", label: "Email", type: "email" },
            { k: "phone", label: "Phone (optional)", type: "tel" },
            { k: "password", label: "Temporary password", type: "text" },
          ] as const).map((f) => (
            <div key={f.k}>
              <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">{f.label}</label>
              <input
                type={f.type}
                value={form[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="w-full rounded-md bg-background border border-border px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
        </div>
        <button disabled={create.isPending}
          className="bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3 rounded-md shadow-glow-amber disabled:opacity-60">
          {create.isPending ? "Creating…" : "Create account"}
        </button>
        <p className="text-xs text-muted-foreground">
          The person can sign in right away with this email and temporary password.
        </p>
      </form>

      <div className="p-5 rounded-lg bg-surface border border-border">
        <h3 className="font-display uppercase tracking-wide text-lg mb-3 inline-flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Everyone &amp; permissions
        </h3>
        {!accounts?.length ? (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((a) => (
              <li key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {a.full_name ?? "Unnamed"}
                    {a.isSelf && <span className="ml-2 text-xs text-primary">(you)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
                </div>
                <div className="flex gap-1 p-1 rounded-md bg-background border border-border">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={changeRole.isPending || a.role === r}
                      onClick={() => changeRole.mutate({ user_id: a.id, role: r })}
                      className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider transition disabled:cursor-default ${
                        a.role === r ? "bg-amber-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
