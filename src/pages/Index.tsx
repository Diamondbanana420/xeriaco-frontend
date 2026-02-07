import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { AIAssistant } from "@/components/home/AIAssistant";
import { TrustBadges } from "@/components/home/TrustBadges";
import ChatBot from "@/components/home/ChatBot";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <AIAssistant />
        <CategorySection />
        <FeaturedProducts />
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
