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
  const utils = trpc.useUtils()

  return trpc.auth.registerUser.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useUpdateProfile() {
  const utils = trpc.useUtils()

  return trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const utils = trpc.useUtils()

  return trpc.auth.logoutUser.useMutation({
    onSuccess: async () => {
      // 1. Immediately reset the getMe user cache to null for instantaneous UI update
      utils.auth.getMe.setData(undefined, null as any)
      // 2. Invalidate all auth and user queries
      await utils.auth.invalidate()
      // 3. Clear all cached React Query data
      queryClient.clear()
      await queryClient.resetQueries()
    },
  })
}

export function useAdminLogin() {
  const utils = trpc.useUtils()

  return trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useStaffLogin() {
  const utils = trpc.useUtils()

  return trpc.auth.staffLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useCustomerRegister() {
  const utils = trpc.useUtils()

  return trpc.auth.customerRegister.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useCustomerLogin() {
  const utils = trpc.useUtils()

  return trpc.auth.customerLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useGoogleLogin() {
  const utils = trpc.useUtils()

  return trpc.auth.googleLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useUpdateCustomerProfile() {
  const utils = trpc.useUtils()

  return trpc.auth.updateCustomerProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useSendOtp() {
  return trpc.auth.sendOtp.useMutation()
}

export function useVerifyOtp() {
  const utils = trpc.useUtils()

  return trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useGuestAutoConvert() {
  const utils = trpc.useUtils()

  return trpc.auth.guestAutoConvert.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate()
    },
  })
}

export function useAddresses() {
  const { user } = useAuth()
  return trpc.auth.getAddresses.useQuery(undefined, {
    enabled: !!user,
  })
}

export function useSaveAddress() {
  const queryClient = useQueryClient()

  return trpc.auth.saveAddress.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getAddresses'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'getMe'] })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return trpc.auth.deleteAddress.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getAddresses'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'getMe'] })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return trpc.auth.setDefaultAddress.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getAddresses'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'getMe'] })
    },
  })
}

export function useClaimWelcomeCoupon() {
  const queryClient = useQueryClient()

  return trpc.auth.claimWelcomeCoupon.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'getMe'] })
    },
  })
}