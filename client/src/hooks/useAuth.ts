import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery()

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error,
  }
}

export function useLogin() {
  const queryClient = useQueryClient()

  return trpc.auth.register.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.auth.me.queryKey() })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.auth.me.queryKey() })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.auth.me.queryKey() })
    },
  })
}