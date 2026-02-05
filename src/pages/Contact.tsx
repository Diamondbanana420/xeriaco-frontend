import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AISupportChat } from "@/components/contact/AISupportChat";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-4">
              Get in Touch
            </h1>
            <p className="text-muted-foreground/60 font-light max-w-lg mx-auto">
              Have questions? Our AI assistant is here 24/7, or reach out directly.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 pb-32">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="mb-12">
                <h2 className="text-2xl font-light mb-6">Send us a message</h2>
                
                <div className="space-y-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Email</p>
                      <a href="mailto:Xeriaco@outlook.com" className="text-foreground hover:text-primary transition-colors">
                        Xeriaco@outlook.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Response Time</p>
                      <p className="text-foreground">Within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Location</p>
                      <p className="text-foreground">Worldwide (Remote)</p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                      Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    Subject
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="What's this about?"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    Message
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what you need..."
                    required
                    className="min-h-[150px] rounded-xl resize-none"
                  />
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl btn-luxury">
                  Send Message
                </Button>
              </form>
            </motion.div>

            {/* AI Chat */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-light">AI Support</h2>
                  <p className="text-xs text-muted-foreground/60">Available 24/7</p>
                </div>
              </div>
              
              <AISupportChat />
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
