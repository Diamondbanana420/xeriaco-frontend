import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const scrollToContent = () => {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center">
      <div className="container relative z-10 mx-auto px-4 text-center max-w-3xl">
        {/* Minimal Badge */}
        <p className="mb-12 text-xs uppercase tracking-[0.4em] text-muted-foreground opacity-0 animate-fade-in">
          Premium Collection
        </p>

        {/* Main Headline - Ultra Light */}
        <h1 className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="block text-7xl font-extralight tracking-tight text-foreground md:text-8xl lg:text-9xl">
            Discover
          </span>
          <span className="block text-7xl font-extralight tracking-tight text-secondary/80 md:text-8xl lg:text-9xl">
            Luxury
          </span>
        </h1>
        
        {/* Subtitle - Whisper soft */}
        <p className="mx-auto mb-16 max-w-md text-base font-light text-muted-foreground/70 leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Curated collection of premium products for those who appreciate the finer things.
        </p>
        
        {/* Single CTA - Soft pill */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button 
            size="lg" 
            className="rounded-full px-10 py-6 text-sm font-light tracking-wide bg-secondary/90 hover:bg-secondary text-secondary-foreground" 
            asChild
          >
            <Link to="/products">
              Explore
              <ArrowRight className="ml-3 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator - Minimal */}
      <button 
        onClick={scrollToContent}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in cursor-pointer"
        style={{ animationDelay: '0.6s' }}
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-muted-foreground/30 to-transparent" />
      </button>
    </section>
  );
}
