import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard, { type ProductCardData } from './ProductCard';
import { cn } from '../../utils/cn';

interface ProductCardListProps {
  products: ProductCardData[];
}

export default function ProductCardList({ products }: ProductCardListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  }

  return (
    <div className="relative group/cards my-3 -mx-1">
      {products.length > 1 && (
        <button onClick={() => scroll('left')} aria-label="Scroll left"
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-3',
            'w-7 h-7 rounded-full flex items-center justify-center',
            'bg-surface-900/90 border border-surface-700/60 shadow-lg',
            'text-slate-400 hover:text-white transition-all duration-150',
            'opacity-0 group-hover/cards:opacity-100',
          )}>
          <ChevronLeft size={14} />
        </button>
      )}

      <div ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}>
        {products.map((product, i) => (
          <div key={i} style={{ scrollSnapAlign: 'start' }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <button onClick={() => scroll('right')} aria-label="Scroll right"
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-3',
            'w-7 h-7 rounded-full flex items-center justify-center',
            'bg-surface-900/90 border border-surface-700/60 shadow-lg',
            'text-slate-400 hover:text-white transition-all duration-150',
            'opacity-0 group-hover/cards:opacity-100',
          )}>
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
