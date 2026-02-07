import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'https://xeriaco-backend-production.up.railway.app';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  categories: { name: string; slug: string } | null;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);

  const addToWishlist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to add to wishlist");

      const response = await fetch(`${API_URL}/api/store/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.error?.includes("already") || response.status === 409) {
          throw new Error("Already in wishlist");
        }
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.base_price,
      image: product.image_url,
      platform: null,
    });
  };

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      navigate(`/products/${product.id}`);
    }, 400);
  };

  const placeholderImage = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop";

  return (
    <>
      {/* Background overlay when clicked */}
      {isClicked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        />
      )}
      
      <motion.div
        className={`group cursor-pointer text-center ${isClicked ? 'relative z-50' : ''}`}
        onClick={handleClick}
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isClicked ? 1.2 : 1,
          zIndex: isClicked ? 50 : 1,
        }}
        transition={{ 
          duration: 0.6, 
          delay: index * 0.1,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ 
          y: -10,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
        }}
        style={{ perspective: 1000 }}
      >
        {/* Floating Product Image */}
        <motion.div 
          className="relative mx-auto mb-8 w-full max-w-[220px]"
          whileHover={{ 
            rotateY: 8,
            rotateX: -5,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Soft shadow for depth */}
          <div className="absolute inset-0 rounded-3xl bg-secondary/20 blur-3xl translate-y-8 scale-90 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
          
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <img
              src={product.image_url || placeholderImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              style={{ 
                filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
              }}
            />
          </div>
          
          {/* Hover Actions - Floating */}
          <motion.div 
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 border border-white/10"
              onClick={(e) => {
                e.stopPropagation();
                addToWishlist.mutate();
              }}
              disabled={addToWishlist.isPending}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              className="h-10 w-10 rounded-full bg-secondary/80 hover:bg-secondary backdrop-blur-md"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Text Content - Floating below */}
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.2 }}
        >
          {product.categories && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
              {product.categories.name}
            </p>
          )}
          <h3 className="text-base font-light tracking-wide text-foreground/90 group-hover:text-foreground transition-colors duration-500">
            {product.name}
          </h3>
          {/* Star Rating */}
          <div className="flex items-center justify-center gap-0.5 my-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-primary text-primary" />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">(4.8)</span>
          </div>
          <p className="text-xl font-light text-secondary/80">
            ${product.base_price.toFixed(2)}
          </p>
        </motion.div>
      </motion.div>
    </>
  );
}
