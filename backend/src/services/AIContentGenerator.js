const Anthropic = require('@anthropic-ai/sdk');
const config = require('../../config');
const logger = require('../utils/logger');

class AIContentGenerator {
  constructor() {
    this.enabled = !!config.anthropic.apiKey;
    this.client = null;
  }

  getClient() {
    if (!this.client && this.enabled) {
      this.client = new Anthropic({ apiKey: config.anthropic.apiKey });
    }
    return this.client;
  }

  async generate(systemPrompt, userPrompt, maxTokens) {
    const client = this.getClient();
    if (!client) {
      logger.warn('AI Content: Anthropic API key not configured — returning placeholder');
      return null;
    }

    try {
      const response = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: maxTokens || config.anthropic.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      return text.trim();
    } catch (err) {
      logger.error('AI Content generation failed', { error: err.message });
      return null;
    }
  }

  // ═══════════════════════════════════════
  // Product description
  // ═══════════════════════════════════════
  async generateProductDescription(product) {
    const system = `You are a premium ecommerce copywriter for XeriaCO, an Australian online store. 
Write compelling product descriptions that:
- Sound premium and confident, never cheap or generic
- Highlight key benefits and use cases
- Include sensory/emotional language
- End with a subtle urgency nudge
- Are 150-250 words
- Never use words like "game-changer", "revolutionary", or "cutting-edge"
Return ONLY the description text, no headings or labels.`;

    const prompt = `Write a product description for:
Title: ${product.title}
Category: ${product.category || 'general'}
Price: $${product.sellingPriceAud?.toFixed(2) || '0'} AUD
Tags: ${(product.tags || []).join(', ')}
Supplier info: ${product.supplier?.platform || 'unknown'} with ${product.supplier?.totalOrders || 0} orders, ${product.supplier?.rating || 0}/5 rating`;

    return this.generate(system, prompt, 400);
  }

  // ═══════════════════════════════════════
  // Product description HTML (for Shopify body_html)
  // ═══════════════════════════════════════
  async generateProductDescriptionHtml(product) {
    const system = `You are a premium ecommerce copywriter for XeriaCO, an Australian online store.
Write a Shopify-ready HTML product description that:
- Uses <h3> for benefit headings (2-3 max)
- Uses <p> for body paragraphs
- Uses <ul><li> for key features (4-6 bullet points)
- Includes one short trust-building line at the end
- Is 200-300 words total
- Sounds premium and confident
- Never uses "game-changer", "revolutionary", "cutting-edge", or "unleash"
Return ONLY raw HTML, no markdown fences or labels.`;

    const prompt = `Write HTML product description for:
Title: ${product.title}
Category: ${product.category || 'general'}
Price: $${product.sellingPriceAud?.toFixed(2) || '0'} AUD
Tags: ${(product.tags || []).join(', ')}`;

    return this.generate(system, prompt, 600);
  }

  // ═══════════════════════════════════════
  // SEO meta title + description
  // ═══════════════════════════════════════
  async generateSEO(product) {
    const system = `You are an SEO expert for an Australian ecommerce store called XeriaCO.
Generate SEO metadata. Return ONLY a JSON object with "title" (max 60 chars) and "description" (max 155 chars).
Focus on Australian buyers. Include the product type and a benefit.
Return raw JSON only, no markdown fences.`;

    const prompt = `Generate SEO for:
Product: ${product.title}
Category: ${product.category || 'general'}
Price: $${product.sellingPriceAud?.toFixed(2) || '0'} AUD`;

    const raw = await this.generate(system, prompt, 200);
    if (!raw) return null;

    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (err) {
      logger.warn('Failed to parse SEO JSON', { raw });
      return null;
    }
  }

  // ═══════════════════════════════════════
  // Tags generator
  // ═══════════════════════════════════════
  async generateTags(product) {
    const system = `You are a product tagging expert for a dropshipping store.
Generate 5-10 relevant Shopify tags for a product. Tags should include: category, use case, material/type, target audience, and season if relevant.
Return ONLY a JSON array of strings, no markdown.`;

    const prompt = `Generate tags for: ${product.title} (category: ${product.category || 'general'})`;

    const raw = await this.generate(system, prompt, 150);
    if (!raw) return null;

    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (err) {
      logger.warn('Failed to parse tags JSON');
      return null;
    }
  }

  // ═══════════════════════════════════════
  // Full product enrichment (all content at once)
  // ═══════════════════════════════════════
  async enrichProduct(product) {
    if (!this.enabled) {
      return { description: null, descriptionHtml: null, seo: null, tags: null };
    }

    logger.info(`AI Content: Enriching "${product.title}"`);

    const [descriptionHtml, seo, tags] = await Promise.allSettled([
      this.generateProductDescriptionHtml(product),
      this.generateSEO(product),
      this.generateTags(product),
    ]);

    const result = {
      descriptionHtml: descriptionHtml.value || null,
      description: descriptionHtml.value ? descriptionHtml.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null,
      seo: seo.value || null,
      tags: tags.value || null,
    };

    logger.info(`AI Content: Enriched "${product.title}" — HTML: ${!!result.descriptionHtml}, SEO: ${!!result.seo}, Tags: ${result.tags?.length || 0}`);
    return result;
  }

  // ═══════════════════════════════════════
  // Bulk enrich unenriched products
  // ═══════════════════════════════════════
  async bulkEnrich(limit = 10) {
    const { Product } = require('../models');
    const products = await Product.find({
      isActive: true,
      $or: [
        { descriptionHtml: { $in: [null, ''] } },
        { 'seo.title': { $in: [null, ''] } },
      ],
    }).limit(limit);

    logger.info(`AI Content: Bulk enriching ${products.length} products`);
    let enriched = 0;

    for (const product of products) {
      try {
        const content = await this.enrichProduct(product);

        if (content.descriptionHtml) product.descriptionHtml = content.descriptionHtml;
        if (content.description) product.description = content.description;
        if (content.seo) product.seo = content.seo;
        if (content.tags && content.tags.length) {
          product.tags = [...new Set([...product.tags, ...content.tags])];
        }

        await product.save();
        enriched++;

        // Small delay to not hammer the API
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        logger.warn(`AI Content: Failed to enrich ${product.title}: ${err.message}`);
      }
    }

    return { total: products.length, enriched };
  }
}

module.exports = new AIContentGenerator();
