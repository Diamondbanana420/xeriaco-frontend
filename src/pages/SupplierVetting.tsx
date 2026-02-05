 import { GalaxyBackground } from "@/components/effects/GalaxyBackground";
 import { PageTransition } from "@/components/effects/PageTransition";
 import { Navbar } from "@/components/layout/Navbar";
 import { Footer } from "@/components/layout/Footer";
 import { SupplierResearch } from "@/components/admin/SupplierResearch";
 
 export default function SupplierVetting() {
   return (
     <PageTransition>
       <div className="min-h-screen bg-background text-foreground overflow-hidden">
         <GalaxyBackground />
         <Navbar />
         
         <main className="relative z-10 pt-24 pb-16">
           <div className="container mx-auto px-4 max-w-5xl">
             <div className="mb-8">
               <h1 className="text-3xl font-bold mb-2">Supplier Vetting</h1>
               <p className="text-muted-foreground">
                 AI-powered supplier verification to ensure you work with legitimate partners
               </p>
             </div>
             
             <SupplierResearch />
           </div>
         </main>
         
         <Footer />
       </div>
     </PageTransition>
   );
 }