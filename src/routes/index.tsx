import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-garage.jpg";
import {
  Wrench, Disc, Gauge, CarFront, Cog, Snowflake,
  Phone, MapPin, ArrowRight, Sparkles, ShieldCheck, Clock, Smartphone
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A1wan Auto — Auto Repair & Used Cars · Grand Prairie, TX" },
      { name: "description", content: "Honest, expert auto repair in Grand Prairie. Oil changes, brakes, diagnostics, transmission, A/C. Call (682) 718-5547." },
    ],
  }),
  component: Home,
});

const services = [
  { icon: Wrench, name: "Oil Change", desc: "Fast, clean service with quality oil and a fresh filter." },
  { icon: Disc, name: "Brake Service", desc: "Pads, rotors, calipers, fluid — stop with total confidence." },
  { icon: Gauge, name: "Engine Diagnostics", desc: "Check Engine light? We read every code and explain it." },
  { icon: CarFront, name: "Suspension & Steering", desc: "Smooth ride, straight steering, even tire wear." },
  { icon: Cog, name: "Transmission Service", desc: "Fluid flushes, leaks, and full transmission repair." },
  { icon: Snowflake, name: "Air Conditioning", desc: "Recharges, leak detection, compressor repair." },
];

function Home() {
  const { data: cars } = useQuery({
    queryKey: ["featured-cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars_for_sale")
        .select("*")
        .eq("featured", true)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Black sports car inside A1wan Auto garage with welding sparks"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 hero-gradient" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-40 lg:py-52">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-medium tracking-wider uppercase mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Trusted in Grand Prairie since day one
            </div>
            <h1 className="font-display font-bold uppercase text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground">
              Drive in worried.<br />
              <span className="text-primary text-glow-amber">Drive out confident.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Full-service auto repair, honest pricing, and a quality used-car lot — all under one roof at
              2401 Fort Worth St.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/book"
                search={{ service: "" }}
                className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber hover:brightness-110 transition"
              >
                Book Service <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:6827185547"
                className="inline-flex items-center gap-2 border border-border bg-surface/80 backdrop-blur text-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md hover:bg-surface transition"
              >
                <Phone className="h-4 w-4 text-primary" /> (682) 718-5547
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { icon: ShieldCheck, label: "Honest Quotes" },
                { icon: Clock, label: "Same-Day Service" },
                { icon: Wrench, label: "ASE Expertise" },
              ].map((b) => (
                <div key={b.label} className="text-center">
                  <b.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">What we do</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl uppercase">Featured Services</h2>
          </div>
          <Link to="/services" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 group">
            See all services <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <Link
              key={s.name}
              to="/book"
              search={{ service: s.name }}
              className="group p-6 rounded-lg bg-surface border border-border hover:border-primary/50 hover:bg-surface-elevated transition block"
            >
              <div className="h-12 w-12 rounded-md bg-primary/15 text-primary flex items-center justify-center mb-5 group-hover:bg-amber-gradient group-hover:text-primary-foreground transition">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display uppercase tracking-wide text-xl mb-2">{s.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <p className="mt-4 text-xs text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">Book this service <ArrowRight className="h-3 w-3" /></p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-24 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p className="text-primary font-display tracking-widest uppercase text-sm mb-2">On the lot</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl uppercase">Featured Cars for Sale</h2>
            </div>
            <Link to="/cars-for-sale" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 group">
              View inventory <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars?.map((c) => (
              <Link
                key={c.id}
                to="/cars-for-sale/$id"
                params={{ id: c.id }}
                className="group rounded-lg overflow-hidden bg-background border border-border hover:border-primary/50 transition"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {c.image_url && (
                    <img src={c.image_url} alt={`${c.year} ${c.make} ${c.model}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display uppercase text-xl tracking-wide">{c.year} {c.make} {c.model}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{c.mileage?.toLocaleString()} mi</p>
                  <p className="mt-3 text-2xl font-display text-primary">${(c.price_cents / 100).toLocaleString()}</p>
                </div>
              </Link>
            ))}
            {!cars?.length && (
              <p className="col-span-full text-center text-muted-foreground py-12">Fresh inventory coming soon.</p>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-elevated via-surface to-surface border border-primary/30 p-10 sm:p-16">
          <div className="absolute inset-0 bg-amber-gradient opacity-10" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display font-bold uppercase text-4xl sm:text-5xl leading-tight">
                Ready to get your <span className="text-primary">ride right?</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Stop by, call, or message us. Quotes are always free.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber">
                  Message Now <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="tel:6827185547" className="inline-flex items-center gap-2 border border-border bg-background/60 text-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md hover:bg-background transition">
                  <Phone className="h-4 w-4 text-primary" /> Call Now
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-5 rounded-lg bg-background/60 border border-border">
                <MapPin className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="font-display uppercase tracking-wide text-sm text-muted-foreground">Visit the Shop</p>
                  <p className="text-foreground mt-1">2401 Fort Worth St<br />Grand Prairie, TX 75050</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-lg bg-background/60 border border-border">
                <Clock className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="font-display uppercase tracking-wide text-sm text-muted-foreground">Hours</p>
                  <p className="text-foreground mt-1">Mon – Sat: 9am – 6pm<br />Sun: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install app callout */}
      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/install"
          className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 sm:p-8 rounded-2xl bg-surface border border-border hover:border-primary/60 transition"
        >
          <div className="h-14 w-14 rounded-xl bg-amber-gradient flex items-center justify-center shrink-0">
            <Smartphone className="h-7 w-7 text-background" />
          </div>
          <div className="flex-1">
            <p className="text-primary font-display uppercase tracking-widest text-xs mb-1">Get the app</p>
            <h3 className="font-display uppercase tracking-wide text-xl">Add A1wan Auto to your phone's home screen</h3>
            <p className="text-sm text-muted-foreground mt-1">
              One-tap access to bookings, invoices, and messages — works on iPhone and Android, no app store needed.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm text-primary group-hover:translate-x-1 transition">
            Install <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </div>
  );
}
