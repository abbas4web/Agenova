import { tavilyProductService } from './TavilyProductService';
import { logger } from '../config/logger';

/**
 * ProductEnricher — post-processes Derma's AI reply to inject product cards.
 *
 * Strategy (no tool-calling):
 *   1. Scan the reply for product names using a curated keyword list
 *      plus a regex pattern for quoted/bolded product names
 *   2. For each product found, call Tavily to get real image + buy links
 *   3. Inject ```product-cards [...]``` blocks right after each product mention
 *
 * This runs entirely server-side after the AI responds.
 * The frontend's existing MessageBubble parser handles the injected blocks.
 *
 * Falls back to curated data when Tavily is not configured.
 */

// ── Curated fallback data (used when Tavily key is not set) ──────────────────

interface FallbackProduct {
  name: string;
  brand: string;
  tagline: string;
  imageUrl: string;
  priceRange: string;
  keyIngredients: string[];
  skinTypes: string[];
  buyLinks: Array<{ store: string; url: string; label: string }>;
}

const FALLBACK_PRODUCTS: Record<string, FallbackProduct> = {
  'cerave foaming': {
    name: 'Foaming Facial Cleanser', brand: 'CeraVe',
    tagline: 'Gentle daily cleanser for normal to oily skin',
    imageUrl: 'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-us/foaming-facial-cleanser/700x875/cerave_foaming_facial_cleanser_16oz_front-700x875-v2.jpg',
    priceRange: '$12 – $18', keyIngredients: ['Ceramides', 'Hyaluronic Acid', 'Niacinamide'],
    skinTypes: ['Normal', 'Oily', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=CeraVe+Foaming+Facial+Cleanser', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/p/foaming-facial-cleanser-xlsImpprod15951144', label: 'Buy on Ulta' },
    ],
  },
  'cerave hydrating': {
    name: 'Hydrating Facial Cleanser', brand: 'CeraVe',
    tagline: 'Moisturising cleanser for dry and sensitive skin',
    imageUrl: 'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-us/hydrating-facial-cleanser/updated-images/cerave_hydrating_cleanser_12oz_front-700x875.jpg',
    priceRange: '$12 – $18', keyIngredients: ['Ceramides', 'Hyaluronic Acid', 'Glycerin'],
    skinTypes: ['Dry', 'Normal', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=CeraVe+Hydrating+Facial+Cleanser', label: 'Buy on Amazon' },
      { store: 'Target', url: 'https://www.target.com/s?searchTerm=CeraVe+Hydrating+Cleanser', label: 'Buy on Target' },
    ],
  },
  'cerave moisturizing cream': {
    name: 'Moisturizing Cream', brand: 'CeraVe',
    tagline: 'Rich 24-hour moisturiser for dry to very dry skin',
    imageUrl: 'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-us/moisturizing-cream/cerave_moisturizing_cream_16oz_front-700x875-v2.jpg',
    priceRange: '$16 – $22', keyIngredients: ['Ceramides (1, 3, 6-II)', 'Hyaluronic Acid'],
    skinTypes: ['Dry', 'Very Dry', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=CeraVe+Moisturizing+Cream', label: 'Buy on Amazon' },
      { store: 'Target', url: 'https://www.target.com/s?searchTerm=CeraVe+Moisturizing+Cream', label: 'Buy on Target' },
    ],
  },
  'neutrogena hydro boost': {
    name: 'Hydro Boost Water Gel', brand: 'Neutrogena',
    tagline: 'Lightweight gel moisturiser that hydrates like water',
    imageUrl: 'https://www.neutrogena.com/dw/image/v2/BBXS_PRD/on/demandware.static/-/Sites-neutrogena-us-Library/default/dw9e8a1ba9/2024/Products/Moisturizers/hydro-boost-water-gel/Neutrogena_HydroBoost_WaterGel_50ml_Product.png',
    priceRange: '$20 – $30', keyIngredients: ['Hyaluronic Acid', 'Glycerin'],
    skinTypes: ['All', 'Oily', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=Neutrogena+Hydro+Boost+Water+Gel', label: 'Buy on Amazon' },
      { store: 'Walmart', url: 'https://www.walmart.com/search?q=neutrogena+hydro+boost', label: 'Buy on Walmart' },
    ],
  },
  'la roche-posay anthelios': {
    name: 'Anthelios Sunscreen SPF 60', brand: 'La Roche-Posay',
    tagline: 'Lightweight broad-spectrum SPF for daily use',
    imageUrl: 'https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-lrp-us-Library/default/dw4e6c8a26/2024/Products/Sun/Anthelios-Melt-in-Milk-SPF100/LRP_Anthelios_Melt-in-Milk_Lotion_SPF100_5oz.png',
    priceRange: '$22 – $35', keyIngredients: ['Mexoryl SX', 'Mexoryl XL'],
    skinTypes: ['All', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=La+Roche-Posay+Anthelios', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/brand/la-roche-posay?q=anthelios', label: 'Buy on Ulta' },
    ],
  },
  'beauty of joseon': {
    name: 'Relief Sun: Rice + Probiotics SPF 50+', brand: 'Beauty of Joseon',
    tagline: 'K-beauty cult SPF — no white cast',
    imageUrl: 'https://beautyofjoseon.com/cdn/shopify/files/Relief_Sun_Rice_Probiotics_SPF50_PA_1.jpg',
    priceRange: '$16 – $22', keyIngredients: ['Rice Extract', 'Probiotics', 'Niacinamide'],
    skinTypes: ['All', 'Sensitive', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=Beauty+of+Joseon+Relief+Sun', label: 'Buy on Amazon' },
      { store: 'Sephora', url: 'https://www.sephora.com/search?keyword=beauty+of+joseon+relief+sun', label: 'Buy on Sephora' },
    ],
  },
  'the ordinary niacinamide': {
    name: 'Niacinamide 10% + Zinc 1%', brand: 'The Ordinary',
    tagline: 'Pore-minimising serum that controls shine and brightens',
    imageUrl: 'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw23a8a1d7/Images/Products/The-Ordinary/RONI0007/RONI0007_01.jpg',
    priceRange: '$7 – $10', keyIngredients: ['Niacinamide 10%', 'Zinc PCA 1%'],
    skinTypes: ['Oily', 'Combination', 'Acne-prone'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/niacinamide-10-zinc-1-P447866', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=The+Ordinary+Niacinamide+10+Zinc', label: 'Buy on Amazon' },
    ],
  },
  'the ordinary hyaluronic acid': {
    name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary',
    tagline: 'Multi-depth hydration serum',
    imageUrl: 'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw7c9a7c4a/Images/Products/The-Ordinary/ROHA0001/ROHA0001_01.jpg',
    priceRange: '$7 – $10', keyIngredients: ['Hyaluronic Acid 2%', 'Vitamin B5'],
    skinTypes: ['All', 'Dry', 'Dehydrated'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/hyaluronic-acid-2-b5-P447864', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=The+Ordinary+Hyaluronic+Acid+2+B5', label: 'Buy on Amazon' },
    ],
  },
  'the ordinary retinol': {
    name: 'Retinol 0.5% in Squalane', brand: 'The Ordinary',
    tagline: 'Gentle anti-ageing retinol in a soothing base',
    imageUrl: 'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw1e3f5d9c/Images/Products/The-Ordinary/RORE0001/RORE0001_01.jpg',
    priceRange: '$7 – $10', keyIngredients: ['Retinol 0.5%', 'Squalane'],
    skinTypes: ['Normal', 'Dry', 'Combination'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/retinol-0-5-in-squalane-P447868', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=The+Ordinary+Retinol+0.5+Squalane', label: 'Buy on Amazon' },
    ],
  },
  "paula's choice bha": {
    name: 'Skin Perfecting 2% BHA Liquid Exfoliant', brand: "Paula's Choice",
    tagline: 'Cult salicylic acid exfoliant that unclogs pores',
    imageUrl: 'https://www.paulaschoice.com/dw/image/v2/BBSH_PRD/on/demandware.static/-/Sites-pc-master/default/dw4e7e1c2b/9040/PC_9040_Skin-Perfecting-2pct-BHA-Liquid_4oz.jpg',
    priceRange: '$35 – $45', keyIngredients: ['Salicylic Acid 2%', 'Green Tea Extract'],
    skinTypes: ['Oily', 'Combination', 'Acne-prone'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/skin-perfecting-2-bha-liquid-exfoliant-P380263', label: 'Buy on Sephora' },
      { store: 'Amazon', url: "https://www.amazon.com/s?k=Paula%27s+Choice+BHA", label: 'Buy on Amazon' },
    ],
  },
  'differin adapalene': {
    name: 'Adapalene Gel 0.1%', brand: 'Differin',
    tagline: 'OTC retinoid — gold standard for acne prevention',
    imageUrl: 'https://differinbrand.com/wp-content/uploads/2022/08/Differin-45g-Rendering_FrontandBack.png',
    priceRange: '$14 – $20', keyIngredients: ['Adapalene 0.1%'],
    skinTypes: ['Oily', 'Acne-prone', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=Differin+Adapalene+Gel', label: 'Buy on Amazon' },
      { store: 'CVS', url: 'https://www.cvs.com/search/?searchTerm=Differin', label: 'Buy on CVS' },
    ],
  },
  'elta md uv clear': {
    name: 'UV Clear SPF 46', brand: 'EltaMD',
    tagline: 'Dermatologist-favourite SPF for acne-prone skin',
    imageUrl: 'https://www.eltamd.com/cdn/shop/files/UV-Clear-Broad-Spectrum-SPF-46-Tinted-2oz-Front_800x.png',
    priceRange: '$39 – $48', keyIngredients: ['Zinc Oxide 9%', 'Niacinamide', 'Hyaluronic Acid'],
    skinTypes: ['Oily', 'Acne-prone', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=EltaMD+UV+Clear+SPF+46', label: 'Buy on Amazon' },
      { store: 'Dermstore', url: 'https://www.dermstore.com/eltamd-uv-clear-broad-spectrum-spf-46/10297696.html', label: 'Dermstore' },
    ],
  },
  'inkey list caffeine': {
    name: 'Caffeine Eye Cream', brand: 'The INKEY List',
    tagline: 'Reduces dark circles and puffiness',
    imageUrl: 'https://www.theinkeylist.com/cdn/shop/files/Caffeine_Eye_Cream_1.jpg',
    priceRange: '$10 – $14', keyIngredients: ['Caffeine 2%', 'Peptides'],
    skinTypes: ['All'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/the-inkey-list-caffeine-eye-cream-P461706', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=INKEY+List+Caffeine+Eye+Cream', label: 'Buy on Amazon' },
    ],
  },
};

// ── Product name extraction ────────────────────────────────────────────────────

// Patterns Derma uses when naming products in its replies
const PRODUCT_PATTERNS = [
  // Bold markdown: **CeraVe Foaming Facial Cleanser**
  /\*\*([^*]{10,80})\*\*/g,
  // Parenthetical: (CeraVe Foaming Cleanser)
  /\(([A-Z][^)]{8,70})\)/g,
  // After "e.g." or "like" or "try"
  /(?:e\.g\.|such as|try|use|apply|consider)\s+([A-Z][A-Za-z0-9%+\s'.-]{8,60}?)(?:[.,;]|$)/gm,
];

// Known product keywords to scan for directly
const PRODUCT_KEYWORDS: Array<{ keyword: string; name: string }> = [
  { keyword: 'cerave foaming', name: 'CeraVe Foaming Facial Cleanser' },
  { keyword: 'cerave hydrating cleanser', name: 'CeraVe Hydrating Facial Cleanser' },
  { keyword: 'cerave moisturizing cream', name: 'CeraVe Moisturizing Cream' },
  { keyword: 'cerave moisturising cream', name: 'CeraVe Moisturizing Cream' },
  { keyword: 'neutrogena hydro boost', name: 'Neutrogena Hydro Boost Water Gel' },
  { keyword: 'hydro boost', name: 'Neutrogena Hydro Boost Water Gel' },
  { keyword: 'anthelios', name: 'La Roche-Posay Anthelios Sunscreen SPF 60' },
  { keyword: 'beauty of joseon relief sun', name: 'Beauty of Joseon Relief Sun' },
  { keyword: 'beauty of joseon', name: 'Beauty of Joseon Relief Sun' },
  { keyword: 'niacinamide 10%', name: 'The Ordinary Niacinamide 10% + Zinc 1%' },
  { keyword: 'the ordinary niacinamide', name: 'The Ordinary Niacinamide 10% + Zinc 1%' },
  { keyword: 'the ordinary hyaluronic acid', name: 'The Ordinary Hyaluronic Acid 2% + B5' },
  { keyword: 'the ordinary retinol', name: 'The Ordinary Retinol 0.5% in Squalane' },
  { keyword: "paula's choice bha", name: "Paula's Choice 2% BHA Liquid Exfoliant" },
  { keyword: "paula's choice 2% bha", name: "Paula's Choice 2% BHA Liquid Exfoliant" },
  { keyword: 'differin adapalene', name: 'Differin Adapalene Gel 0.1%' },
  { keyword: 'differin gel', name: 'Differin Adapalene Gel 0.1%' },
  { keyword: 'elta md uv clear', name: 'EltaMD UV Clear SPF 46' },
  { keyword: 'eltamd uv clear', name: 'EltaMD UV Clear SPF 46' },
  { keyword: 'inkey list caffeine', name: 'The INKEY List Caffeine Eye Cream' },
  { keyword: 'caffeine eye cream', name: 'The INKEY List Caffeine Eye Cream' },
];

function extractProductNames(reply: string): string[] {
  const found = new Set<string>();
  const lower = reply.toLowerCase();

  // 1. Keyword scan (most reliable)
  for (const { keyword, name } of PRODUCT_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      found.add(name);
    }
  }

  // 2. Regex patterns for bold / parenthetical / explicit mentions
  for (const pattern of PRODUCT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(reply)) !== null) {
      const candidate = match[1]?.trim() ?? '';
      // Must look like a product name (has brand-like capital word, reasonable length)
      if (
        candidate.length >= 8 &&
        candidate.length <= 80 &&
        /[A-Z]/.test(candidate) &&
        !/^(The|This|These|Your|You|Based|Since|Note|Important|Warning|Start|Use|Apply)/.test(candidate)
      ) {
        found.add(candidate);
      }
    }
  }

  return Array.from(found).slice(0, 6); // cap at 6 products per response
}

function lookupFallback(productName: string): FallbackProduct | null {
  const lower = productName.toLowerCase();
  for (const [key, data] of Object.entries(FALLBACK_PRODUCTS)) {
    if (lower.includes(key) || key.includes(lower.split(' ').slice(0, 3).join(' '))) {
      return data;
    }
  }
  return null;
}

function buildProductCard(
  name: string,
  fallback: FallbackProduct | null,
  tavily: import('./TavilyProductService').TavilyProductResult | null
) {
  // Merge Tavily live data over fallback static data
  const base = fallback ?? {
    name,
    brand: name.split(' ')[0] ?? name,
    tagline: 'Dermatologist-recommended skincare',
    imageUrl: null,
    priceRange: 'Check retailer',
    keyIngredients: [] as string[],
    skinTypes: [] as string[],
    buyLinks: [
      { store: 'Amazon', url: `https://www.amazon.com/s?k=${encodeURIComponent(name)}`, label: 'Search on Amazon' },
      { store: 'Sephora', url: `https://www.sephora.com/search?keyword=${encodeURIComponent(name)}`, label: 'Search on Sephora' },
    ],
  };

  return {
    name: base.name,
    brand: base.brand,
    tagline: base.tagline,
    imageUrl: tavily?.imageUrl ?? base.imageUrl ?? `https://placehold.co/300x300/1e293b/94a3b8?text=${encodeURIComponent(name.slice(0, 20))}`,
    priceRange: tavily?.priceRange ?? base.priceRange,
    keyIngredients: base.keyIngredients,
    skinTypes: base.skinTypes,
    buyLinks: (tavily?.buyLinks && tavily.buyLinks.length > 0)
      ? tavily.buyLinks
      : base.buyLinks,
  };
}

// ── Main class ────────────────────────────────────────────────────────────────

export class ProductEnricher {
  /**
   * Scans a Derma reply, fetches product data, and injects product-cards blocks.
   * Returns the enriched reply string ready to send to the client.
   */
  async enrich(reply: string, agentId: string): Promise<string> {
    // Only enrich skincare agent replies
    if (agentId !== 'skincare') return reply;

    const productNames = extractProductNames(reply);
    if (productNames.length === 0) return reply;

    logger.info({ productNames }, 'ProductEnricher: enriching products');

    // Fetch Tavily data for all products in parallel
    const tavilyResults = await tavilyProductService.searchProducts(productNames);

    // Build card blocks
    const cardBlocks = new Map<string, string>();
    for (const name of productNames) {
      const fallback = lookupFallback(name);
      const tavily = tavilyResults.get(name) ?? null;
      const card = buildProductCard(name, fallback, tavily);
      cardBlocks.set(name, '\n```product-cards\n' + JSON.stringify([card]) + '\n```\n');
    }

    // Inject card blocks after product mentions in the reply
    let enriched = reply;
    for (const name of productNames) {
      const block = cardBlocks.get(name);
      if (!block) continue;

      // Try to find the exact name in the text and inject after the line it appears on
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match the product name (possibly bold) followed by optional punctuation to end of line
      const linePattern = new RegExp(`(\\*\\*${escapedName}\\*\\*|${escapedName})[^\\n]*`, 'i');
      const match = linePattern.exec(enriched);
      if (match && match.index !== undefined) {
        const insertAt = match.index + match[0].length;
        // Don't inject if a card block is already right there
        const nearbyText = enriched.slice(insertAt, insertAt + 30);
        if (!nearbyText.includes('```product-cards')) {
          enriched = enriched.slice(0, insertAt) + block + enriched.slice(insertAt);
        }
      }
    }

    return enriched;
  }
}

export const productEnricher = new ProductEnricher();
