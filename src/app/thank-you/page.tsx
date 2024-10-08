import { getServerSideUser } from "@/lib/payload-utils"
import Image from "next/image"
import { cookies } from "next/headers"
import payload from "payload"
import { getPayloadClient } from "@/get-payload"
import { notFound, redirect } from "next/navigation"
import { Order, Product, ProductFile, User } from "@/payload-types"
import { PRODUCT_CATEGORIES } from "@/config"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import PaymentStatus from "@/components/PaymentStatus"

// This is a server side component so can perform server side validation and actions so not rendered unless user is logged and it is their order. Logic done securely. No content flashing

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

const ThankYouPage = async ({ searchParams }: PageProps) => {
    const orderId = searchParams.orderId
    const nextCookies = cookies()

    const { user } = await getServerSideUser(nextCookies)
    const payload = await getPayloadClient()

    const { docs: orders } = await payload.find({
        collection: "orders",
        // JOIN so don't just have user id - have the actual user
        depth: 2,
        where: {
            id: {
                equals: orderId,
            },
        },
    })

    // take first element in orders array to get the order (will only be 1 in results and only have 1 orderId in searchParams (param in url))
    const [order] = orders

    // if orderId is invalid, do not show any downloadables
    if (!order) return notFound

    // find id of user who made the order
    // if string then its id of user
    // otherwise will be entire user object, return so get id
    const orderUserId: string | User = typeof order.user === "string" ? order.user : (order.user as User).id

    // if logged in user id is not same as order user id then not authorised to download
    if (orderUserId !== user?.id) {
        // origin means once logged in it will take them back to where were before (thank you page)
        return redirect(`/sign-in?origin=thank-you?orderId=${order.id}`)
    }

    const products = order.products as Product[]
    const orderTotal = products.reduce((total, product) => {
        return total + product.price
    }, 0)

    return (
        <main className="relative lg:min-h-full">
            <div className="h-80 overflow-hidden lg:absolute lg:h-full lg:w-1/2 lg:pr-4 xl:pr-12">
                <Image fill src="/checkout-thank-you.jpg" className="hidden lg:block h-full w-full object-cover object-center" alt="Thank you for your order" />
            </div>

            <div className="mx-auto mx-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-7 lg:px-8 lg:py-32 xl:gap-x-24">
                <div className="lg:col-start-2">
                    <p className="text-sm font-medium text-blue-600">Order successful</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Thanks for ordering</h1>

                    {/* if order successful, payment made and logged in */}
                    {order._isPaid ? <p className="mt-2 text-base text-muted-foreground">Your order was processed and your assets are available to download below. We&apos;ve sent your receipt and order details to {typeof order.user !== "string" ? <span className="font-medium text-gray-900">{(order.user as User).email}</span> : null}</p> : <p className="mt-2 text-base text-muted-foreground">We appreciate your order, and we&apos;re currently processing it. So hang tight and we&apos;ll send you confirmation very soon!</p>}

                    <div className="mt-16 text-sm font-medium">
                        <div className="text-muted-foreground">Order no:</div>
                        <div className="mt-2 text-gray-900">{order.id}</div>
                    </div>

                    <ul className="mt-6 divide-y divide-gray-200 border-t border-gray-200 text-sm font-medium text-muted-foreground">
                        {(order.products as Product[]).map(product => {
                            const label = PRODUCT_CATEGORIES.find(({ value }) => value === product.category)?.label

                            const downloadUrl = (product.product_files as ProductFile).url as string

                            const { image } = product.images[0]

                            return (
                                <li key={product.id} className="flex space-x-6 py-6">
                                    <div className="relative h-24 w-24">{typeof image !== "string" && image.url ? <Image fill src={image.url} alt={`${product.name} image`} className="flex-none rounded-md bg-gray-100 object-cover object-center" /> : null}</div>

                                    <div className="flex-auto flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-gray-900">{product.name}</h3>
                                            <p className="my-1">Category: {label}</p>
                                        </div>

                                        {order._isPaid ? (
                                            <a href={downloadUrl} download={product.name} className="text-blue-600 hover:underline underline-offset-2">
                                                Download asset
                                            </a>
                                        ) : null}
                                    </div>

                                    <p className="flex-none font-medium text-gray-900">{formatPrice(product.price)}</p>
                                </li>
                            )
                        })}
                    </ul>

                    <div className="space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-muted-foreground">
                        <div className="flex justify-between">
                            <p>Subtotal</p>
                            <p className="text-gray-900">{formatPrice(orderTotal)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p>Transaction Fee</p>
                            <p className="text-gray-900">{formatPrice(1)}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 pt-6 text-gray-900">
                            <p className="text-base">Total</p>
                            <p className="text-gray-900">{formatPrice(orderTotal + 1)}</p>
                        </div>
                    </div>

                    <PaymentStatus isPaid={order._isPaid as boolean} orderEmail={(order.user as User).email} orderId={order.id as string} />

                    <div className="mt-16 border-t border-gray-200 py-7 text-right">
                        <Link href="/products" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Continue shopping &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default ThankYouPage
