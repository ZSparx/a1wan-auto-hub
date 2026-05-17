import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

export function Logo({ size = "md", showWordmark = true }: LogoProps) {
  const badgeSize =
    size === "sm" ? "h-8 w-8 text-base" : size === "lg" ? "h-14 w-14 text-2xl" : "h-10 w-10 text-lg";
  const wordSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <span
        className={`${badgeSize} bg-amber-gradient rounded-md flex items-center justify-center font-display font-bold text-primary-foreground shadow-glow-amber transition-transform group-hover:scale-105`}
      >
        A1
      </span>
      {showWordmark && (
        <span className={`font-display font-bold tracking-wider ${wordSize} text-foreground`}>
          A1WAN <span className="text-primary">AUTO</span>
        </span>
      )}
    </Link>
  );
}
