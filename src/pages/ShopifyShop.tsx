import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useShopifyProducts, StoreProduct } from "@/hooks/useShopifyProducts";
import { motion } from "framer-motion";
import { Sparkles, Package } from "lucide-react";
import { Link } from "react-router-dom";

function ProductCard({ product, index }: { product: StoreProduct; index: number }) {
    const imageUrl = product.images?.[0]?.url || '/placeholder.svg';
    const price = product.sellingPriceAud || 0;
    const comparePrice = product.comparePriceAud;

  return (
        <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
              <Link to={`/product/${product.slug}`} className="group block">
                      <div className="aspect-square rounded-2xl bg-muted/20 mb-4 overflow-hidden">
                                <img
                                              src={imageUrl}
                                              alt={product.title}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                      </div>div>
                      <h3 className="font-medium text-lg mb-1 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>h3>
                      <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">${price.toFixed(2)} AUD</span>span>
                        {comparePrice && comparePrice > price && (
                            <span className="text-sm text-muted-foreground line-through">
                                          ${comparePrice.toFixed(2)}
                            </span>span>
                                )}
                      </div>div>
                {product.category && (
                          <span className="text-xs text-muted-foreground mt-1 block">{product.category}</span>span>
                      )}
              </Link>Link>
        </motion.div>motion.div>
      );
}

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
                                                            <span className="text-xs uppercase tracking-widest text-muted-foreground">XeriaCO Store</span>span>
                                              </div>div>
                                              <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-4">
                                                            Shop
                                              </h1>h1>
                                              <p className="text-muted-foreground/60 font-light">
                                                            Discover our curated collection
                                              </p>p>
                                  </motion.div>motion.div>
                        
                          {/* Products Grid */}
                                  <div className="pb-24">
                                    {isLoading ? (
                          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(8)].map((_, i) => (
                                              <div key={i} className="animate-pulse">
                                                                  <div className="aspect-square rounded-2xl bg-muted/20 mb-4" />
                                                                  <div className="h-4 bg-muted/20 rounded-full w-3/4 mx-auto mb-2" />
                                                                  <div className="h-5 bg-muted/20 rounded-full w-1/2 mx-auto" />
                                              </div>div>
                                            ))}
                          </div>div>
                        ) : error ? (
                          <div className="text-center py-24">
                                          <p className="text-destructive mb-4">Failed to load products</p>p>
                          </div>div>
                        ) : products && products.length > 0 ? (
                          <>
                                          <p className="mb-8 text-center text-xs text-muted-foreground/50 tracking-wide">
                                            {products.length} product{products.length !== 1 ? "s" : ""}
                                          </p>p>
                                          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {products.map((product, index) => (
                                                <ProductCard key={product._id} product={product} index={index} />
                                              ))}
                                          </div>div>
                          </>>
                        ) : (
                          <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-24"
                                          >
                                          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
                                                            <Package className="h-10 w-10 text-muted-foreground/40" />
                                          </div>div>
                                          <h3 className="text-xl font-light mb-2">No products found</h3>h3>
                                          <p className="text-muted-foreground/60 font-light max-w-md mx-auto">
                                                            Products are being sourced automatically. Check back soon!
                                          </p>p>
                          </motion.div>motion.div>
                        )}
                                  </div>div>
                        </div>div>
                </main>main>
                <Footer />
          </div>div>
        );
}</></motion.div>
