import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Star, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "https://xeriaco-backend-production.up.railway.app";

const STEPS = [
  {
        key: "budget",
        label: "Budget",
        question: "What's your budget?",
        options: [
          { label: "Under $50", value: "under50" },
          { label: "$50 – $100", value: "50to100" },
          { label: "$100 – $200", value: "100to200" },
          { label: "$200+", value: "over200" },
              ],
  },
  {
        key: "category",
        label: "Category",
        question: "What are you looking for?",
        options: [
          { label: "Electronics", value: "electronics" },
          { label: "Accessories", value: "accessories" },
          { label: "Lifestyle", value: "lifestyle" },
          { label: "All Categories", value: "all" },
              ],
  },
  {
        key: "priority",
        label: "Priority",
        question: "What matters most?",
        options: [
          { label: "Quality", value: "quality" },
          { label: "Best Value", value: "value" },
          { label: "Trending", value: "trending" },
          { label: "Unique Finds", value: "unique" },
              ],
  },
  ];

interface Recommendation {
    productSlug: string;
    productTitle: string;
    reason: string;
    score: number;
    priceAud: number;
    category: string;
}

export function AIAssistant() {
    const [step, setStep] = useState(-1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [results, setResults] = useState<Recommendation[]>([]);
    const [summary, setSummary] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const handleSelect = async (key: string, value: string) => {
        const updated = { ...answers, [key]: value };
        setAnswers(updated);

        if (step < STEPS.length - 1) {
                setTimeout(() => setStep(step + 1), 250);
        } else {
                setLoading(true);
                try {
                          const res = await fetch(`${API_URL}/api/chat/recommend`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ answers: updated }),
                          });
                          const data = await res.json();
                          setResults(data.recommendations || []);
                          setSummary(data.summary || "");
                          setSessionId(data.sessionId || "");
                          setStep(STEPS.length);
                } catch {
                          toast.error("Couldn't get recommendations. Try again.");
                } finally {
                          setLoading(false);
                }
        }
  };

  const trackClick = async (slug: string) => {
        if (sessionId) {
                fetch(`${API_URL}/api/chat/track`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sessionId, action: "click", productId: slug }),
                }).catch(() => {});
        }
        navigate(`/product/${slug}`);
  };

  const reset = () => {
        setStep(-1);
        setAnswers({});
        setResults([]);
        setSummary("");
        setSessionId("");
  };

  return (
        <section className="py-32 relative">
              <div className="container mx-auto px-4 max-w-3xl">
                {/* Header — always visible */}
                      <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  className="text-center mb-16"
                                >
                                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/50 mb-4">
                                            Personalised
                                </p>p>
                                <h2 className="text-4xl md:text-5xl font-extralight tracking-tight">
                                            Find Your <span className="text-gradient">Perfect Match</span>span>
                                </h2>h2>
                      </motion.div>motion.div>
              
                      <AnimatePresence mode="wait">
                        {/* Idle state */}
                        {step === -1 && (
                      <motion.div
                                      key="idle"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="text-center"
                                    >
                                    <button
                                                      onClick={() => setStep(0)}
                                                      className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-500"
                                                    >
                                                    <Sparkles className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                                                    <span className="text-sm font-light tracking-wide">3 questions. Curated results.</span>span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </button>button>
                      </motion.div>motion.div>
                    )}
                      
                        {/* Quiz steps */}
                        {step >= 0 && step < STEPS.length && !loading && (
                      <motion.div
                                      key={`step-${step}`}
                                      initial={{ opacity: 0, x: 40 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -40 }}
                                      transition={{ duration: 0.3 }}
                                    >
                        {/* Progress dots */}
                                    <div className="flex justify-center gap-2 mb-10">
                                      {STEPS.map((_, i) => (
                                                        <div
                                                                              key={i}
                                                                              className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                                                                                                      i <= step ? "bg-primary" : "bg-white/10"
                                                                              }`}
                                                                            />
                                                      ))}
                                    </div>div>
                      
                                    <h3 className="text-2xl font-extralight text-center mb-8">
                                      {STEPS[step].question}
                                    </h3>h3>
                      
                                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                                      {STEPS[step].options.map((opt) => (
                                                        <button
                                                                              key={opt.value}
                                                                              onClick={() => handleSelect(STEPS[step].key, opt.value)}
                                                                              className={`py-4 px-6 rounded-2xl border text-sm font-light transition-all duration-300 ${
                                                                                                      answers[STEPS[step].key] === opt.value
                                                                                                        ? "border-primary bg-primary/10 text-foreground"
                                                                                                        : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
                                                                              }`}
                                                                            >
                                                          {opt.label}
                                                        </button>button>
                                                      ))}
                                    </div>div>
                      
                                    <div className="text-center mt-6">
                                                    <button
                                                                        onClick={reset}
                                                                        className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                                                      >
                                                                      Cancel
                                                    </button>button>
                                    </div>div>
                      </motion.div>motion.div>
                    )}
                      
                        {/* Loading */}
                        {loading && (
                      <motion.div
                                      key="loading"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="text-center py-12"
                                    >
                                    <div className="w-12 h-12 mx-auto mb-6 rounded-full border border-primary/30 flex items-center justify-center">
                                                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                    </div>div>
                                    <p className="text-sm text-muted-foreground/60 font-light">
                                                    Finding your matches...
                                    </p>p>
                      </motion.div>motion.div>
                    )}
                      
                        {/* Results */}
                        {step === STEPS.length && !loading && (
                      <motion.div
                                      key="results"
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0 }}
                                    >
                        {summary && (
                                                      <p className="text-center text-sm text-muted-foreground/60 font-light mb-10">
                                                        {summary}
                                                      </p>p>
                                    )}
                      
                        {results.length > 0 ? (
                                                      <div className="space-y-4">
                                                        {results.map((rec, i) => (
                                                                            <motion.div
                                                                                                    key={rec.productSlug}
                                                                                                    initial={{ opacity: 0, y: 15 }}
                                                                                                    animate={{ opacity: 1, y: 0 }}
                                                                                                    transition={{ delay: i * 0.1 }}
                                                                                                    onClick={() => trackClick(rec.productSlug)}
                                                                                                    className="group flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer"
                                                                                                  >
                                                                                                  <div className="flex-1 min-w-0">
                                                                                                                          <div className="flex items-center gap-2 mb-1">
                                                                                                                                                    <span className="text-xs text-primary/60 font-light">{rec.score}% match</span>span>
                                                                                                                            </div>div>
                                                                                                                          <h4 className="font-light text-foreground truncate">{rec.productTitle}</h4>h4>
                                                                                                                          <p className="text-xs text-muted-foreground/50 font-light mt-1">{rec.reason}</p>p>
                                                                                                    </div>div>
                                                                                                  <div className="text-right ml-4 shrink-0">
                                                                                                                          <p className="text-lg font-extralight text-foreground">${rec.priceAud?.toFixed(2)}</p>p>
                                                                                                                          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all ml-auto mt-1" />
                                                                                                    </div>div>
                                                                            </motion.div>motion.div>
                                                                          ))}
                                                      </div>div>
                                                    ) : (
                                                      <p className="text-center text-muted-foreground/50 font-light">
                                                                        No matches found in this category yet. Check back soon.
                                                      </p>p>
                                    )}
                      
                                    <div className="flex justify-center gap-4 mt-10">
                                                    <button
                                                                        onClick={reset}
                                                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-xs font-light text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                                                                      >
                                                                      <RotateCcw className="h-3 w-3" />
                                                                      Start over
                                                    </button>button>
                                                    <Button
                                                                        onClick={() => navigate("/shop")}
                                                                        className="rounded-full px-6 text-xs"
                                                                        variant="ghost"
                                                                      >
                                                                      Browse all
                                                                      <ArrowRight className="h-3 w-3 ml-2" />
                                                    </Button>Button>
                                    </div>div>
                      </motion.div>motion.div>
                    )}
                      </AnimatePresence>AnimatePresence>
              </div>div>
        </section>section>
      );
}</section>
