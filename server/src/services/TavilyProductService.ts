import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * TavilyProductService — fetches real product images and buy links
 * using the Tavily Search API.
 *
 * Called server-side after Derma generates a reply, to enrich any
 * skincare product names with live data. Never called from the frontend.
 * API key is never exposed in responses or logs.
 */

const TAVILY_URL = 'https://api.tavily.com/search';
const FETCH_TIMEOUT_MS = 8_000;

// Preferred retailers for buy links — ordered by priority
const PREFERRED_RETAILERS = [
  { domain: 'amazon.com',       label: 'Amazon' },
  { domain: 'sephora.com',      label: 'Sephora' },
  { domain: 'ulta.com',         label: 'Ulta' },
  { domain: 'target.com',       label: 'Target' },
  { domain: 'walmart.com',      label: 'Walmart' },
  { domain: 'cvs.com',          label: 'CVS' },
  { domain: 'dermstore.com',    label: 'Dermstore' },
  { domain: 'cerave.com',       label: 'Official Site' },
  { domain: 'laroche-posay',    label: 'Official Site' },
  { domain: 'theordinary.com',  label: 'Official Site' },
  { domain: 'neutrogena.com',   label: 'Official Site' },
  { domain: 'paulaschoice.com', label: 'Official Site' },
  { domain: 'eltamd.com',       label: 'Official Site' },
  { domain: 'beautyofjoseon',   label: 'Official Site' },
  { domain: 'theinkeylist.com', label: 'Official Site' },
];

export interface TavilyProductResult {
  name: string;
  brand: string;
  imageUrl: string | null;
  buyLinks: Array<{ store: string; url: string; label: string }>;
  priceRange: string | null;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  images?: string[];
}

interface TavilyResponse {
  results: TavilySearchResult[];
  images?: string[];
}

function extractBuyLinks(
  results: TavilySearchResult[]
): Array<{ store: string; url: string; label: string }> {
  const links: Array<{ store: string; url: string; label: string }> = [];
  const seen = new Set<string>();

  for (const retailer of PREFERRED_RETAILERS) {
    const match = results.find(
      (r) => r.url.includes(retailer.domain) && !seen.has(retailer.domain)
    );
    if (match) {
      seen.add(retailer.domain);
      links.push({ store: retailer.label, url: match.url, label: `Buy on ${retailer.label}` });
    }
    if (links.length >= 3) break;
  }

  // Fallback: if no preferred retailers found, take top 2 results
  if (links.length === 0) {
    for (const r of results.slice(0, 2)) {
      try {
        const hostname = new URL(r.url).hostname.replace('www.', '');
        links.push({ store: hostname, url: r.url, label: `Buy on ${hostname}` });
      } catch { /* ignore invalid URLs */ }
    }
  }

  return links;
}

function extractBestImage(
  responseImages: string[] | undefined,
  results: TavilySearchResult[]
): string | null {
  // Prefer images directly returned by Tavily
  if (responseImages && responseImages.length > 0) {
    // Filter out tiny tracking pixels and icons
    const good = responseImages.find(
      (img) => img.startsWith('http') && !img.includes('pixel') && !img.includes('icon')
    );
    if (good) return good;
  }

  // Fall back to product page images extracted from results
  for (const r of results) {
    if (r.images && r.images.length > 0) {
      const img = r.images[0];
      if (img && img.startsWith('http')) return img;
    }
  }

  return null;
}

function extractPriceRange(results: TavilySearchResult[]): string | null {
  // Look for price patterns like $12.99, $12–$18, etc. in result content
  for (const r of results) {
    const match = r.content.match(/\$[\d,.]+(?:\s*[-–]\s*\$[\d,.]+)?/);
    if (match) return match[0];
  }
  return null;
}

function extractBrand(productName: string): string {
  // Common brand prefixes to extract
  const brands = [
    "CeraVe", "La Roche-Posay", "Neutrogena", "The Ordinary", "Paula's Choice",
    "EltaMD", "Beauty of Joseon", "Differin", "The INKEY List", "Cetaphil",
    "Aveeno", "Olay", "L'Oréal", "Garnier", "Vichy", "Bioderma", "Avène",
    "Drunk Elephant", "Tatcha", "Glow Recipe", "COSRX", "Some By Mi",
  ];
  for (const brand of brands) {
    if (productName.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  // Use first word(s) as brand name
  const words = productName.split(' ');
  return words.slice(0, 2).join(' ');
}

export class TavilyProductService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = env.tavily.apiKey;
  }

  get isEnabled(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for a skincare product and return image + buy links.
   * Returns null if Tavily is not configured or search fails.
   */
  async searchProduct(productName: string): Promise<TavilyProductResult | null> {
    if (!this.isEnabled) return null;

    const query = `${productName} skincare buy where to purchase`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(TAVILY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // API key in body, not a header — Tavily's standard auth
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: 'basic',
          include_images: true,
          include_image_descriptions: false,
          max_results: 6,
          // Focus on shopping/product pages
          include_domains: [
            'amazon.com', 'sephora.com', 'ulta.com', 'target.com',
            'walmart.com', 'cvs.com', 'dermstore.com', 'cerave.com',
            'laroche-posay.us', 'theordinary.com', 'neutrogena.com',
            'paulaschoice.com', 'eltamd.com',
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn({ status: response.status, productName }, 'Tavily: search failed');
        return null;
      }

      const data = (await response.json()) as TavilyResponse;

      if (!data.results || data.results.length === 0) {
        logger.debug({ productName }, 'Tavily: no results found');
        return null;
      }

      const buyLinks = extractBuyLinks(data.results);
      const imageUrl = extractBestImage(data.images, data.results);
      const priceRange = extractPriceRange(data.results);
      const brand = extractBrand(productName);

      logger.debug(
        { productName, imageFound: !!imageUrl, linksFound: buyLinks.length },
        'Tavily: product enriched'
      );

      return {
        name: productName,
        brand,
        imageUrl,
        buyLinks,
        priceRange,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const error = err as Error;
      if (error.name !== 'AbortError') {
        logger.warn({ err: error.message, productName }, 'Tavily: search error');
      }
      return null;
    }
  }

  /**
   * Search multiple products in parallel (capped to avoid rate limits).
   */
  async searchProducts(
    productNames: string[]
  ): Promise<Map<string, TavilyProductResult>> {
    const results = new Map<string, TavilyProductResult>();
    if (!this.isEnabled || productNames.length === 0) return results;

    // Max 4 parallel searches to stay within rate limits
    const chunks: string[][] = [];
    for (let i = 0; i < productNames.length; i += 4) {
      chunks.push(productNames.slice(i, i + 4));
    }

    for (const chunk of chunks) {
      const searches = await Promise.allSettled(
        chunk.map((name) => this.searchProduct(name))
      );
      searches.forEach((result, i) => {
        const name = chunk[i]!;
        if (result.status === 'fulfilled' && result.value) {
          results.set(name, result.value);
        }
      });
    }

    return results;
  }
}

export const tavilyProductService = new TavilyProductService();
