import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Brain, Sparkles, Target, Zap, Shield, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Neural Product Matching",
    description: "Our AI analyzes millions of data points to understand your preferences, shopping style, and needs to find products that truly fit you."
  },
  {
    icon: Target,
    title: "Precision Recommendations",
    description: "Using advanced machine learning algorithms, we predict what you'll love before you even know you want it."
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    description: "We track global shopping trends in real-time, ensuring you always have access to the hottest and most relevant products."
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Our AI processes your preferences in milliseconds, delivering personalized results faster than any traditional search."
  },
  {
    icon: Shield,
    title: "Quality Assurance",
    description: "Every product is vetted by our AI for authenticity, quality, and value—so you only see the best."
  },
  {
    icon: Sparkles,
    title: "Continuous Learning",
    description: "The more you interact with XERIACO, the smarter our recommendations become. Your perfect product is always one click away."
  }
];

const stats = [
  { value: "50M+", label: "Products Analyzed" },
  { value: "99.2%", label: "Match Accuracy" },
  { value: "0.3s", label: "Average Response" },
  { value: "24/7", label: "AI Availability" }
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-4 max-w-5xl mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Powered by AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
              Finding Your Perfect
              <span className="text-gradient block mt-2">Products With AI</span>
            </h1>
            
            <p className="text-lg text-muted-foreground/70 font-light max-w-2xl mx-auto leading-relaxed">
              XERIACO uses cutting-edge artificial intelligence to curate the perfect shopping products 
              tailored specifically to your style, preferences, and needs.
            </p>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 max-w-4xl mb-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-extralight text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground/60">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 max-w-5xl mb-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extralight tracking-tight mb-4">
              How Our AI Works
            </h2>
            <p className="text-muted-foreground/60 font-light max-w-xl mx-auto">
              A seamless blend of advanced technology and intuitive design
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: "01", title: "Learn", desc: "Our AI asks smart questions to understand your shopping preferences and style" },
              { step: "02", title: "Analyze", desc: "Neural networks process millions of products to find your perfect matches" },
              { step: "03", title: "Deliver", desc: "Receive personalized recommendations tailored exactly to your needs" }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.15 }}
                className="text-center"
              >
                <div className="text-6xl font-extralight text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-light mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground/60 font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 max-w-6xl pb-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extralight tracking-tight mb-4">
              AI-Powered Features
            </h2>
            <p className="text-muted-foreground/60 font-light">
              Technology that understands you
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="group p-8 rounded-2xl glass border border-white/5 hover:border-primary/20 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:neon-glow transition-all duration-500">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-light mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground/60 font-light leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
