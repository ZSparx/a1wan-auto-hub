import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — A1wan Auto" },
      { name: "description", content: "Manage your notification and appearance preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedNotif = localStorage.getItem("pref:notifications");
    if (savedNotif !== null) setNotifications(savedNotif === "true");
    const savedTheme = (localStorage.getItem("pref:theme") as "dark" | "light" | null) ?? "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    root.classList.toggle("light", t === "light");
  };

  const toggleNotifications = () => {
    const v = !notifications;
    setNotifications(v);
    localStorage.setItem("pref:notifications", String(v));
  };

  const changeTheme = (t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem("pref:theme", t);
    applyTheme(t);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <header className="mb-10">
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Preferences</p>
        <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl tracking-tight">Settings</h1>
      </header>

      <section className="space-y-4">
        <div className="p-5 rounded-lg bg-surface border border-border flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-display uppercase tracking-wide">Notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                Get updates about your bookings, invoices, and messages.
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={notifications}
            onClick={toggleNotifications}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
              notifications ? "bg-amber-gradient" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-background shadow transform transition ${
                notifications ? "translate-x-5" : "translate-x-0.5"
              } mt-0.5`}
            />
          </button>
        </div>

        <div className="p-5 rounded-lg bg-surface border border-border">
          <div className="flex items-start gap-3 mb-4">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-primary mt-0.5" />
            ) : (
              <Sun className="h-5 w-5 text-primary mt-0.5" />
            )}
            <div>
              <p className="font-display uppercase tracking-wide">Appearance</p>
              <p className="text-sm text-muted-foreground mt-1">Choose your color theme.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => changeTheme("dark")}
              className={`flex items-center justify-center gap-2 py-3 rounded-md border transition font-display uppercase tracking-wider text-sm ${
                theme === "dark"
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
            <button
              onClick={() => changeTheme("light")}
              className={`flex items-center justify-center gap-2 py-3 rounded-md border transition font-display uppercase tracking-wider text-sm ${
                theme === "light"
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
