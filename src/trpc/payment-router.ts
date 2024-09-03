import { z } from "zod"
import { privateProcedure, router } from "./trpc"
import { TRPCError } from "@trpc/server"
import { getPayloadClient } from "../get-payload"
import { stripe } from "../lib/stripe"
import type Stripe from "stripe"
import { Order } from "../payload-types"

export const paymentRouter = router({
    createSession: privateProcedure.input(z.object({ productIds: z.array(z.string()) })).mutation(async ({ ctx, input }) => {
        const { user } = ctx
        let { productIds } = input

        if (productIds.length === 0) {
            throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const payload = await getPayloadClient()

        const { docs: products } = await payload.find({
            collection: "products",
            where: {
                id: {
                    in: productIds,
                },
            },
        })

        // console.log(`PRODUCTS UNALTERED: ${products}`)

        // get all products in cart that have a price
        const filteredProducts = products.filter(prod => Boolean(prod.priceId))

        // console.log(`Filtered Products: ${filteredProducts}`)

        // const blah = products.map(prod => prod.priceId)
        // console.log(`blah: ${blah}`)
        // const ugh = products.map(prod => prod.id)
        // console.log(`ugh: ${ugh}`)
        // const grr = filteredProducts.map(prod => prod.id)
        // console.log(`grr: ${grr}, typeof grr: ${typeof grr}`)

        // create an order in DB with ID to check if paid or not
        const order = await payload.create({
            collection: "orders",
            data: {
                _isPaid: false,
                products: filteredProducts.map(prod => String(prod.id)),
                // 66d70e767a7abc493a9bbfee,66d6f6aaffea182d63c61495
                user: user.id,
            },
        })

        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []

        // add price of each product in cart
        filteredProducts.forEach(product => {
            console.log(`PRODUCT: ${product.priceId}`)
            if (typeof product.priceId === "string") {
                line_items.push({
                    price: product.priceId!,
                    // digital product, so not point purchasing more than once
                    quantity: 1,
                })
            } else {
                throw new TRPCError({ code: "BAD_REQUEST" })
            }
        })

        // add transaction fee to total amount
        line_items.push({
            price: "price_1Pusw2JEnf1cuAW3dNcWV9qo",
            quantity: 1,
            adjustable_quantity: {
                enabled: false,
            },
        })

        // create checkout session
        try {
            const stripeSession = await stripe.checkout.sessions.create({
                success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
                cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/cart`,
                payment_method_types: ["card", "paypal"],
                mode: "payment",
                metadata: {
                    userId: user.id,
                    orderId: order.id,
                },
                line_items,
            })

            return { url: stripeSession.url }
        } catch (err) {
            console.log(err)

            return { url: null }
        }
    }),
})
