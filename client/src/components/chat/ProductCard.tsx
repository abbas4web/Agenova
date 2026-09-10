import { useState } from 'react';
import { ExternalLink, Tag, Droplets, Sparkles, ShoppingBag } from 'lucide-react';
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

const STORE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Amazon:    { bg: 'bg-amber-500/10',  text: 'text-amber-300',  border: 'border-amber-500/30' },
  Sephora:   { bg: 'bg-rose-500/10',   text: 'text-rose-300',   border: 'border-rose-500/30' },
  Ulta:      { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30' },
  Target:    { bg: 'bg-red-500/10',    text: 'text-red-300',    border: 'border-red-500/30' },
  Walmart:   { bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/30' },
  Dermstore: { bg: 'bg-teal-500/10',   text: 'text-teal-300',   border: 'border-teal-500/30' },
  CVS:       { bg: 'bg-red-500/10',    text: 'text-red-300',    border: 'border-red-500/30' },
  Official:  { bg: 'bg-slate-500/10',  text: 'text-slate-300',  border: 'border-slate-500/30' },
};

function storeStyle(store: string) {
  return STORE_STYLES[store] ?? { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30' };
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={cn(
      'flex-shrink-0 w-52 rounded-2xl overflow-hidden flex flex-col',
      'bg-surface-900 border border-surface-700/60',
      'shadow-lg shadow-black/30 transition-transform duration-200 hover:-translate-y-0.5',
    )}>
      {/* ── Product image ── */}
      <div className="relative w-full h-44 bg-surface-800/60 flex items-center justify-center overflow-hidden">
        {!imgError ? (
          <img
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="w-full h-full object-contain p-3"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <ShoppingBag size={30} strokeWidth={1.2} />
            <span className="text-[10px] text-center px-3 leading-tight text-slate-500">{product.name}</span>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-950/80 backdrop-blur-sm border border-surface-700/50 text-[10px] font-medium text-emerald-400">
          <Tag size={9} />
          {product.priceRange}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Brand + name */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400/80">{product.brand}</p>
          <p className="text-xs font-semibold text-white leading-snug mt-0.5 line-clamp-2">{product.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{product.tagline}</p>
        </div>

        {/* Key ingredients */}
        {product.keyIngredients.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Droplets size={9} className="text-sky-400/60" />
              <span className="text-[9px] uppercase tracking-widest text-slate-600">Key ingredients</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {product.keyIngredients.slice(0, 3).map((ing) => (
                <span key={ing} className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300/80">{ing}</span>
              ))}
            </div>
          </div>
        )}

        {/* Skin types */}
        {product.skinTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.skinTypes.slice(0, 3).map((type) => (
              <span key={type} className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300/80">{type}</span>
            ))}
          </div>
        )}

        {/* Buy links */}
        <div className="flex flex-col gap-1 mt-auto pt-1 border-t border-surface-700/40">
          {product.buyLinks.slice(0, 3).map((link) => {
            const s = storeStyle(link.store);
            return (
              <a
                key={link.store}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-[10px] font-medium',
                  'border transition-all duration-150 hover:brightness-125 active:scale-[0.97]',
                  s.bg, s.text, s.border,
                )}
              >
                <span>{link.label}</span>
                <ExternalLink size={9} className="flex-shrink-0 opacity-60" />
              </a>
            );
          })}
        </div>
      </div>

      {/* Derma badge */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-surface-700/40 bg-surface-950/40">
        <Sparkles size={9} className="text-rose-400/60" />
        <span className="text-[9px] text-slate-600">Recommended by Derma</span>
      </div>
    </div>
  );
}
