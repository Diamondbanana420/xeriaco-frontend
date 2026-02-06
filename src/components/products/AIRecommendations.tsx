import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Recommendation {
  productId: string;
  matchScore: number;
  reason: string;
  product: {
    id: string;
    name: string;
    description: string;
    base_price: number;
    image_url: string | null;
    platform: string | null;
  };
}

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'https://xeriaco-backend-production.up.railway.app';

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/store/ai-recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPreferences: null }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          toast.error("Rate limit reached. Please try again in a moment.");
        } else if (status === 402) {
          toast.error("AI credits needed. Please add credits to continue.");
        } else {
          toast.error("Failed to get AI recommendations");
        }
        return;
      }

      const data = await response.json();

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
        setHasLoaded(true);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-light flex items-center gap-2">
              AI Picks For You
              <Sparkles className="h-4 w-4 text-primary" />
            </h3>
            <p className="text-xs text-muted-foreground/60">Powered by XERIACO AI</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="rounded-full text-xs"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : hasLoaded ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get Recommendations
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!hasLoaded && !isLoading ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-8 text-center border border-white/5"
          >
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground/60 font-light mb-4">
              Let our AI analyze products and find the best matches for you
            </p>
            <Button onClick={fetchRecommendations} className="rounded-full btn-luxury">
              <Sparkles className="h-4 w-4 mr-2" />
              Discover AI Picks
            </Button>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-8 text-center border border-white/5"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
              <Bot className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground/60 font-light">
              AI is analyzing products for you...
            </p>
          </motion.div>
        ) : recommendations.length > 0 ? (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-primary/20 transition-all duration-500 cursor-pointer group"
                onClick={() => navigate(`/products/${rec.productId}`)}
              >
                {/* Match Score */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
                    AI Pick #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-extralight text-gradient">{rec.matchScore}%</span>
                    <span className="text-xs text-muted-foreground/60">match</span>
                  </div>
                </div>

                {/* Product Image */}
                <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-muted/20">
                  {rec.product.image_url ? (
                    <img
                      src={rec.product.image_url}
                      alt={rec.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                  {rec.product.name}
                </h4>
                <p className="text-lg font-light text-primary mb-3">
                  ${rec.product.base_price.toFixed(2)}
                </p>

                {/* AI Reason */}
                <div className="p-3 rounded-lg bg-muted/30 mb-4">
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    <span className="text-primary font-medium">AI says: </span>
                    {rec.reason}
                  </p>
                </div>

                {/* CTA */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-full group-hover:bg-primary/10"
                >
                  View Product
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-8 text-center border border-white/5"
          >
            <p className="text-muted-foreground/60 font-light">
              No recommendations available. Try refreshing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
