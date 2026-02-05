import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ChevronRight, Sparkles, Gamepad2, Monitor, Headphones, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Question {
  id: number;
  question: string;
  options: { label: string; value: string; icon?: React.ElementType }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "What type of gamer are you?",
    options: [
      { label: "Casual Player", value: "casual", icon: Gamepad2 },
      { label: "Competitive", value: "competitive", icon: Monitor },
      { label: "Content Creator", value: "creator", icon: Headphones },
      { label: "Collector", value: "collector", icon: Keyboard }
    ]
  },
  {
    id: 2,
    question: "What platforms do you play on?",
    options: [
      { label: "PC Master Race", value: "pc" },
      { label: "PlayStation", value: "playstation" },
      { label: "Xbox", value: "xbox" },
      { label: "Nintendo Switch", value: "switch" }
    ]
  },
  {
    id: 3,
    question: "What's your budget range?",
    options: [
      { label: "Under $20", value: "budget" },
      { label: "$20 - $50", value: "mid" },
      { label: "$50 - $100", value: "premium" },
      { label: "No limit", value: "unlimited" }
    ]
  },
  {
    id: 4,
    question: "Which genre excites you most?",
    options: [
      { label: "Action & Adventure", value: "action" },
      { label: "RPG & Strategy", value: "rpg" },
      { label: "FPS & Shooters", value: "fps" },
      { label: "Sports & Racing", value: "sports" }
    ]
  }
];

// Mock recommended products based on answers
const mockProducts = [
  {
    id: "1",
    name: "Cyber Hunter Pro",
    price: "$49.99",
    image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=200&h=200&fit=crop",
    match: 98
  },
  {
    id: "2",
    name: "Galaxy Quest Ultimate",
    price: "$39.99",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop",
    match: 94
  },
  {
    id: "3",
    name: "Neon Racer X",
    price: "$29.99",
    image: "https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=200&h=200&fit=crop",
    match: 91
  }
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 2000);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setIsOpen(false);
  };

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">AI-Powered</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extralight tracking-tight mb-4">
            Let AI Find Your
            <span className="text-gradient block">Perfect Products</span>
          </h2>
          <p className="text-muted-foreground/60 font-light max-w-lg mx-auto">
            Answer a few quick questions and our AI will recommend products tailored just for you.
          </p>
        </motion.div>

        {/* AI Bot Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div
                key="closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-8 border border-white/5 text-center cursor-pointer hover:border-primary/30 transition-all duration-500"
                onClick={() => setIsOpen(true)}
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center neon-glow animate-pulse">
                  <Bot className="h-12 w-12 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-light mb-3">Meet XERI</h3>
                <p className="text-muted-foreground/60 font-light mb-6">
                  Your personal AI shopping assistant
                </p>
                <Button className="rounded-full px-8 btn-luxury">
                  Start Chat
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            ) : showResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-8 border border-white/5"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Perfect Matches Found!</h3>
                    <p className="text-sm text-muted-foreground/60">Based on your preferences</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {mockProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/products")}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.price}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-light text-gradient">{product.match}%</div>
                        <p className="text-xs text-muted-foreground/60">match</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={resetQuiz} className="flex-1 rounded-xl h-12">
                    Start Over
                  </Button>
                  <Button onClick={() => navigate("/products")} className="flex-1 rounded-xl h-12 btn-luxury">
                    View All Products
                  </Button>
                </div>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-12 border border-white/5 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-spin">
                  <Sparkles className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-light mb-2">Analyzing Your Preferences...</h3>
                <p className="text-muted-foreground/60 text-sm">
                  Our AI is finding your perfect matches
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-8 border border-white/5"
              >
                {/* Progress */}
                <div className="flex gap-2 mb-8">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        index <= currentQuestion ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Bot Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">XERI</h3>
                    <p className="text-sm text-muted-foreground/60">Question {currentQuestion + 1} of {questions.length}</p>
                  </div>
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-2xl font-light mb-6">{questions[currentQuestion].question}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {questions[currentQuestion].options.map((option) => (
                        <Button
                          key={option.value}
                          variant="outline"
                          onClick={() => handleAnswer(questions[currentQuestion].id, option.value)}
                          className={`h-auto py-4 px-6 rounded-xl justify-start gap-3 hover:bg-primary/10 hover:border-primary/50 transition-all ${
                            answers[questions[currentQuestion].id] === option.value
                              ? "bg-primary/10 border-primary"
                              : ""
                          }`}
                        >
                          {option.icon && <option.icon className="h-5 w-5" />}
                          <span>{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={resetQuiz}
                  className="mt-6 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
