import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Shield, 
  Truck, 
  ArrowLeft,
  Star,
  CheckCircle
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || 'https://xeriaco-backend-production.up.railway.app';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID required");

      const response = await fetch(`${API_URL}/api/store/products/${id}`);
      if (!response.ok) throw new Error("Product not found");
      const data = await response.json();
      const p = data.product;
      if (!p) throw new Error("Product not found");
      return {
        id: p._id || p.id,
        name: p.title || p.name,
        description: p.aiContent?.description || p.description || '',
        base_price: p.sellingPriceAud || p.base_price || 0,
        image_url: p.featuredImage || p.image_url,
        platform: p.platform || null,
        seller_id: p.seller_id || null,
        categories: p.category ? { name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') } : null,
      };
    },
    enabled: !!id,
  });

  const { data: sellerRatings } = useQuery({
    queryKey: ["seller-ratings", product?.seller_id],
    queryFn: async () => {
      // Seller ratings not available via API yet - return empty
      return { average: 0, count: 0 };
    },
    enabled: !!product?.seller_id,
  });

  const addToWishlist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to add to wishlist");
      if (!product) throw new Error("Product not found");

      const response = await fetch(`${API_URL}/api/store/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add to wishlist");
      }
    },
    onSuccess: () => {
      toast.success("Added to wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.base_price,
      image: product.image_url,
      platform: product.platform,
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold">Product not found</h1>
            <p className="mt-2 text-muted-foreground">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const placeholderImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
            {product.categories && (
              <>
                <span>/</span>
                <Link 
                  to={`/products?category=${product.categories.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {product.categories.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-xl glass border border-border/50 premium-border">
                <img
                  src={product.image_url || placeholderImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {product.categories && (
                <Badge variant="secondary" className="absolute top-4 left-4 glass">
                  {product.categories.name}
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold md:text-4xl">{product.name}</h1>
              
              {/* Ratings */}
              {sellerRatings && sellerRatings.count > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(sellerRatings.average)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sellerRatings.average.toFixed(1)} ({sellerRatings.count} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mt-6">
                <span className="text-4xl font-bold text-primary">
                  ${product.base_price.toFixed(2)}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold">Description</h2>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <Separator className="my-6" />

              {/* Features */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg glass p-3 border border-border/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Fast Shipping</p>
                    <p className="text-xs text-muted-foreground">2-5 business days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg glass p-3 border border-border/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                    <Shield className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Purchase</p>
                    <p className="text-xs text-muted-foreground">Protected by Stripe</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Actions */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button 
                  size="lg" 
                  className="flex-1 neon-glow text-lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-border/50"
                  onClick={() => addToWishlist.mutate()}
                  disabled={addToWishlist.isPending}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Wishlist
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-border/50"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Verified Seller
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Secure Payment
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Easy Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
