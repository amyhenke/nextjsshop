"use client"

import { trpc } from "@/trpc/client"
import { router } from "@/trpc/trpc"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// client component to check if _isPaid value has changed - then import into server component of thank-you/page.tsx

interface PaymentStatusProps {
    orderEmail: string
    orderId: string
    isPaid: boolean
}

const PaymentStatus = ({ orderEmail, orderId, isPaid }: PaymentStatusProps) => {
    const router = useRouter()

    const { data } = trpc.payment.pollOrderStatus.useQuery(
        { orderId },
        {
            // only query if isPaid is false - once true, stop checking
            enabled: isPaid === false,
            refetchInterval: data => (data?.isPaid ? false : 1000),
            // check every 1000ms if isPaid is false
        }
    )

    // stripe sent back that paid successfully
    useEffect(() => {
        if (data?.isPaid) {
            router.refresh()
        }
    }, [data?.isPaid, router])

    return (
        <div className="mt-16 grid grid-cols-2 gap-x-4 text-sm text-gray-600">
            <div>
                <p className="font-medium text-gray-900">Shipping to</p>
                <p>{orderEmail}</p>
            </div>

            <div>
                <p className="font-medium text-gray-900">Order Status</p>
                <p>{isPaid ? "Payment successful" : "Pending payment"}</p>
            </div>
        </div>
    )
}

export default PaymentStatus
