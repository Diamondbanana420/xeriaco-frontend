import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ProductBenefitsProps {
  productName: string;
  category?: string;
}

// Generate benefits based on product category
const generateBenefits = (category?: string): string[] => {
  const commonBenefits = [
    "Premium quality materials and construction",
    "Ships within 24 hours of order",
    "30-day money-back guarantee",
  ];

  const categoryBenefits: Record<string, string[]> = {
    tech: [
      "Latest technology and features",
      "Compatible with all major devices",
      "1-year manufacturer warranty included",
    ],
    fashion: [
      "Trending design and style",
      "Available in multiple colors/sizes",
      "Easy returns and exchanges",
    ],
    home: [
      "Enhances your living space instantly",
      "Durable and long-lasting",
      "Easy to clean and maintain",
    ],
    lifestyle: [
      "Improves daily comfort and convenience",
      "Versatile and multi-functional",
      "Eco-friendly materials",
    ],
  };

  const categoryKey = category?.toLowerCase() || 'lifestyle';
  const specificBenefits = categoryBenefits[categoryKey] || categoryBenefits.lifestyle;

  return [...specificBenefits, ...commonBenefits];
};

export function ProductBenefits({ productName, category }: ProductBenefitsProps) {
  const benefits = generateBenefits(category);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Why Choose This Product?</h3>
      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3"
          >
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{benefit}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
