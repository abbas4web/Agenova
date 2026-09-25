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

  const isMultiple = products.length > 1;

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  }

  // Single card — full width, no scroll
  if (!isMultiple) {
    return (
      <div className="my-2 w-full">
        <ProductCard product={products[0]!} />
      </div>
    );
  }

  // Multiple cards — horizontal scroll, each card fixed 260px wide
  return (
    <div className="relative group/cards my-2">
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10',
          'w-6 h-6 rounded-full flex items-center justify-center',
          'bg-surface-900 border border-surface-700/60 shadow-md',
          'text-slate-400 hover:text-white transition-all duration-150',
          'opacity-0 group-hover/cards:opacity-100 focus:opacity-100',
        )}
      >
        <ChevronLeft size={12} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto py-1 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[260px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10',
          'w-6 h-6 rounded-full flex items-center justify-center',
          'bg-surface-900 border border-surface-700/60 shadow-md',
          'text-slate-400 hover:text-white transition-all duration-150',
          'opacity-0 group-hover/cards:opacity-100 focus:opacity-100',
        )}
      >
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
