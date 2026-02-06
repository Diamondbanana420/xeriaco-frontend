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
    const hasDiscount = comparePrice != null && Number(comparePrice) > Number(price);

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
                </div>
                <h3 className="font-medium text-lg mb-1 group-hover:text-primary transition-colors">
                    {product.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">${price.toFixed(2)} AUD</span>
                    {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                            ${comparePrice.toFixed(2)}
                        </span>
                    )}
                </div>
                {product.category && (
                    <span className="text-xs text-muted-foreground mt-1 block">{product.category}</span>
                )}
            </Link>
        </motion.div>
    );
}

export default function ShopifyShop() {
    const { data: products, isLoading, error } = useShopifyProducts(20);
    const hasProducts = products != null && products.length > 0;

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
                            <span className="text-xs uppercase tracking-widest text-muted-foreground">XeriaCO Store</span>
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
                                        <div className="h-4 bg-muted/20 rounded w-3/4 mb-2" />
                                        <div className="h-4 bg-muted/20 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-20">
                                <p className="text-muted-foreground">Failed to load products</p>
                            </div>
                        ) : hasProducts ? (
                            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products!.map((product, index) => (
                                    <ProductCard key={product._id} product={product} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                                <p className="text-muted-foreground">No products available yet</p>
                                <p className="text-sm text-muted-foreground/60 mt-2">Check back soon for new arrivals</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
