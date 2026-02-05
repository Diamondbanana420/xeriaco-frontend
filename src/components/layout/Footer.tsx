import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-24">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        {/* Logo */}
        <Link to="/" className="inline-block text-lg font-extralight tracking-[0.4em] text-foreground/60 hover:text-foreground transition-colors duration-500 mb-12">
          XERIACO
        </Link>

        {/* Minimal Links */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16">
          <Link to="/products" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-500">
            Shop
          </Link>
          <Link to="/about" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-500">
            About
          </Link>
          <Link to="/contact" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-500">
            Contact
          </Link>
          <Link to="/terms" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-500">
            Terms
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground/30 tracking-wide">
          © {new Date().getFullYear()} Xeriaco
        </p>
      </div>
    </footer>
  );
}
