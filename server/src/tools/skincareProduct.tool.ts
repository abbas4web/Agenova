import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * skincareProductSearch — returns product card data for Derma's recommendations.
 *
 * Returns a ```product-cards [...JSON...]``` fenced block.
 * The frontend parses this block and renders visual product cards with
 * images, price ranges, ingredients, and store buy links.
 */

export interface ProductCard {
  name: string;
  brand: string;
  tagline: string;
  imageUrl: string;
  priceRange: string;
  keyIngredients: string[];
  skinTypes: string[];
  buyLinks: Array<{ store: string; url: string; label: string }>;
}

// ── Curated product database ──────────────────────────────────────────────────
const PRODUCT_DB: Record<string, ProductCard> = {
  'cerave foaming cleanser': {
    name: 'Foaming Facial Cleanser',
    brand: 'CeraVe',
    tagline: 'Gentle daily cleanser for normal to oily skin',
    imageUrl: 'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-us/foaming-facial-cleanser/700x875/cerave_foaming_facial_cleanser_16oz_front-700x875-v2.jpg',
    priceRange: '$12 – $18',
    keyIngredients: ['Ceramides', 'Hyaluronic Acid', 'Niacinamide'],
    skinTypes: ['Normal', 'Oily', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=CeraVe+Foaming+Facial+Cleanser', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/p/foaming-facial-cleanser-xlsImpprod15951144', label: 'Buy on Ulta' },
      { store: 'Official', url: 'https://www.cerave.com/skincare/cleansers/foaming-facial-cleanser', label: 'CeraVe.com' },
    ],
  },
  'cerave hydrating cleanser': {
    name: 'Hydrating Facial Cleanser',
    brand: 'CeraVe',
    tagline: 'Moisturising cleanser for dry and sensitive skin',
    imageUrl: 'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-us/hydrating-facial-cleanser/updated-images/cerave_hydrating_cleanser_12oz_front-700x875.jpg',
    priceRange: '$12 – $18',
    keyIngredients: ['Ceramides', 'Hyaluronic Acid', 'Glycerin'],
    skinTypes: ['Dry', 'Normal', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=CeraVe+Hydrating+Facial+Cleanser', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/p/hydrating-facial-cleanser-xlsImpprod15951145', label: 'Buy on Ulta' },
      { store: 'Official', url: 'https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser', label: 'CeraVe.com' },
    ],
  },
  'la roche-posay toleriane cleanser': {
    name: 'Toleriane Hydrating Gentle Cleanser',
    brand: 'La Roche-Posay',
    tagline: 'Soap-free cleanser for sensitive and dry skin',
    imageUrl: 'https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-lrp-us-Library/default/dw8b1b5b0f/ingredients/toleriane-hydrating-gentle-face-wash.jpg',
    priceRange: '$15 – $22',
    keyIngredients: ['Ceramide-3', 'Niacinamide', 'Glycerin', 'Prebiotic Thermal Water'],
    skinTypes: ['Sensitive', 'Dry', 'Normal'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=La+Roche-Posay+Toleriane+Hydrating+Gentle+Cleanser', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/p/toleriane-hydrating-gentle-facial-cleanser-xlsImpprod12591043', label: 'Buy on Ulta' },
      { store: 'Official', url: 'https://www.laroche-posay.us/our-products/face/face-wash/toleriane-hydrating-gentle-facial-cleanser', label: 'La Roche-Posay' },
    ],
  },
  'neutrogena hydro boost': {
    name: 'Hydro Boost Water Gel',
    brand: 'Neutrogena',
    tagline: 'Lightweight gel moisturiser that hydrates like water',
    imageUrl: 'https://www.neutrogena.com/dw/image/v2/BBXS_PRD/on/demandware.static/-/Sites-neutrogena-us-Library/default/dw9e8a1ba9/2024/Products/Moisturizers/hydro-boost-water-gel/Neutrogena_HydroBoost_WaterGel_50ml_Product.png',
    priceRange: '$20 – $30',
    keyIngredients: ['Hyaluronic Acid', 'Glycerin', 'Dimethicone'],
    skinTypes: ['All', 'Oily', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=Neutrogena+Hydro+Boost+Water+Gel', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/p/hydro-boost-water-gel-xlsImpprod15761172', label: 'Buy on Ulta' },
      { store: 'Walmart', url: 'https://www.walmart.com/search?q=neutrogena+hydro+boost+water+gel', label: 'Buy on Walmart' },
    ],
  },
  'cerave moisturising cream': {
    name: 'Moisturising Cream',
    brand: 'CeraVe',
    tagline: 'Rich 24-hour moisturiser for dry to very dry skin',
    imageUrl: 'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-us/moisturizing-cream/cerave_moisturizing_cream_16oz_front-700x875-v2.jpg',
    priceRange: '$16 – $22',
    keyIngredients: ['Ceramides (1, 3, 6-II)', 'Hyaluronic Acid', 'MVE Technology'],
    skinTypes: ['Dry', 'Very Dry', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=CeraVe+Moisturizing+Cream', label: 'Buy on Amazon' },
      { store: 'Target', url: 'https://www.target.com/s?searchTerm=CeraVe+Moisturizing+Cream', label: 'Buy on Target' },
      { store: 'Official', url: 'https://www.cerave.com/skincare/moisturizers/moisturizing-cream', label: 'CeraVe.com' },
    ],
  },
  'la roche-posay anthelios': {
    name: 'Anthelios Melt-in Milk Sunscreen SPF 100',
    brand: 'La Roche-Posay',
    tagline: 'Lightweight broad-spectrum SPF for daily use',
    imageUrl: 'https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-lrp-us-Library/default/dw4e6c8a26/2024/Products/Sun/Anthelios-Melt-in-Milk-SPF100/LRP_Anthelios_Melt-in-Milk_Lotion_SPF100_5oz.png',
    priceRange: '$22 – $35',
    keyIngredients: ['Cell-Ox Shield Technology', 'Mexoryl SX', 'Mexoryl XL'],
    skinTypes: ['All', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=La+Roche-Posay+Anthelios+sunscreen', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/brand/la-roche-posay?q=anthelios', label: 'Buy on Ulta' },
      { store: 'Official', url: 'https://www.laroche-posay.us/our-products/sun', label: 'La Roche-Posay' },
    ],
  },
  'beauty of joseon relief sun': {
    name: 'Relief Sun: Rice + Probiotics SPF 50+',
    brand: 'Beauty of Joseon',
    tagline: 'K-beauty cult SPF — no white cast, soothing finish',
    imageUrl: 'https://beautyofjoseon.com/cdn/shopify/files/Relief_Sun_Rice_Probiotics_SPF50_PA_1.jpg',
    priceRange: '$16 – $22',
    keyIngredients: ['Rice Extract', 'Probiotics', 'Adenosine', 'Niacinamide'],
    skinTypes: ['All', 'Sensitive', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=Beauty+of+Joseon+Relief+Sun', label: 'Buy on Amazon' },
      { store: 'Sephora', url: 'https://www.sephora.com/search?keyword=beauty+of+joseon+relief+sun', label: 'Buy on Sephora' },
      { store: 'Official', url: 'https://beautyofjoseon.com/products/relief-sun-rice-probiotics', label: 'Official Store' },
    ],
  },
  'elta md uv clear': {
    name: 'UV Clear Broad-Spectrum SPF 46',
    brand: 'EltaMD',
    tagline: 'Dermatologist-favourite SPF for acne-prone skin',
    imageUrl: 'https://www.eltamd.com/cdn/shop/files/UV-Clear-Broad-Spectrum-SPF-46-Tinted-2oz-Front_800x.png',
    priceRange: '$39 – $48',
    keyIngredients: ['Zinc Oxide 9%', 'Niacinamide', 'Hyaluronic Acid', 'Lactic Acid'],
    skinTypes: ['Oily', 'Acne-prone', 'Sensitive'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=EltaMD+UV+Clear+SPF+46', label: 'Buy on Amazon' },
      { store: 'Dermstore', url: 'https://www.dermstore.com/eltamd-uv-clear-broad-spectrum-spf-46/10297696.html', label: 'Dermstore' },
      { store: 'Official', url: 'https://www.eltamd.com/products/uv-clear-broad-spectrum-spf-46', label: 'EltaMD.com' },
    ],
  },
  'the ordinary niacinamide': {
    name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    tagline: 'Pore-minimising serum that controls shine and brightens',
    imageUrl: 'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw23a8a1d7/Images/Products/The-Ordinary/RONI0007/RONI0007_01.jpg',
    priceRange: '$7 – $10',
    keyIngredients: ['Niacinamide 10%', 'Zinc PCA 1%'],
    skinTypes: ['Oily', 'Combination', 'Acne-prone'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/niacinamide-10-zinc-1-P447866', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=The+Ordinary+Niacinamide+10+Zinc', label: 'Buy on Amazon' },
      { store: 'Official', url: 'https://theordinary.com/en-us/niacinamide-10-zinc-1-100436.html', label: 'theordinary.com' },
    ],
  },
  'the ordinary hyaluronic acid': {
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    tagline: 'Multi-depth hydration serum for plump, dewy skin',
    imageUrl: 'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw7c9a7c4a/Images/Products/The-Ordinary/ROHA0001/ROHA0001_01.jpg',
    priceRange: '$7 – $10',
    keyIngredients: ['Hyaluronic Acid 2%', 'Vitamin B5', 'Sodium Hyaluronate Crosspolymer'],
    skinTypes: ['All', 'Dry', 'Dehydrated'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/hyaluronic-acid-2-b5-P447864', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=The+Ordinary+Hyaluronic+Acid+2+B5', label: 'Buy on Amazon' },
      { store: 'Official', url: 'https://theordinary.com/en-us/hyaluronic-acid-2-b5-100821.html', label: 'theordinary.com' },
    ],
  },
  'the ordinary retinol': {
    name: 'Retinol 0.5% in Squalane',
    brand: 'The Ordinary',
    tagline: 'Gentle anti-ageing retinol in a soothing oil base',
    imageUrl: 'https://theordinary.com/dw/image/v2/BFKJ_PRD/on/demandware.static/-/Sites-deciem-master/default/dw1e3f5d9c/Images/Products/The-Ordinary/RORE0001/RORE0001_01.jpg',
    priceRange: '$7 – $10',
    keyIngredients: ['Retinol 0.5%', 'Squalane'],
    skinTypes: ['Normal', 'Dry', 'Combination'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/retinol-0-5-in-squalane-P447868', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=The+Ordinary+Retinol+0.5+Squalane', label: 'Buy on Amazon' },
      { store: 'Official', url: 'https://theordinary.com/en-us/retinol-0-5-in-squalane-100378.html', label: 'theordinary.com' },
    ],
  },
  "paula's choice bha": {
    name: 'Skin Perfecting 2% BHA Liquid Exfoliant',
    brand: "Paula's Choice",
    tagline: 'Cult salicylic acid exfoliant that unclogs pores fast',
    imageUrl: 'https://www.paulaschoice.com/dw/image/v2/BBSH_PRD/on/demandware.static/-/Sites-pc-master/default/dw4e7e1c2b/9040/PC_9040_Skin-Perfecting-2pct-BHA-Liquid_4oz.jpg',
    priceRange: '$35 – $45',
    keyIngredients: ['Salicylic Acid 2%', 'Green Tea Extract', 'Methylpropanediol'],
    skinTypes: ['Oily', 'Combination', 'Acne-prone', 'Enlarged Pores'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/skin-perfecting-2-bha-liquid-exfoliant-P380263', label: 'Buy on Sephora' },
      { store: 'Amazon', url: "https://www.amazon.com/s?k=Paula%27s+Choice+2%25+BHA+Liquid", label: 'Buy on Amazon' },
      { store: 'Official', url: 'https://www.paulaschoice.com/skin-perfecting-2-bha-liquid-exfoliant/201-9040.html', label: "Paula's Choice" },
    ],
  },
  'the inkey list caffeine eye cream': {
    name: 'Caffeine Eye Cream',
    brand: 'The INKEY List',
    tagline: 'Reduces dark circles and puffiness under eyes',
    imageUrl: 'https://www.theinkeylist.com/cdn/shop/files/Caffeine_Eye_Cream_1.jpg',
    priceRange: '$10 – $14',
    keyIngredients: ['Caffeine 2%', 'Peptides', 'Hydrolysed Collagen'],
    skinTypes: ['All'],
    buyLinks: [
      { store: 'Sephora', url: 'https://www.sephora.com/product/the-inkey-list-caffeine-eye-cream-P461706', label: 'Buy on Sephora' },
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=The+INKEY+List+Caffeine+Eye+Cream', label: 'Buy on Amazon' },
      { store: 'Official', url: 'https://www.theinkeylist.com/products/caffeine-eye-cream', label: 'theinkeylist.com' },
    ],
  },
  'cerave vitamin c serum': {
    name: 'Vitamin C Serum with Hyaluronic Acid',
    brand: 'CeraVe',
    tagline: 'Brightening serum that evens skin tone gently',
    imageUrl: 'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-us/vitamin-c-serum/cerave-vitamin-c-serum-1fl-oz-front.jpg',
    priceRange: '$18 – $25',
    keyIngredients: ['10% Pure Vitamin C', 'Ceramides', 'Hyaluronic Acid'],
    skinTypes: ['All', 'Normal', 'Dry'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=CeraVe+Vitamin+C+Serum', label: 'Buy on Amazon' },
      { store: 'Ulta', url: 'https://www.ulta.com/p/vitamin-c-serum-with-hyaluronic-acid-xlsImpprod2340162', label: 'Buy on Ulta' },
      { store: 'Official', url: 'https://www.cerave.com/skincare/serums/vitamin-c-serum', label: 'CeraVe.com' },
    ],
  },
  'differin adapalene gel': {
    name: 'Adapalene Gel 0.1% Acne Treatment',
    brand: 'Differin',
    tagline: 'OTC retinoid — the gold standard for acne prevention',
    imageUrl: 'https://differinbrand.com/wp-content/uploads/2022/08/Differin-45g-Rendering_FrontandBack.png',
    priceRange: '$14 – $20',
    keyIngredients: ['Adapalene 0.1%'],
    skinTypes: ['Oily', 'Acne-prone', 'Combination'],
    buyLinks: [
      { store: 'Amazon', url: 'https://www.amazon.com/s?k=Differin+Adapalene+Gel+0.1', label: 'Buy on Amazon' },
      { store: 'CVS', url: 'https://www.cvs.com/search/?searchTerm=Differin+Adapalene+Gel', label: 'Buy on CVS' },
      { store: 'Walmart', url: 'https://www.walmart.com/search?q=Differin+Adapalene+Gel', label: 'Buy on Walmart' },
    ],
  },
};

function findProduct(query: string): ProductCard | null {
  const q = query.toLowerCase().trim();
  if (PRODUCT_DB[q]) return PRODUCT_DB[q] ?? null;

  let bestKey = '';
  let bestScore = 0;
  for (const key of Object.keys(PRODUCT_DB)) {
    const keyWords = key.split(' ');
    const qWords = q.split(' ');
    const overlap = keyWords.filter((w) => qWords.includes(w)).length;
    const score = overlap / keyWords.length;
    if ((q.includes(key) || key.includes(q)) && key.length > bestScore) {
      bestScore = key.length;
      bestKey = key;
    } else if (score >= 0.6 && score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  return bestKey ? (PRODUCT_DB[bestKey] ?? null) : null;
}

const skincareProductSearchTool: ToolImplementation = {
  definition: {
    name: 'skincareProductSearch',
    description:
      'Look up a specific skincare product to get its image, price, key ingredients, skin types, and buy links. Call this tool once per product you recommend. Returns a visual product card.',
    parameters: {
      type: 'object',
      properties: {
        productName: {
          type: 'string',
          description:
            'The specific product name, e.g. "CeraVe Foaming Cleanser", "The Ordinary Niacinamide 10% + Zinc 1%", "La Roche-Posay Anthelios", "Beauty of Joseon Relief Sun", "Differin Adapalene Gel"',
        },
      },
      required: ['productName'],
    },
  },

  async execute(args) {
    const productName = String(args.productName ?? '').trim();
    if (!productName) return 'Error: productName is required.';

    const product = findProduct(productName);

    if (!product) {
      const generic: ProductCard = {
        name: productName,
        brand: 'Recommended Product',
        tagline: 'Dermatologist-recommended skincare',
        imageUrl: `https://placehold.co/300x300/1e293b/94a3b8?text=${encodeURIComponent(productName.slice(0, 18))}`,
        priceRange: 'Check retailer',
        keyIngredients: [],
        skinTypes: [],
        buyLinks: [
          { store: 'Amazon', url: `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`, label: 'Search on Amazon' },
          { store: 'Sephora', url: `https://www.sephora.com/search?keyword=${encodeURIComponent(productName)}`, label: 'Search on Sephora' },
        ],
      };
      return '```product-cards\n' + JSON.stringify([generic]) + '\n```';
    }

    return '```product-cards\n' + JSON.stringify([product]) + '\n```';
  },
};

ToolRegistry.register(skincareProductSearchTool);
export default skincareProductSearchTool;
