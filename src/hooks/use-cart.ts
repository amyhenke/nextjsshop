// does 3 things
// add items to cart
// remove items from cart
// clear the cart
// (keep track of cart items)

import { Product } from "@/payload-types"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type CartItem = {
    product: Product
}

type CartState = {
    items: CartItem[]
    // pass in a product to add (of type Product) and return void
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    // to clear, don't need to recieve anything or return
    clearCart: () => void
}

export const useCart = create<CartState>()(
    // regular react state is not persistant when reload the page
    // cart state should persist tho!
    // persist (zustand) saves cart in local storage
    persist(
        set => ({
            items: [],
            // return state setter
            addItem: product =>
                set(state => {
                    // return all the previous items (spread in to state.items)
                    // then append the new item
                    return { items: [...state.items, { product }] }
                }),
            removeItem: id =>
                set(state => ({
                    // current state.items filtered by id we want to remove
                    items: state.items.filter(item => item.product.id !== id),
                })),
            clearCart: () => set({ items: [] }),
        }),
        {
            // configuration element for persist
            // how cart will look in local storage
            name: "cart-storage",
            // local instead of e.g. session storage
            storage: createJSONStorage(() => localStorage),
        }
    )
)
