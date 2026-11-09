import { Link } from 'react-router-dom'
import { ArrowRight, Gem, Sparkles, Package } from 'lucide-react'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    productCount: number
  }
}

function CategoryIcon({ slug }: { slug: string }) {
  if (slug.includes('jewel') || slug.includes('choker') || slug.includes('bridal')) {
    return <Gem className="h-10 w-10 text-amber-700/60" />
  }
  if (slug.includes('cosmetic') || slug.includes('beauty')) {
    return <Sparkles className="h-10 w-10 text-amber-700/60" />
  }
  return <Package className="h-10 w-10 text-amber-700/60" />
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs hover:shadow-lg hover:border-amber-600/40 transition-all duration-300 block"
      aria-label={`Browse ${category.name}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-muted/40">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/10 via-muted to-muted/80 flex items-center justify-center">
            <CategoryIcon slug={category.slug} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity group-hover:opacity-90" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <span className="text-[11px] font-medium tracking-wide text-amber-200/90 uppercase block mb-1">
          Collection
        </span>
        <h3 className="font-display text-xl sm:text-2xl font-semibold mb-1 tracking-tight text-white group-hover:text-amber-200 transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs sm:text-sm text-white/80 mb-3 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-white/15">
          <span className="text-xs text-white/70">
            {category.productCount} {category.productCount === 1 ? 'item' : 'items'}
          </span>
          <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}