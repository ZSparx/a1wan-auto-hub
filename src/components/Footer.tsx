import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
            Honest, expert auto repair in Grand Prairie. From oil changes to engine diagnostics,
            we keep your vehicle running like it should — and we sell quality used cars too.
          </p>
        </div>

        <div>
          <h4 className="font-display tracking-wider text-sm uppercase text-foreground mb-4">Visit Us</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /> 2401 Fort Worth St<br />Grand Prairie, TX 75050</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" /> <a href="tel:6827185547" className="hover:text-foreground">(682) 718-5547</a></li>
            <li className="flex gap-2"><Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" /> Mon–Sat: 8am – 7pm<br />Sun: Closed</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display tracking-wider text-sm uppercase text-foreground mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/services" className="text-muted-foreground hover:text-primary">Services</Link></li>
            <li><Link to="/cars-for-sale" className="text-muted-foreground hover:text-primary">Cars for Sale</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
            <li><Link to="/portal" className="text-muted-foreground hover:text-primary">Customer Portal</Link></li>
            
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} A1wan Auto. All rights reserved.</span>
          <span>Grand Prairie · Arlington · Dallas · Fort Worth</span>
        </div>
      </div>
    </footer>
  );
}
