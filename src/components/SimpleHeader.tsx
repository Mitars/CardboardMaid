import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SimpleHeader() {
  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="w-full px-4 py-1 md:px-4 md:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 md:gap-2.5">
          <img
            src="/logo-text.png"
            alt="Cardboard Maid"
            className="h-7 md:h-12"
          />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
