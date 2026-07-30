import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Settings, MessageSquare, User, X, LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/cars-for-sale", label: "Cars for Sale" },
  { to: "/book", label: "Book" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMechanic, setIsMechanic] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async (s: Session | null) => {
      if (!s) { setIsAdmin(false); setIsMechanic(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
      setIsAdmin(!!data?.some((r) => r.role === "admin"));
      setIsMechanic(!!data?.some((r) => r.role === "mechanic"));
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); checkAdmin(s); });
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); checkAdmin(data.session); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-2 py-2 text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "px-2 py-2 text-sm font-medium tracking-wide uppercase text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display font-semibold tracking-wide uppercase text-sm px-4 py-2 rounded-md shadow-glow-amber hover:brightness-110 transition"
          >
            <MessageSquare className="h-4 w-4" />
            Message Now
          </Link>
          <Link
            to="/settings"
            className="p-2 text-muted-foreground hover:text-foreground transition"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
          {session ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-display uppercase tracking-wider bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition"
                >
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Link>
              )}
              {isMechanic && !isAdmin && (
                <Link
                  to="/mechanic"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-display uppercase tracking-wider bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition"
                >
                  <ShieldCheck className="h-4 w-4" /> My Jobs
                </Link>
              )}
              <Link
                to={isAdmin ? "/portal" : isMechanic ? "/mechanic" : "/customer-portal"}
                className="p-2 text-muted-foreground hover:text-foreground transition"
                aria-label={isAdmin ? "Admin" : "Customer portal"}
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 text-muted-foreground hover:text-foreground transition"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              <User className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {session && isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-primary/15 text-primary border border-primary/40"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <button
            type="button"
            className="p-2 text-foreground"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 rounded-md text-base font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground hover:bg-secondary"
                activeProps={{ className: "px-3 py-3 rounded-md text-base font-medium tracking-wide uppercase text-primary bg-secondary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 bg-amber-gradient text-primary-foreground font-display font-semibold tracking-wide uppercase text-sm px-4 py-3 rounded-md shadow-glow-amber"
            >
              <MessageSquare className="h-4 w-4" />
              Message Now
            </Link>
            {session ? (
              <>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-3 text-sm font-display uppercase tracking-wider text-primary">
                    Admin Dashboard
                  </Link>
                )}
                <Link to={isAdmin ? "/portal" : isMechanic ? "/mechanic" : "/customer-portal"} onClick={() => setMobileOpen(false)} className="px-3 py-3 text-sm text-muted-foreground hover:text-foreground">
                  {isAdmin ? "My Portal" : isMechanic ? "My Jobs" : "Customer Portal"}
                </Link>
                <button onClick={handleSignOut} className="px-3 py-3 text-left text-sm text-muted-foreground hover:text-foreground">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-3 text-sm text-muted-foreground hover:text-foreground">
                Customer Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
