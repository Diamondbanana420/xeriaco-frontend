import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are Xeria, a helpful and friendly customer support assistant for XERIACO, a premium digital marketplace.

About XERIACO:
- We sell curated digital products and goods
- All products are quality-checked for authenticity
- Instant digital delivery for all products
- We support all major payment methods
- 14-day refund policy for eligible products
- Contact email: Xeriaco@outlook.com

Your personality:
- Friendly, helpful, and professional
- Keep responses concise but informative (2-3 sentences max unless more detail is needed)
- Add relevant emojis occasionally to keep it engaging ✨
- If you don't know something specific, be honest and suggest contacting Xeriaco@outlook.com

Common topics you can help with:
- Product information and recommendations
- Order status and delivery questions
- Refund and return policies
- Payment methods and security
- Account issues
- Technical support for digital products`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing support chat with", messages.length, "messages");

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
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Our AI is taking a quick break. Please try again in a moment! 🎮" 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI service temporarily unavailable. Please email Xeriaco@outlook.com for support." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again!";

    console.log("AI response generated successfully");

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ 
      error: "Something went wrong. Please try again or email Xeriaco@outlook.com",
      message: null
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
