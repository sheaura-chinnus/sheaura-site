import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface EnquiryBasketItem {
  productId: string
  productName: string
  productSlug: string
  productImage?: string
  mode: 'sale' | 'rental'
  quantity: number
  salePrice?: number
  rentalPrice?: number
  rentalDurationDays?: number
  depositAmount?: number
  category: string
  categorySlug: string
}

interface EnquiryBasketState {
  items: EnquiryBasketItem[]
  itemCount: number
  addItem: (item: Omit<EnquiryBasketItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string, mode: 'sale' | 'rental') => void
  updateQuantity: (productId: string, mode: 'sale' | 'rental', quantity: number) => void
  clearBasket: () => void
  getItems: () => EnquiryBasketItem[]
  getTotalItems: () => number
  getSubtotal: () => number
}

export const useEnquiryBasket = create<EnquiryBasketState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,

      addItem: (item) => {
        const { items } = get()
        const existingIndex = items.findIndex(
          i => i.productId === item.productId && i.mode === item.mode
        )

        if (existingIndex >= 0) {
          const newItems = [...items]
          newItems[existingIndex].quantity += item.quantity || 1
          set({
            items: newItems,
            itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
          })
        } else {
          const newItems = [...items, { ...item, quantity: item.quantity || 1 }]
          set({
            items: newItems,
            itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
          })
        }
      },

      removeItem: (productId, mode) => {
        const { items } = get()
        const newItems = items.filter(i => !(i.productId === productId && i.mode === mode))
        set({
          items: newItems,
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        })
      },

      updateQuantity: (productId, mode, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, mode)
          return
        }
        const { items } = get()
        const newItems = items.map(i =>
          i.productId === productId && i.mode === mode ? { ...i, quantity } : i
        )
        set({
          items: newItems,
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        })
      },

      clearBasket: () => {
        set({ items: [], itemCount: 0 })
      },

      getItems: () => get().items,

      getTotalItems: () => get().itemCount,

      getSubtotal: () => {
        const { items } = get()
        return items.reduce((sum, item) => {
          const price = item.mode === 'sale' ? (item.salePrice || 0) : (item.rentalPrice || 0)
          return sum + price * item.quantity
        }, 0)
      },
    }),
    {
      name: 'sheaura-enquiry-basket',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)