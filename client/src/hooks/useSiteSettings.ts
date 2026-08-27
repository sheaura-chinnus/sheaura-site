import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'

export function useSiteSettings() {
  return trpc.siteSettings.public.useQuery()
}