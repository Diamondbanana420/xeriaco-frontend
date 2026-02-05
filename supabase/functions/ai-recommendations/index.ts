import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPreferences, currentProducts } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`*, categories(name, slug)`)
      .eq("is_active", true)
      .limit(20);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw productsError;
    }

    const productList = products?.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.base_price,
      category: p.categories?.name || "Uncategorized",
      platform: p.platform
    })) || [];

    console.log("Fetched products for AI analysis:", productList.length);

    const systemPrompt = `You are a gaming product recommendation AI for XERIACO store. Analyze the available products and user preferences to recommend the best matches.

Available products:
${JSON.stringify(productList, null, 2)}

Based on the user's preferences (or if none provided, recommend trending/popular items), return exactly 3 product recommendations with match scores and reasons.`;

    const userMessage = userPreferences 
      ? `User preferences: ${JSON.stringify(userPreferences)}. Recommend the best matching products.`
      : "Recommend 3 trending products that would appeal to most gamers.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_products",
              description: "Return product recommendations with match scores",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        productId: { type: "string", description: "The product ID" },
                        matchScore: { type: "number", description: "Match percentage 0-100" },
                        reason: { type: "string", description: "Brief reason for recommendation" }
                      },
                      required: ["productId", "matchScore", "reason"]
                    }
                  }
                },
                required: ["recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_products" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log("AI response:", JSON.stringify(aiData, null, 2));

    let recommendations = [];
    
    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      recommendations = parsed.recommendations || [];
    }

    // Enrich recommendations with full product data
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const product = products?.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product || null
      };
    }).filter((rec: any) => rec.product !== null);

    console.log("Enriched recommendations:", enrichedRecommendations.length);

    return new Response(JSON.stringify({ recommendations: enrichedRecommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI recommendations error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      recommendations: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
