 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Search, Shield, AlertTriangle, CheckCircle, ExternalLink, Loader2, Building2, Globe, Tag } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 interface ResearchResult {
   supplierName: string;
   report: string;
   citations: string[];
   trustScore: number | null;
   researchedAt: string;
 }
 
 export function SupplierResearch() {
   const [supplierName, setSupplierName] = useState("");
   const [supplierUrl, setSupplierUrl] = useState("");
   const [productCategory, setProductCategory] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [result, setResult] = useState<ResearchResult | null>(null);
 
   const handleResearch = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!supplierName.trim()) {
       toast.error("Please enter a supplier name");
       return;
     }
 
     setIsLoading(true);
     setResult(null);
 
     try {
       const { data, error } = await supabase.functions.invoke("perplexity-supplier-research", {
         body: {
           supplierName: supplierName.trim(),
           supplierUrl: supplierUrl.trim() || undefined,
           productCategory: productCategory.trim() || undefined,
         },
       });
 
       if (error) {
         console.error("Research error:", error);
         toast.error("Failed to research supplier. Please try again.");
         return;
       }
 
       if (data?.success) {
         setResult(data.data);
         toast.success("Supplier research completed!");
       } else {
         toast.error(data?.error || "Research failed");
       }
     } catch (err) {
       console.error("Research error:", err);
       toast.error("Something went wrong. Please try again.");
     } finally {
       setIsLoading(false);
     }
   };
 
   const getTrustBadge = (score: number | null) => {
     if (score === null) return { color: "bg-muted", text: "Unknown", icon: Shield };
     if (score >= 8) return { color: "bg-green-500/20 text-green-400 border-green-500/30", text: "Highly Trusted", icon: CheckCircle };
     if (score >= 6) return { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", text: "Moderate Trust", icon: Shield };
     if (score >= 4) return { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", text: "Use Caution", icon: AlertTriangle };
     return { color: "bg-red-500/20 text-red-400 border-red-500/30", text: "High Risk", icon: AlertTriangle };
   };
 
   return (
     <div className="space-y-6">
       {/* Research Form */}
       <Card className="glass border-white/5">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Search className="h-5 w-5 text-primary" />
             Supplier Research
           </CardTitle>
           <CardDescription>
             Use AI-powered web search to verify supplier legitimacy and reviews before adding products
           </CardDescription>
         </CardHeader>
         <CardContent>
           <form onSubmit={handleResearch} className="space-y-4">
             <div className="grid gap-4 md:grid-cols-3">
               <div className="space-y-2">
                 <Label htmlFor="supplierName" className="flex items-center gap-2">
                   <Building2 className="h-4 w-4" />
                   Supplier Name *
                 </Label>
                 <Input
                   id="supplierName"
                   value={supplierName}
                   onChange={(e) => setSupplierName(e.target.value)}
                   placeholder="e.g., AliExpress, DHgate"
                   className="bg-muted/30 border-0"
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="supplierUrl" className="flex items-center gap-2">
                   <Globe className="h-4 w-4" />
                   Website URL (optional)
                 </Label>
                 <Input
                   id="supplierUrl"
                   value={supplierUrl}
                   onChange={(e) => setSupplierUrl(e.target.value)}
                   placeholder="https://supplier.com"
                   className="bg-muted/30 border-0"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="productCategory" className="flex items-center gap-2">
                   <Tag className="h-4 w-4" />
                   Product Category (optional)
                 </Label>
                 <Input
                   id="productCategory"
                   value={productCategory}
                   onChange={(e) => setProductCategory(e.target.value)}
                   placeholder="e.g., Electronics, Fashion"
                   className="bg-muted/30 border-0"
                 />
               </div>
             </div>
             <Button
               type="submit"
               disabled={isLoading || !supplierName.trim()}
               className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary"
             >
               {isLoading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Researching...
                 </>
               ) : (
                 <>
                   <Search className="mr-2 h-4 w-4" />
                   Research Supplier
                 </>
               )}
             </Button>
           </form>
         </CardContent>
       </Card>
 
       {/* Research Results */}
       <AnimatePresence>
         {result && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
           >
             <Card className="glass border-white/5">
               <CardHeader>
                 <div className="flex items-start justify-between">
                   <div>
                     <CardTitle className="text-xl">{result.supplierName}</CardTitle>
                     <CardDescription>
                       Researched on {new Date(result.researchedAt).toLocaleString()}
                     </CardDescription>
                   </div>
                   {result.trustScore !== null && (
                     <div className="text-right">
                       <div className="text-3xl font-bold text-primary">
                         {result.trustScore}/10
                       </div>
                       <Badge className={getTrustBadge(result.trustScore).color}>
                         {getTrustBadge(result.trustScore).text}
                       </Badge>
                     </div>
                   )}
                 </div>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* Report Content */}
                 <div>
                   <h4 className="font-semibold mb-3 flex items-center gap-2">
                     <Shield className="h-4 w-4 text-primary" />
                     Research Report
                   </h4>
                   <ScrollArea className="h-[400px] rounded-lg bg-muted/20 p-4">
                     <div className="prose prose-sm prose-invert max-w-none">
                       {result.report.split('\n').map((paragraph, idx) => (
                         <p key={idx} className="mb-3 text-muted-foreground leading-relaxed">
                           {paragraph}
                         </p>
                       ))}
                     </div>
                   </ScrollArea>
                 </div>
 
                 {/* Citations */}
                 {result.citations && result.citations.length > 0 && (
                   <div>
                     <h4 className="font-semibold mb-3 flex items-center gap-2">
                       <ExternalLink className="h-4 w-4 text-primary" />
                       Sources ({result.citations.length})
                     </h4>
                     <div className="flex flex-wrap gap-2">
                       {result.citations.map((citation, idx) => (
                         <a
                           key={idx}
                           href={citation}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-xs px-3 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                         >
                           <ExternalLink className="h-3 w-3" />
                           {new URL(citation).hostname.replace('www.', '')}
                         </a>
                       ))}
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Loading State */}
       {isLoading && (
         <Card className="glass border-white/5">
           <CardContent className="py-12">
             <div className="flex flex-col items-center justify-center text-center">
               <div className="relative">
                 <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                   <Loader2 className="h-8 w-8 text-primary animate-spin" />
                 </div>
                 <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
               </div>
               <h3 className="mt-4 font-semibold">Researching Supplier</h3>
               <p className="text-sm text-muted-foreground mt-1">
                 Searching reviews, complaints, and business records...
               </p>
             </div>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }
