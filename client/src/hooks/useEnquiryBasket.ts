import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface EnquiryListItem {
  productId: string
  itemCode: string
  productName: string
  productSlug: string
  productImage?: string
  category?: string
}

interface EnquiryListState {
  items: EnquiryListItem[]
  itemCount: number
  addItem: (item: EnquiryListItem) => void
  removeItem: (productId: string) => void
  isInList: (productId: string) => boolean
  clearList: () => void
  clearBasket: () => void // alias for compatibility
}

export const useEnquiryList = create<EnquiryListState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,

      addItem: (item) => {
        const { items } = get()
        const existing = items.some(i => i.productId === item.productId || (item.itemCode && i.itemCode === item.itemCode))
        if (!existing) {
          const newItems = [...items, item]
          set({
            items: newItems,
            itemCount: newItems.length,
          })
        }
      },

      removeItem: (productId) => {
        const { items } = get()
        const newItems = items.filter(i => i.productId !== productId)
        set({
          items: newItems,
          itemCount: newItems.length,
        })
      },

      isInList: (productId) => {
        return get().items.some(i => i.productId === productId)
      },

      clearList: () => {
        set({ items: [], itemCount: 0 })
      },

      clearBasket: () => {
        set({ items: [], itemCount: 0 })
      },
    }),
    {
      name: 'sheaura-enquiry-list',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

// Alias for backwards compatibility with any remaining imports
export const useEnquiryBasket = useEnquiryList