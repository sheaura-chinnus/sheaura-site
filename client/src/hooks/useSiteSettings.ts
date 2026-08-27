import { trpc } from '@/lib/trpc'

export function useSiteSettings() {
  return trpc.siteSettings.getPublic.useQuery()
}