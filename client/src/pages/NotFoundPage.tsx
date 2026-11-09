import { Link } from 'react-router-dom'
import { Home, Search, MessageCircle } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { data: settings } = useSiteSettings()
  const brandName = settings?.brandName || 'Sheaura'

  return (
    <div className="animate-fade-in min-h-[65vh] flex items-center justify-center">
      <div className="container-sheaura text-center py-16">
        <div className="max-w-md mx-auto">
          {/* Error Code */}
          <div className="mb-4" aria-hidden="true">
            <span className="font-display text-7xl sm:text-8xl font-bold text-amber-900/20 dark:text-amber-400/20 leading-none">
              404
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground mb-3">
            Page Not Found
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            The page you are looking for may have been moved, renamed, or is temporarily unavailable.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/">
              <Button className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white rounded-xl">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" className="w-full sm:w-auto border-amber-700/30 rounded-xl">
                <Search className="h-4 w-4 mr-2" />
                Browse Catalogue
              </Button>
            </Link>
          </div>

          {/* Contact Link */}
          <div className="pt-6 border-t border-border/60">
            <p className="text-xs text-muted-foreground mb-3">
              Need assistance finding a specific jewellery piece?
            </p>
            <Link to="/contact">
              <Button variant="ghost" size="sm" className="text-xs text-amber-800 dark:text-amber-300">
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                Contact Customer Support
              </Button>
            </Link>
          </div>

          {/* Brand Footer */}
          <p className="mt-8 text-xs text-muted-foreground/60">
            {brandName} &copy; {new Date().getFullYear()} • Handcrafted Fashion Jewellery
          </p>
        </div>
      </div>
    </div>
  )
}