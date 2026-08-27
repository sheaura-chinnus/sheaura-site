import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    slug: string
    description?: string
    imageUrl?: string
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
      className="card-sheaura group relative overflow-hidden p-0"
      aria-label={`Browse ${category.name}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center text-6xl">
            {categoryIcons[category.slug] || '✨'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-display text-xl font-medium text-foreground mb-1">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {category.productCount} products
          </span>
          <ArrowRight className="h-5 w-5 text-primary/70 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}