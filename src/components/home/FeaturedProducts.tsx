import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

export function FeaturedProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(name, slug)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-32">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header - Centered, minimal */}
        <div className="mb-24 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Featured
          </p>
          <h2 className="text-4xl font-extralight tracking-tight md:text-5xl">
            New Arrivals
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center gap-16 flex-wrap">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-64 aspect-square rounded-full bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-16 md:gap-20 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <ProductCard product={product} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-muted-foreground/60 font-light">
              No products available yet
            </p>
          </div>
        )}

        {/* View All - Subtle link */}
        <div className="mt-24 text-center">
          <Button 
            variant="ghost" 
            className="text-sm font-light tracking-wide text-muted-foreground hover:text-foreground group" 
            asChild
          >
            <Link to="/products">
              View all products
              <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
