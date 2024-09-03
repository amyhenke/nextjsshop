import { User } from "../payload-types"
import { userAgent } from "next/server"
import { Access, CollectionConfig } from "payload/types"

const isAdminOrHasAccessToImages =
    (): Access =>
    async ({ req }) => {
        const user = req.user as User | undefined

        if (!user) return false
        if (user.role === "admin") return true

        return {
            // query constraint
            // false means cant read image, true means can
            // if this user owns this image, can see it
            user: {
                equals: req.user.id,
            },
        }
    }

export const Media: CollectionConfig = {
    slug: "media",
    hooks: {
        beforeChange: [
            ({ req, data }) => {
                return { ...data, user: req.user.id }
            },
        ],
    },
    access: {
        read: async ({ req }) => {
            const referer = req.headers.referer

            // is the user logged? if not, they can read all images so browsing store can see. but if logged in, shouldn't see all images e.g. products that aren't their own
            if (!req.user || !referer?.includes("sell")) {
                return true
            }

            return await isAdminOrHasAccessToImages()({ req })
        },
        delete: isAdminOrHasAccessToImages(),
        update: isAdminOrHasAccessToImages(),
    },
    // stop media from showing up as its own collection in the sidebar - able to use it just from within product creation
    admin: {
        hidden: ({ user }) => user.role !== "admin",
    },
    upload: {
        staticURL: "/media",
        staticDir: "media",
        // generates different versions of these images to optimize page loading times
        imageSizes: [
            {
                name: "thumbnail",
                width: 400,
                height: 300,
                position: "centre",
            },
            {
                name: "card",
                width: 768,
                height: 1024,
                position: "centre",
            },
            {
                name: "tablet",
                width: 1024,
                height: undefined,
                position: "centre",
            },
        ],
        // only image file types allowed
        mimeTypes: ["image/*"],
    },
    fields: [
        {
            name: "user",
            type: "relationship",
            relationTo: "users",
            required: true,
            hasMany: false,
            admin: {
                condition: () => false,
            },
        },
    ],
}
