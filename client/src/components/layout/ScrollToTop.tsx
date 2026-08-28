import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Ensures that whenever a visitor navigates between pages,
 * the window resets scroll position back to the top (y = 0),
 * preventing the page from launching down or retaining scroll position.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // Release any lingering body overflow locks
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = ''
    }

    if (hash) {
      // If navigating to an anchor hash (like #rental-process), scroll to that element
      const timer = setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }
      }, 60)
      return () => clearTimeout(timer)
    }

    // Otherwise immediately scroll window to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
