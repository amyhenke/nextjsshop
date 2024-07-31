import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatPrice(
    price: number | string,
    options: {
        currency?: "USD" | "EUR" | "GBP" | "BDT"
        notation?: Intl.NumberFormatOptions["notation"]
    } = {}
) {
    const { currency = "GBP", notation = "compact" } = options

    const numericPrice = typeof price === "string" ? parseFloat(price) : price

    return new Intl.NumberFormat("en-UK", {
        style: "currency",
        currency: currency,
        notation: notation,
        maximumFractionDigits: 2,
    }).format(numericPrice)
}
