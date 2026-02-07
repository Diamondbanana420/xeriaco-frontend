import { motion } from "framer-motion";
import { Flame, Eye, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface UrgencyIndicatorsProps {
  productId: string;
}

export function UrgencyIndicators({ productId }: UrgencyIndicatorsProps) {
  // Generate pseudo-random but consistent values based on productId
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const stockLeft = 3 + (hash % 8); // Between 3-10
  const viewingNow = 5 + (hash % 15); // Between 5-19
  const soldRecently = 10 + (hash % 30); // Between 10-39
  
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      {/* Low Stock Warning */}
      {stockLeft <= 5 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm"
        >
          <Package className="h-4 w-4 text-orange-500" />
          <span className="text-orange-500 font-medium">
            Only {stockLeft} left in stock!
          </span>
        </motion.div>
      )}

      {/* People Viewing */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Eye className="h-4 w-4" />
        <span>{viewingNow} people are viewing this right now</span>
      </motion.div>

      {/* Recently Sold */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Flame className="h-4 w-4 text-red-500" />
        <span>{soldRecently} sold in the last 24 hours</span>
      </motion.div>

      {/* Flash Sale Countdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-primary font-medium">
            ⚡ Flash Sale Ends In
          </span>
        </div>
        <div className="flex gap-3 text-center">
          <div>
            <div className="text-2xl font-light">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-[10px] text-muted-foreground">Hours</div>
          </div>
          <div className="text-2xl font-light">:</div>
          <div>
            <div className="text-2xl font-light">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-[10px] text-muted-foreground">Minutes</div>
          </div>
          <div className="text-2xl font-light">:</div>
          <div>
            <div className="text-2xl font-light">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-[10px] text-muted-foreground">Seconds</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
