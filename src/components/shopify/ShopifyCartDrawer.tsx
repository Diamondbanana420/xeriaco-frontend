import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";

export function ShopifyCartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    items, 
    isLoading, 
    isSyncing, 
    updateQuantity, 
    removeItem, 
    getCheckoutUrl, 
    syncCart,
    getTotalItems,
    getTotalPrice 
  } = useShopifyCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 hover:bg-muted/30">
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full glass border-l border-white/10">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-light">Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          <AnimatePresence mode="wait">
            {items.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground/60 font-light">Your cart is empty</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="items"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-1"
              >
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div 
                        key={item.variantId} 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-4 p-3 rounded-xl bg-muted/20"
                      >
                        <div className="w-16 h-16 bg-muted/30 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.node.images?.edges?.[0]?.node && (
                            <img 
                              src={item.product.node.images.edges[0].node.url} 
                              alt={item.product.node.title} 
                              className="w-full h-full object-cover" 
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.product.node.title}</h4>
                          <p className="text-xs text-muted-foreground/60">
                            {item.selectedOptions.map(option => option.value).join(' • ')}
                          </p>
                          <p className="font-semibold text-primary text-sm mt-1">
                            {item.price.currencyCode} {parseFloat(item.price.amount).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                            onClick={() => removeItem(item.variantId)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 rounded-full" 
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              disabled={isLoading}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-6 w-6 rounded-full" 
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={isLoading}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="flex-shrink-0 space-y-4 pt-6 border-t border-white/10 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-light">Total</span>
                    <span className="text-xl font-semibold text-gradient">
                      {items[0]?.price.currencyCode || 'AUD'} {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <Button 
                    onClick={handleCheckout} 
                    className="w-full h-12 rounded-xl btn-luxury" 
                    size="lg" 
                    disabled={items.length === 0 || isLoading || isSyncing}
                  >
                    {isLoading || isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Checkout with Shopify
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
