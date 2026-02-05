 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface SupplierResearchRequest {
   supplierName: string;
   supplierUrl?: string;
   productCategory?: string;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { supplierName, supplierUrl, productCategory }: SupplierResearchRequest = await req.json();
 
     if (!supplierName) {
       return new Response(
         JSON.stringify({ success: false, error: "Supplier name is required" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
     if (!apiKey) {
       console.error("PERPLEXITY_API_KEY not configured");
       return new Response(
         JSON.stringify({ success: false, error: "Perplexity API not configured" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log("Researching supplier:", supplierName);
 
     // Build research query
     let query = `Research the supplier "${supplierName}"`;
     if (supplierUrl) {
       query += ` (website: ${supplierUrl})`;
     }
     if (productCategory) {
       query += ` in the ${productCategory} industry`;
     }
     query += `. Provide: 1) Company legitimacy and registration status 2) Customer reviews and ratings from multiple sources 3) Any red flags, complaints, or scam reports 4) Years in business and reputation 5) Payment security and refund policies 6) Overall trust score (1-10) with reasoning. Be thorough and cite sources.`;
 
     const response = await fetch("https://api.perplexity.ai/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${apiKey}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "sonar-pro",
         messages: [
           {
             role: "system",
             content: "You are a business intelligence analyst specializing in supplier verification and due diligence. Provide factual, well-researched reports with citations. Be objective and highlight both positives and concerns. Always include a numerical trust score from 1-10."
           },
           { role: "user", content: query }
         ],
         temperature: 0.1,
         max_tokens: 2000,
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("Perplexity API error:", response.status, errorText);
       return new Response(
         JSON.stringify({ success: false, error: `Research failed: ${response.status}` }),
         { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const data = await response.json();
     const report = data.choices?.[0]?.message?.content || "Unable to generate report";
     const citations = data.citations || [];
 
     // Extract trust score from the report using regex
     const trustScoreMatch = report.match(/trust score[:\s]*(\d+(?:\.\d+)?)/i) || 
                            report.match(/(\d+(?:\.\d+)?)\s*(?:out of\s*)?\/?\s*10/i);
     const trustScore = trustScoreMatch ? parseFloat(trustScoreMatch[1]) : null;
 
     console.log("Supplier research completed for:", supplierName);
 
     return new Response(
       JSON.stringify({
         success: true,
         data: {
           supplierName,
           report,
           citations,
           trustScore,
           researchedAt: new Date().toISOString(),
         }
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Supplier research error:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ success: false, error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });