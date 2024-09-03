import express from "express"
import { getPayloadClient } from "./get-payload"
import { nextApp, nextHandler } from "./next-utils"
import payload from "payload"
import * as trpcExpress from "@trpc/server/adapters/express"
import { appRouter } from "./trpc"
import { inferAsyncReturnType } from "@trpc/server"

require("dotenv").config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({
    req,
    res,
})

export type ExpressContext = inferAsyncReturnType<typeof createContext>

const start = async () => {
    // const payload =
    await getPayloadClient({
        initOptions: {
            express: app,
            onInit: async cms => {
                cms.logger.info(`Admin URL ${cms.getAdminURL()}`)
            },
        },
    })

    // I had typos in getPayloadClient() and thought payload had changed it
    // This is a more simple way to connect: https://payloadcms.com/docs/getting-started/installation
    // await payload.init({
    //     secret: process.env.PAYLOAD_SECRET!,
    //     express: app,
    // })

    app.use(
        "/api/trpc",
        trpcExpress.createExpressMiddleware({
            router: appRouter,
            createContext,
        })
    )

    // this is how you self host next.js - independent of vercel
    app.use((req, res) => nextHandler(req, res))

    nextApp.prepare().then(() => {
        payload.logger.info("Next.js started")

        app.listen(PORT, async () => {
            payload.logger.info(`Next.js App URL: ${process.env.NEXT_PUBLIC_SERVER_URL}`)
        })
    })
}

start()
