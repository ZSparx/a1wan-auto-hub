import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Gauge, Calendar, Phone, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/cars-for-sale/$id")({
  component: CarDetail,
});

function CarDetail() {
  const { id } = Route.useParams();
  const { data: car, isLoading, error } = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars_for_sale").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-20 text-muted-foreground">Loading…</div>;
  if (error || !car) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <p className="text-muted-foreground">Car not found.</p>
        <Link to="/cars-for-sale" className="text-primary inline-flex items-center gap-1 mt-4"><ArrowLeft className="h-4 w-4" /> Back to inventory</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <Link to="/cars-for-sale" className="text-muted-foreground hover:text-primary inline-flex items-center gap-2 mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to inventory
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="rounded-xl overflow-hidden bg-surface border border-border aspect-[4/3]">
          {car.image_url && (
            <img src={car.image_url} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover" />
          )}
        </div>

        <div>
          {car.featured && (
            <span className="inline-block bg-amber-gradient text-primary-foreground text-xs uppercase tracking-wider font-display font-bold px-2.5 py-1 rounded mb-4">
              Featured
            </span>
          )}
          <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl tracking-tight">
            {car.year} {car.make} {car.model}
          </h1>
          {car.trim && <p className="text-xl text-muted-foreground mt-1">{car.trim}</p>}

          <p className="mt-6 text-5xl font-display text-primary text-glow-amber">
            ${(car.price_cents / 100).toLocaleString()}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Gauge className="h-4 w-4 text-primary" /> Mileage</div>
              <p className="mt-1 font-display text-2xl">{car.mileage?.toLocaleString()} mi</p>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Calendar className="h-4 w-4 text-primary" /> Year</div>
              <p className="mt-1 font-display text-2xl">{car.year}</p>
            </div>
          </div>

          {car.description && (
            <div className="mt-8">
              <h2 className="font-display uppercase tracking-wide text-xl mb-2">About this car</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{car.description}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-amber-gradient text-primary-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md shadow-glow-amber">
              <MessageSquare className="h-4 w-4" /> Ask About This Car
            </Link>
            <a href="tel:6827185547" className="inline-flex items-center gap-2 border border-border bg-surface text-foreground font-display uppercase tracking-wider font-semibold px-6 py-3.5 rounded-md">
              <Phone className="h-4 w-4 text-primary" /> Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
