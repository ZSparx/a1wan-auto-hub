import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Share, Plus, MoreVertical, Download, Check, Apple, Chrome } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Install App — A1wan Auto" },
      { name: "description", content: "Add A1wan Auto to your phone's home screen for one-tap access to bookings, invoices, and messages." },
    ],
  }),
  component: InstallPage,
});

type Platform = "ios" | "android" | "desktop";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [tab, setTab] = useState<Platform>("android");
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    setTab(p === "desktop" ? "android" : p);
    setInstalled(isStandalone());

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("App installed");
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) {
      toast.info("Follow the steps below to add the app to your home screen.");
      return;
    }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") toast.success("Installing…");
    setDeferred(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <header className="mb-10 text-center">
        <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">Get the app</p>
        <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl tracking-tight">
          Install A1wan Auto
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Add A1wan Auto to your phone's home screen for one-tap access to bookings, invoices, and messages. No app store needed.
        </p>
      </header>

      {installed ? (
        <div className="mb-10 p-6 rounded-lg bg-primary/10 border border-primary/40 text-center">
          <Check className="h-8 w-8 mx-auto text-primary mb-2" />
          <p className="font-display uppercase tracking-wide">You're all set — the app is installed.</p>
          <p className="text-sm text-muted-foreground mt-1">Open A1wan Auto from your home screen anytime.</p>
        </div>
      ) : (
        deferred && (
          <div className="mb-10 flex justify-center">
            <button
              onClick={install}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-amber-gradient text-background font-display uppercase tracking-wider text-sm shadow-glow-amber"
            >
              <Download className="h-4 w-4" /> Install the app
            </button>
          </div>
        )
      )}

      {/* Platform tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <TabBtn active={tab === "android"} onClick={() => setTab("android")} icon={Chrome} label="Android" />
        <TabBtn active={tab === "ios"} onClick={() => setTab("ios")} icon={Apple} label="iPhone / iPad" />
      </div>

      {tab === "android" && <AndroidSteps hasPrompt={!!deferred} onInstall={install} />}
      {tab === "ios" && <IosSteps />}

      {platform === "desktop" && (
        <p className="text-center text-xs text-muted-foreground mt-10">
          You're on a desktop browser. Open <span className="text-foreground">a1wanauto.com/install</span> on your phone to add the app.
        </p>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Chrome;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md border font-display uppercase tracking-wider text-sm transition ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-surface text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Step({ n, title, children, visual }: { n: number; title: string; children?: React.ReactNode; visual: React.ReactNode }) {
  return (
    <div className="flex gap-5 p-5 rounded-lg bg-surface border border-border">
      <div className="shrink-0">{visual}</div>
      <div>
        <p className="text-xs font-display uppercase tracking-widest text-primary">Step {n}</p>
        <p className="font-display uppercase tracking-wide mt-1">{title}</p>
        {children && <p className="text-sm text-muted-foreground mt-2">{children}</p>}
      </div>
    </div>
  );
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-16 w-16 rounded-md bg-surface-elevated border border-border flex items-center justify-center text-primary">
      {children}
    </div>
  );
}

function AndroidSteps({ hasPrompt, onInstall }: { hasPrompt: boolean; onInstall: () => void }) {
  return (
    <div className="space-y-3">
      {hasPrompt && (
        <div className="p-5 rounded-lg bg-primary/10 border border-primary/40">
          <p className="font-display uppercase tracking-wide mb-2">One-tap install available</p>
          <p className="text-sm text-muted-foreground mb-3">
            Your browser supports one-tap install. Tap the button below and confirm.
          </p>
          <button
            onClick={onInstall}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-amber-gradient text-background font-display uppercase tracking-wider text-sm"
          >
            <Download className="h-4 w-4" /> Install now
          </button>
        </div>
      )}

      <Step
        n={1}
        title="Open in Chrome"
        visual={<IconTile><Chrome className="h-8 w-8" /></IconTile>}
      >
        Make sure this page is open in Google Chrome (or another Chromium browser). Some browsers don't support install.
      </Step>
      <Step
        n={2}
        title="Tap the menu"
        visual={<IconTile><MoreVertical className="h-8 w-8" /></IconTile>}
      >
        Tap the three-dot menu in the top-right corner of your browser.
      </Step>
      <Step
        n={3}
        title='Choose "Install app" or "Add to Home screen"'
        visual={<IconTile><Download className="h-8 w-8" /></IconTile>}
      >
        Then confirm. The A1wan Auto icon will appear on your home screen.
      </Step>
      <Step
        n={4}
        title="Open the app"
        visual={<IconTile><Smartphone className="h-8 w-8" /></IconTile>}
      >
        Tap the new icon anytime to launch A1wan Auto full-screen.
      </Step>
    </div>
  );
}

function IosSteps() {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-lg bg-surface-elevated border border-border text-sm text-muted-foreground">
        On iPhone and iPad you'll need to use <span className="text-foreground">Safari</span> — Chrome on iOS can't add apps to the home screen.
      </div>
      <Step
        n={1}
        title="Open this page in Safari"
        visual={<IconTile><Apple className="h-8 w-8" /></IconTile>}
      >
        If you're reading this in another app, tap the address, copy the link, and paste it into Safari.
      </Step>
      <Step
        n={2}
        title="Tap the Share button"
        visual={<IconTile><Share className="h-8 w-8" /></IconTile>}
      >
        The square-with-an-arrow icon at the bottom of Safari (or top on iPad).
      </Step>
      <Step
        n={3}
        title='Choose "Add to Home Screen"'
        visual={<IconTile><Plus className="h-8 w-8" /></IconTile>}
      >
        Scroll down in the Share sheet if you don't see it. Tap "Add" in the top-right to confirm.
      </Step>
      <Step
        n={4}
        title="Open the app"
        visual={<IconTile><Smartphone className="h-8 w-8" /></IconTile>}
      >
        The A1wan Auto icon appears on your home screen. Tap it to launch full-screen.
      </Step>
    </div>
  );
}
