import { Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description: "100% Protected",
  },
  {
    icon: RotateCcw,
    title: "30-Day Returns",
    description: "Money-back guarantee",
  },
  {
    icon: Star,
    title: "10,000+ Reviews",
    description: "4.8 Average Rating",
  },
];

export function TrustBadges() {
  return (
    <section className="py-16 border-y border-white/5 bg-white/[0.01]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-primary/10">
                <badge.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-light mb-1">{badge.title}</h3>
              <p className="text-xs text-muted-foreground/60">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
