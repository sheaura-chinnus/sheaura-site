import { Link } from 'react-router-dom'
import { Home, Search, Sparkles, ArrowLeft } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { data: settings } = useSiteSettings()
  const brandName = settings?.brandName || 'Sheaura'

  return (
    <div className="animate-fade-in min-h-[70vh] flex items-center justify-center">
      <div className="container-sheaura text-center py-16">
        <div className="max-w-md mx-auto">
          {/* Error Code */}
          <div className="mb-8" aria-hidden="true">
            <span className="font-display text-9xl sm:text-[12xl] font-medium text-primary/20 leading-none">
              404
            </span>
          </div>

          {/* Decorative Element */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
            Page Not Found
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
            Sorry, we couldn't find the page you're looking for. It might have been moved,
            removed, or the URL might be incorrect.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Browse Shop
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Or explore our popular sections:</p>
            <div className="flex flex-wrap justify-center gap-3 text-primary">
              <Link to="/shop?category=jewellery" className="hover:underline">Jewellery</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/shop?category=cosmetics" className="hover:underline">Cosmetics</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/shop?category=ornaments" className="hover:underline">Ornaments</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/about" className="hover:underline">About Us</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>

          {/* Contact Suggestion */}
          <div className="mt-12 p-6 rounded-xl bg-muted/30 border border-border">
            <p className="text-muted-foreground mb-3">
              Still can't find what you need?
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Our team is happy to help. Reach out to us directly.
            </p>
            <Link to="/contact">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </Link>
          </div>

          {/* Brand Footer */}
          <p className="mt-10 text-xs text-muted-foreground/60">
            {brandName} &copy; {new Date().getFullYear()} — Timeless Elegance, Curated for You
          </p>
        </div>
      </div>
    </div>
  )
}