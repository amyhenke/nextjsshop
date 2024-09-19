import express from "express"
import { getPayloadClient } from "./get-payload"
import { nextApp, nextHandler } from "./next-utils"
import payload from "payload"
import * as trpcExpress from "@trpc/server/adapters/express"
import { appRouter } from "./trpc"
import { inferAsyncReturnType } from "@trpc/server"
import bodyParser from "body-parser"
import { IncomingMessage } from "http"
import { stripeWebhookHandler } from "./webhooks"
import nextBuild from "next/dist/build"
import path from "path"
import { privateProcedure } from "./trpc/trpc"
import { PayloadRequest } from "payload/types"
import { parse } from "url"

require("dotenv").config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({
    req,
    res,
})

export type ExpressContext = inferAsyncReturnType<typeof createContext>

// slightly modified request to make it readable and check if message comes from stripe (will have a signature to make sure its from stripe, not just anyone)
// get IncomingMessage from http
export type WebhookRequest = IncomingMessage & { rawBody: Buffer }

const start = async () => {
    const webhookMiddleware = bodyParser.json({
        verify: (req: WebhookRequest, _, buffer) => {
            req.rawBody = buffer
        },
    })

    app.post("/api/webhooks/stripe", webhookMiddleware, stripeWebhookHandler)

    const payload = await getPayloadClient({
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

    // makes cart page only visible by logged in users
    const cartRouter = express.Router()
    // middleware
    cartRouter.use(payload.authenticate)

    cartRouter.get("/", (req, res) => {
        const request = req as PayloadRequest

        if (!request.user) return res.redirect("/sign-in?origin=cart")
        console.log(request.user)

        const parsedUrl = parse(req.url, true)

        // tell next.js what to render when user is authenticated
        return nextApp.render(req, res, "/cart", parsedUrl.query)

        // above is from next.js documentation
    })

    app.use("/cart", cartRouter)

    if (process.env.NEXT_BUILD) {
        app.listen(PORT, async () => {
            payload.logger.info("Node.js is building for production")

            // @ts-expect-error
            await nextBuild(path.join(__dirname, `../`))

            process.exit()
        })

        return
    }

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
