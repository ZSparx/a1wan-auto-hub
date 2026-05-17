import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, Disc, Gauge, CarFront, Cog, Snowflake, Phone, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — A1wan Auto · Grand Prairie, TX" },
      { name: "description", content: "Oil change, brakes, engine diagnostics, suspension, transmission, A/C repair in Grand Prairie. Honest pricing." },
      { property: "og:title", content: "Services — A1wan Auto" },
      { property: "og:description", content: "Full-service auto repair in Grand Prairie, TX." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { icon: Wrench, name: "Oil Change", desc: "Conventional, synthetic blend, or full synthetic. Fresh filter, top-off all fluids, and a 20-point safety inspection at every visit." },
  { icon: Disc, name: "Brake Service", desc: "Pads, rotors, calipers, brake fluid flush, and ABS diagnostics. Stop with total confidence — backed by a workmanship warranty." },
  { icon: Gauge, name: "Engine Diagnostics", desc: "Check Engine light scans, misfire diagnosis, sensor replacement, and tune-ups. We read the codes and explain what they really mean." },
  { icon: CarFront, name: "Suspension & Steering", desc: "Shocks, struts, control arms, tie rods, ball joints, and 4-wheel alignments. Smooth ride, straight steering, even tire wear." },
  { icon: Cog, name: "Transmission Service", desc: "Fluid flushes, leak repair, clutch service, and full transmission rebuild or replacement for both automatic and manual." },
  { icon: Snowflake, name: "Air Conditioning", desc: "A/C recharge, leak detection with dye, compressor replacement, and heater core service. Stay cool through every Texas summer." },
];

function ServicesPage() {
  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <p className="text-primary font-display tracking-widest uppercase text-sm mb-3">What we do</p>
          <h1 className="font-display font-bold uppercase text-5xl sm:text-6xl tracking-tight">Our Services</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            From routine maintenance to major repairs, our team handles every job with honest quotes and quality parts.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s.name} className="group p-7 rounded-lg bg-surface border border-border hover:border-primary/50 hover:bg-surface-elevated transition">
              <div className="h-14 w-14 rounded-md bg-primary/15 text-primary flex items-center justify-center mb-5 group-hover:bg-amber-gradient group-hover:text-primary-foreground transition">
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display uppercase tracking-wide text-2xl mb-3">{s.name}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-xl bg-gradient-to-br from-surface-elevated to-surface border border-primary/30 text-center">
          <h2 className="font-display uppercase text-3xl">Don't see what you need?</h2>
          <p className="mt-3 text-muted-foreground">We handle nearly every service for foreign and domestic vehicles. Just ask.</p>
          <div className="mt-6 flex justify-center flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber">
              Request a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="tel:6827185547" className="inline-flex items-center gap-2 border border-border bg-background text-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md">
              <Phone className="h-4 w-4 text-primary" /> (682) 718-5547
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
