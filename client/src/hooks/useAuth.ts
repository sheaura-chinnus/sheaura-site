import { useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.getMe.useQuery()

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error,
  }
}

export function useLogin() {
  const queryClient = useQueryClient()

  return trpc.auth.registerUser.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getMe'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getMe'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return trpc.auth.logoutUser.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getMe'] })
    },
  })
}

export function useDemoLogin() {
  const queryClient = useQueryClient()

  return trpc.auth.demoLogin.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })
}