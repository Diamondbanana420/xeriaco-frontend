import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useShopifyProductByHandle } from "@/hooks/useShopifyProducts";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function ShopifyProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useShopifyProductByHandle(handle || "");
  const addItem = useShopifyCartStore(state => state.addItem);
  const cartLoading = useShopifyCartStore(state => state.isLoading);
  
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-light mb-4">Product not found</h1>
            <Button onClick={() => navigate("/shop")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { node } = product;
  const variants = node.variants.edges;
  const selectedVariant = variants.find(v => v.node.id === selectedVariantId)?.node || variants[0]?.node;
  const images = node.images.edges;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    
    setIsAdding(true);
    try {
      await addItem({
        product,
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        price: selectedVariant.price,
        quantity: 1,
        selectedOptions: selectedVariant.selectedOptions || []
      });
      toast.success("Added to cart!", {
        description: node.title,
        position: "top-center"
      });
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/shop")}
            className="mb-8 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="aspect-square rounded-3xl overflow-hidden bg-muted/20 mb-4">
                {images[0]?.node && (
                  <img
                    src={images[0].node.url}
                    alt={images[0].node.altText || node.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-muted/20">
                      <img
                        src={img.node.url}
                        alt={img.node.altText || `${node.title} ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-3xl md:text-4xl font-light mb-4">{node.title}</h1>
              
              <p className="text-3xl font-light text-gradient mb-6">
                {selectedVariant?.price.currencyCode} {parseFloat(selectedVariant?.price.amount || "0").toFixed(2)}
              </p>

              {node.description && (
                <p className="text-muted-foreground/70 font-light leading-relaxed mb-8">
                  {node.description}
                </p>
              )}

              {/* Variant Selection */}
              {node.options.map((option) => (
                <div key={option.name} className="mb-6">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 block">
                    {option.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const variant = variants.find(v => 
                        v.node.selectedOptions.some(o => o.name === option.name && o.value === value)
                      )?.node;
                      const isSelected = selectedVariant?.selectedOptions.some(
                        o => o.name === option.name && o.value === value
                      );
                      
                      return (
                        <Button
                          key={value}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => variant && setSelectedVariantId(variant.id)}
                          className={`rounded-full ${isSelected ? 'bg-primary' : ''}`}
                          disabled={!variant?.availableForSale}
                        >
                          {value}
                          {isSelected && <Check className="h-3 w-3 ml-2" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Add to Cart */}
              <Button
                onClick={handleAddToCart}
                disabled={cartLoading || isAdding || !selectedVariant?.availableForSale}
                className="w-full h-14 rounded-xl btn-luxury text-lg"
              >
                {isAdding ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : !selectedVariant?.availableForSale ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
