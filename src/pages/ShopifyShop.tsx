import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShopifyProductCard } from "@/components/shopify/ShopifyProductCard";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { motion } from "framer-motion";
import { Sparkles, Package } from "lucide-react";

export default function ShopifyShop() {
  const { data: products, isLoading, error } = useShopifyProducts(20);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Shopify Store</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-4">
              Shop
            </h1>
            <p className="text-muted-foreground/60 font-light">
              Discover our curated collection
            </p>
          </motion.div>

          {/* Products Grid */}
          <div className="pb-24">
            {isLoading ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-2xl bg-muted/20 mb-4" />
                    <div className="h-4 bg-muted/20 rounded-full w-3/4 mx-auto mb-2" />
                    <div className="h-5 bg-muted/20 rounded-full w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-24">
                <p className="text-destructive mb-4">Failed to load products</p>
              </div>
            ) : products && products.length > 0 ? (
              <>
                <p className="mb-8 text-center text-xs text-muted-foreground/50 tracking-wide">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </p>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => (
                    <ShopifyProductCard key={product.node.id} product={product} index={index} />
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-light mb-2">No products found</h3>
                <p className="text-muted-foreground/60 font-light max-w-md mx-auto">
                  Your store doesn't have any products yet. Tell me what products you'd like to add and I'll create them for you!
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
