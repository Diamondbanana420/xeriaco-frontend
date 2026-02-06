import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useProducts, Product } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Loader2 } from "lucide-react";

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: products, isLoading, error } = useProducts(100);

  const categories = products
    ? ["all", ...new Set(products.map((p: Product) => p.category).filter(Boolean))]
    : ["all"];

  const filtered = selectedCategory === "all"
    ? products
    : products?.filter((p: Product) => p.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extralight tracking-tight mb-4">
              Shop
            </h1>
            <p className="text-muted-foreground/60 font-light max-w-lg mx-auto">
              Discover premium products curated by AI, delivered to your door.
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="rounded-full capitalize"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-muted-foreground">
              Failed to load products. Please try again later.
            </div>
          )}

          {!isLoading && filtered && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No products found.
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered?.map((product: Product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group block"
              >
                <div className="rounded-xl overflow-hidden border border-border/30 bg-card/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300">
                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-slate-900/50">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 md:p-4">
                    {product.category && (
                      <Badge variant="secondary" className="mb-2 text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                        {product.category}
                      </Badge>
                    )}
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {product.title}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-cyan-400">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.comparePrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">AUD</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
