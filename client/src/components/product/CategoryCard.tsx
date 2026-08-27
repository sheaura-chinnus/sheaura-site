import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

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

const categoryIcons: Record<string, string> = {
  jewellery: '💎',
  cosmetics: '💄',
  ornaments: '🏺',
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-500 block"
      aria-label={`Browse ${category.name}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-muted to-muted/80 flex items-center justify-center text-6xl">
            {categoryIcons[category.slug] || '✨'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity group-hover:opacity-90" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-2 border border-white/20">
          Collection
        </div>
        <h3 className="font-display text-2xl font-semibold mb-1 tracking-tight text-white group-hover:text-amber-200 transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-white/80 mb-3 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-white/15">
          <span className="text-xs font-medium text-amber-200/90 tracking-wide">
            {category.productCount} Items Available
          </span>
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}