import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Moon,
  Sun,
  User,
  Car,
  SlidersHorizontal,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — A1wan Auto" },
      { name: "description", content: "Manage your account, vehicles, notifications, preferences, and security." },
    ],
  }),
  component: SettingsPage,
});

type Tab = "account" | "vehicles" | "notifications" | "preferences" | "security";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "security", label: "Security", icon: ShieldCheck },
];

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("account");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <header className="mb-8">
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Preferences</p>
        <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl tracking-tight">Settings</h1>
      </header>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md font-display uppercase tracking-wider text-sm whitespace-nowrap transition ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        <div>
          {tab === "account" && <AccountPanel />}
          {tab === "vehicles" && <VehiclesPanel />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "preferences" && <PreferencesPanel />}
          {tab === "security" && <SecurityPanel />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Panels ---------- */

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="p-6 rounded-lg bg-surface border border-border">
      <h2 className="font-display uppercase tracking-wide text-xl mb-1">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-md bg-surface-elevated border border-border text-foreground focus:outline-none focus:border-primary transition";

function AccountPanel() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings-profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save profile");
    } else {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["settings-profile"] });
    }
  };

  if (isLoading) return <Panel title="Account"><Loader2 className="h-5 w-5 animate-spin text-primary" /></Panel>;
  if (!profile) return <Panel title="Account" description="Sign in to manage your account.">{null}</Panel>;

  return (
    <Panel title="Account" description="Your personal details used for bookings and invoices.">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
        </Field>
        <Field label="Email">
          <input className={inputCls} value={profile.email ?? ""} disabled />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-md bg-amber-gradient text-background font-display uppercase tracking-wider text-sm disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Panel>
  );
}

function VehiclesPanel() {
  const qc = useQueryClient();
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["settings-vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ year: "", make: "", model: "", vin: "", plate: "", color: "" });

  const submit = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("vehicles").insert({
      owner_id: auth.user.id,
      year: form.year ? Number(form.year) : null,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      vin: form.vin.trim() || null,
      plate: form.plate.trim() || null,
      color: form.color.trim() || null,
    });
    if (error) return toast.error("Could not add vehicle");
    toast.success("Vehicle added");
    setForm({ year: "", make: "", model: "", vin: "", plate: "", color: "" });
    setAdding(false);
    qc.invalidateQueries({ queryKey: ["settings-vehicles"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this vehicle?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) return toast.error("Could not remove vehicle");
    toast.success("Vehicle removed");
    qc.invalidateQueries({ queryKey: ["settings-vehicles"] });
  };

  return (
    <Panel title="Vehicles" description="Cars you bring to the shop.">
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="space-y-3">
          {(vehicles ?? []).map((v) => (
            <div key={v.id} className="flex items-center justify-between p-4 rounded-md bg-surface-elevated border border-border">
              <div>
                <p className="font-display uppercase tracking-wide">
                  {[v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[v.plate && `Plate ${v.plate}`, v.vin && `VIN ${v.vin}`, v.color].filter(Boolean).join(" · ") || "No details"}
                </p>
              </div>
              <button
                onClick={() => remove(v.id)}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                aria-label="Remove vehicle"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {(vehicles ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No vehicles yet.</p>
          )}
        </div>
      )}

      {adding ? (
        <div className="mt-6 p-4 rounded-md border border-border bg-surface-elevated">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Year"><input className={inputCls} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} inputMode="numeric" maxLength={4} /></Field>
            <Field label="Make"><input className={inputCls} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></Field>
            <Field label="Model"><input className={inputCls} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
            <Field label="Color"><input className={inputCls} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
            <Field label="License plate"><input className={inputCls} value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></Field>
            <Field label="VIN"><input className={inputCls} value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} maxLength={17} /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-md border border-border text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={submit} className="px-4 py-2 rounded-md bg-amber-gradient text-background text-sm font-display uppercase tracking-wider">Add vehicle</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-display uppercase tracking-wider hover:border-primary hover:text-primary transition"
        >
          <Plus className="h-4 w-4" /> Add vehicle
        </button>
      )}
    </Panel>
  );
}

type NotifPrefs = {
  bookingUpdates: boolean;
  serviceReminders: boolean;
  invoiceReady: boolean;
  messages: boolean;
  marketing: boolean;
};

const NOTIF_DEFAULTS: NotifPrefs = {
  bookingUpdates: true,
  serviceReminders: true,
  invoiceReady: true,
  messages: true,
  marketing: false,
};

function NotificationsPanel() {
  const [prefs, setPrefs] = useState<NotifPrefs>(NOTIF_DEFAULTS);

  useEffect(() => {
    const raw = localStorage.getItem("pref:notifications:v2");
    if (raw) {
      try { setPrefs({ ...NOTIF_DEFAULTS, ...JSON.parse(raw) }); } catch { /* ignore */ }
    }
  }, []);

  const update = (key: keyof NotifPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem("pref:notifications:v2", JSON.stringify(next));
    localStorage.setItem("pref:notifications", String(Object.values(next).some(Boolean)));
  };

  const rows: { key: keyof NotifPrefs; title: string; desc: string }[] = [
    { key: "bookingUpdates", title: "Booking updates", desc: "Confirmations and status changes for your appointments." },
    { key: "serviceReminders", title: "Service reminders", desc: "Reminders before upcoming service visits." },
    { key: "invoiceReady", title: "Invoice ready", desc: "When a new quote or invoice is available to pay." },
    { key: "messages", title: "Messages", desc: "Replies from the shop in your message thread." },
    { key: "marketing", title: "Promotions", desc: "Seasonal deals and shop news. Off by default." },
  ];

  return (
    <Panel title="Notifications" description="Choose what you want to hear about.">
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <p className="font-display uppercase tracking-wide text-sm">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
            </div>
            <Toggle checked={prefs[r.key]} onChange={() => update(r.key)} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-amber-gradient" : "bg-muted"}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-background shadow transform transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        } mt-0.5`}
      />
    </button>
  );
}

function PreferencesPanel() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [channel, setChannel] = useState<"email" | "sms" | "both">("email");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const t = (localStorage.getItem("pref:theme") as "dark" | "light" | null) ?? "light";
    setTheme(t);
    applyTheme(t);
    const c = localStorage.getItem("pref:channel");
    if (c === "email" || c === "sms" || c === "both") setChannel(c);
    const l = localStorage.getItem("pref:language");
    if (l) setLanguage(l);
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    root.classList.toggle("light", t === "light");
  };

  const changeTheme = (t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem("pref:theme", t);
    applyTheme(t);
  };

  const changeChannel = (c: "email" | "sms" | "both") => {
    setChannel(c);
    localStorage.setItem("pref:channel", c);
  };

  const changeLanguage = (l: string) => {
    setLanguage(l);
    localStorage.setItem("pref:language", l);
  };

  return (
    <div className="space-y-6">
      <Panel title="Appearance" description="Choose your color theme.">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => changeTheme("dark")}
            className={`flex items-center justify-center gap-2 py-3 rounded-md border transition font-display uppercase tracking-wider text-sm ${
              theme === "dark" ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
          <button
            onClick={() => changeTheme("light")}
            className={`flex items-center justify-center gap-2 py-3 rounded-md border transition font-display uppercase tracking-wider text-sm ${
              theme === "light" ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
        </div>
      </Panel>

      <Panel title="Contact channel" description="How the shop should reach you.">
        <div className="grid grid-cols-3 gap-3">
          {(["email", "sms", "both"] as const).map((c) => (
            <button
              key={c}
              onClick={() => changeChannel(c)}
              className={`py-3 rounded-md border font-display uppercase tracking-wider text-sm transition ${
                channel === c ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "both" ? "Email + SMS" : c}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Language">
        <select value={language} onChange={(e) => changeLanguage(e.target.value)} className={inputCls}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </Panel>
    </div>
  );
}

function SecurityPanel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const canSave = useMemo(() => pwd.length >= 8 && pwd === confirm, [pwd, confirm]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const changePassword = async () => {
    if (!canSave) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPwd("");
    setConfirm("");
  };

  const sendReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { redirect: "/portal" }, replace: true });
  };

  return (
    <div className="space-y-6">
      <Panel title="Change password" description="Use at least 8 characters.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="New password">
            <input type="password" className={inputCls} value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </Field>
          <Field label="Confirm password">
            <input type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            onClick={sendReset}
            className="px-4 py-2 rounded-md border border-border text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Email reset link
          </button>
          <button
            onClick={changePassword}
            disabled={!canSave || saving}
            className="px-5 py-2 rounded-md bg-amber-gradient text-background text-sm font-display uppercase tracking-wider disabled:opacity-60"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </div>
      </Panel>

      <Panel title="Session" description="Sign out of this device.">
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-display uppercase tracking-wider hover:border-destructive hover:text-destructive transition"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </Panel>
    </div>
  );
}
