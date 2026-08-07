import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gauge } from "lucide-react";

export const Route = createFileRoute("/cars-for-sale/")({
  head: () => ({
    meta: [
      { title: "Cars for Sale — A1wan Auto · Grand Prairie, TX" },
      { name: "description", content: "Browse quality used cars for sale at A1wan Auto in Grand Prairie. Inspected, serviced, and ready to drive." },
      { property: "og:title", content: "Cars for Sale — A1wan Auto" },
      { property: "og:description", content: "Quality used cars inspected by our master mechanics." },
    ],
  }),
  component: CarsForSale,
});

function CarsForSale() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars_for_sale")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <p className="text-primary font-display tracking-widest uppercase text-sm mb-3">On the lot</p>
          <h1 className="font-display font-bold uppercase text-5xl sm:text-6xl tracking-tight">Cars for Sale</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Every car on our lot is inspected and serviced in our own shop before it gets a price tag. Drive with confidence.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-surface border border-border h-80 animate-pulse" />
            ))}
          </div>
        ) : !data?.length ? (
          <p className="text-center text-muted-foreground py-16">No cars available right now — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((c) => (
              <Link
                key={c.id}
                to="/cars-for-sale/$id"
                params={{ id: c.id }}
                className="group rounded-lg overflow-hidden bg-surface border border-border hover:border-primary/50 transition"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted relative">
                  {c.image_url && (
                    <img src={c.image_url} alt={`${c.year} ${c.make} ${c.model}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  )}
                  {c.featured && (
                    <span className="absolute top-3 left-3 bg-amber-gradient text-primary-foreground text-xs uppercase tracking-wider font-display font-bold px-2.5 py-1 rounded">
                      Featured
                    </span>
                  )}
                  {c.status !== "available" && (
                    <span className="absolute top-3 right-3 bg-background/80 backdrop-blur text-foreground text-xs uppercase tracking-wider font-display font-bold px-2.5 py-1 rounded border border-border">
                      {c.status}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display uppercase text-xl tracking-wide">{c.year} {c.make} {c.model}</h3>
                  {c.trim && <p className="text-sm text-muted-foreground">{c.trim}</p>}
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="h-4 w-4" /> {c.mileage?.toLocaleString()} mi
                  </div>
                  <p className="mt-3 text-2xl font-display text-primary">${(c.price_cents / 100).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
