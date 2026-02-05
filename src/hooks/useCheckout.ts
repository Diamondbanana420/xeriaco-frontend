import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, CartItem } from "@/hooks/useCart";
import { toast } from "sonner";

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { items } = useCart();

  const checkout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: items.map((item: CartItem) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
          })),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, isLoading };
}
