import { useState } from 'react';
import { ExternalLink, ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ProductCardData {
  name: string;
  brand: string;
  tagline: string;
  imageUrl: string;
  priceRange: string;
  keyIngredients: string[];
  skinTypes: string[];
  buyLinks: Array<{ store: string; url: string; label: string }>;
}

// ── USD → INR conversion ──────────────────────────────────────────────────────
const USD_TO_INR = 83.5;

function convertToINR(priceStr: string): string {
  if (!priceStr || priceStr === 'Check retailer') return priceStr;

  // Handle range: "$12 – $18" or "$12-$18"
  const rangeMatch = priceStr.match(/\$(\d+(?:\.\d+)?)\s*[-–]\s*\$(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const low  = Math.round(parseFloat(rangeMatch[1]!) * USD_TO_INR / 100) * 100;
    const high = Math.round(parseFloat(rangeMatch[2]!) * USD_TO_INR / 100) * 100;
    return `₹${low.toLocaleString('en-IN')} – ₹${high.toLocaleString('en-IN')}`;
  }

  // Handle single price: "$24.79"
  const singleMatch = priceStr.match(/\$(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const inr = Math.round(parseFloat(singleMatch[1]!) * USD_TO_INR / 100) * 100;
    return `₹${inr.toLocaleString('en-IN')}`;
  }

  return priceStr;
}

// ── Store colour mapping ──────────────────────────────────────────────────────
const STORE_COLORS: Record<string, string> = {
  Amazon:       'text-amber-400 border-amber-500/40  bg-amber-500/8',
  Sephora:      'text-rose-400  border-rose-500/40   bg-rose-500/8',
  Ulta:         'text-purple-400 border-purple-500/40 bg-purple-500/8',
  Target:       'text-red-400   border-red-500/40    bg-red-500/8',
  Walmart:      'text-blue-400  border-blue-500/40   bg-blue-500/8',
  Dermstore:    'text-teal-400  border-teal-500/40   bg-teal-500/8',
  CVS:          'text-red-400   border-red-500/40    bg-red-500/8',
};
function storeColor(store: string) {
  return STORE_COLORS[store] ?? 'text-slate-300 border-slate-600/40 bg-slate-700/20';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProductCard({ product }: { product: ProductCardData }) {
  const [imgError, setImgError] = useState(false);
  const inrPrice = convertToINR(product.priceRange);

  return (
    <div className={cn(
      'w-full rounded-2xl overflow-hidden',
      'bg-surface-900 border border-surface-700/50',
      'shadow-md shadow-black/20 transition-all duration-200',
      'hover:border-rose-500/30 hover:shadow-rose-950/20 hover:-translate-y-0.5',
    )}>

      {/* ── Image row ── */}
      <div className="relative h-36 bg-surface-800/50 flex items-center justify-center overflow-hidden">
        {!imgError ? (
          <img
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="h-full w-full object-contain p-2"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-slate-600 px-3">
            <ShoppingBag size={24} strokeWidth={1.2} />
            <span className="text-[10px] text-center leading-tight">{product.name}</span>
          </div>
        )}

        {/* INR price pill — top right */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-300 bg-surface-950/80 border border-emerald-500/25 backdrop-blur-sm">
          {inrPrice}
        </div>
      </div>

      {/* ── Info row ── */}
      <div className="px-3 pt-2.5 pb-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400/70 mb-0.5">
          {product.brand}
        </p>
        <p className="text-xs font-semibold text-white leading-tight line-clamp-1">
          {product.name}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
          {product.tagline}
        </p>

        {/* Ingredients + skin types in one compact line */}
        {(product.keyIngredients.length > 0 || product.skinTypes.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.keyIngredients.slice(0, 2).map((ing) => (
              <span key={ing}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300/80">
                {ing}
              </span>
            ))}
            {product.skinTypes.slice(0, 2).map((t) => (
              <span key={t}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300/70">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Buy buttons — side by side ── */}
      <div className="px-3 pb-2.5 pt-1.5 flex flex-col gap-1">
        {product.buyLinks.slice(0, 3).map((link) => (
          <a
            key={link.store}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-medium',
              'border transition-all duration-150 hover:brightness-110 active:scale-[0.98]',
              storeColor(link.store),
            )}
          >
            <span>{link.label}</span>
            <ExternalLink size={9} className="opacity-50 flex-shrink-0" />
          </a>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-surface-700/30 bg-surface-950/30">
        <Sparkles size={8} className="text-rose-400/50" />
        <span className="text-[9px] text-slate-600">Recommended by Derma</span>
      </div>

    </div>
  );
}
