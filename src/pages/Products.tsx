import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { AIRecommendations } from "@/components/products/AIRecommendations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const categoryFilter = searchParams.get("category") || "";
  const sortBy = searchParams.get("sort") || "newest";

  const API_URL = import.meta.env.VITE_API_URL || 'https://xeriaco-backend-production.up.railway.app';

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", categoryFilter, sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (categoryFilter) params.set("category", categoryFilter);
      if (sortBy) params.set("sort", sortBy);

      const response = await fetch(`${API_URL}/api/store/products?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return (data.products || []).map((p: any) => ({
        id: p._id || p.id,
        name: p.title || p.name,
        description: p.description,
        base_price: p.sellingPriceAud || p.base_price || 0,
        image_url: p.featuredImage || p.image_url,
        is_active: true,
        categories: p.category ? { name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') } : null,
      }));
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/api/store/categories`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.categories || []).map((c: any) => ({
          id: c._id || c.id,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
        }));
      } catch {
        return [];
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const hasActiveFilters = categoryFilter || searchQuery;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header - Minimal */}
          <div className="mb-20 text-center">
            <h1 className="text-5xl font-extralight tracking-tight md:text-6xl mb-4">
              Shop
            </h1>
            <p className="text-muted-foreground/60 font-light">
              Discover Trending Products With AI
            </p>
          </div>

          {/* Search & Filters - Floating, minimal */}
          <div className="mb-16 flex flex-col md:flex-row items-center justify-center gap-4">
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-full bg-muted/20 border-0 focus-visible:ring-1 focus-visible:ring-muted/50 text-sm"
              />
            </form>

            <div className="flex items-center gap-3">
              <Select 
                value={categoryFilter || "all"} 
                onValueChange={(v) => updateFilter("category", v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-40 h-12 rounded-full bg-muted/20 border-0 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => updateFilter("sort", v)}>
                <SelectTrigger className="w-40 h-12 rounded-full bg-muted/20 border-0 text-sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low</SelectItem>
                  <SelectItem value="price-high">Price: High</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Recommendations */}
          <AIRecommendations />

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mb-12 flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground rounded-full"
              >
                Clear filters
                <X className="ml-2 h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Product Grid */}
          <div className="pb-24">
            {isLoading ? (
              <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-48 h-48 rounded-full bg-muted/20 animate-pulse mb-8" />
                    <div className="w-24 h-3 bg-muted/20 rounded-full animate-pulse mb-2" />
                    <div className="w-32 h-4 bg-muted/20 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <>
                <p className="mb-12 text-center text-xs text-muted-foreground/50 tracking-wide">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </p>
                <div className="grid gap-16 md:gap-20 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                  {products.map((product, index) => (
                    <div 
                      key={product.id}
                      className="opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ProductCard product={product} index={index} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted-foreground/60 font-light mb-4">
                  No products found
                </p>
                <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  className="text-sm rounded-full"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
