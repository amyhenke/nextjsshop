import { AfterChangeHook, BeforeChangeHook } from "payload/dist/globals/config/types"
import { PRODUCT_CATEGORIES } from "../../config"
import { CollectionBeforeChangeHook, CollectionAfterChangeHook, CollectionConfig, Access } from "payload/types"
import { Product, User } from "../../payload-types"
import { stripe } from "../../lib/stripe"

const addUser: CollectionBeforeChangeHook = async ({ req, data }) => {
    const user = req.user
    const productData = data as Product

    return { ...productData, user: user.id }
}

// synchronised a user to the products once a product is created
// when a product is create this is how we know which user it belongs to
const syncUser: CollectionAfterChangeHook<Product> = async ({ req, doc }) => {
    const fullUser = await req.payload.findByID({
        collection: "users",
        id: req.user.id,
    })

    if (fullUser && typeof fullUser === "object") {
        const { products } = fullUser

        // list all IDs of products user currently has
        // if object, its product object so get id, else its already the product id
        // empty array means user doesn't have any products yet
        const allIDs = [...(products?.map(product => (typeof product === "object" ? product.id : product)) || [])]

        const createProductIDs = allIDs.filter((id, index) => allIDs.indexOf(id) === index)

        const dataToUpdate = [...createProductIDs, doc.id]

        await req.payload.update({
            collection: "users",
            id: fullUser.id,
            data: {
                products: dataToUpdate,
            },
        })
    }
}

// error handling that wasn't in video - og version below
// const addUser: BeforeChangeHook<Product> = async ({
//     req,
//     data,
//   }) => {
//     const user = req.user

//     return { ...data, user: user.id }
//   }

const isAdminOrHasAccess =
    (): Access =>
    ({ req: { user: _user } }) => {
        const user = _user as User | undefined

        if (!user) return false
        if (user.role === "admin") return true

        const userProductIDs = (user.products || []).reduce<Array<string>>((accumulator, product) => {
            if (!product) return accumulator

            // just the product id
            if (typeof product === "string") {
                // so add id into accumulator
                accumulator.push(product)
            } else {
                accumulator.push(product.id)
            }
            return accumulator
        }, [])

        // only see our own products
        return {
            id: {
                in: userProductIDs,
            },
        }
    }

export const Products: CollectionConfig = {
    slug: "products",
    admin: {
        useAsTitle: "name",
    },
    access: {
        read: isAdminOrHasAccess(),
        update: isAdminOrHasAccess(),
        delete: isAdminOrHasAccess(),
    },
    hooks: {
        afterChange: [syncUser],
        beforeChange: [
            addUser,
            async args => {
                if (args.operation === "create") {
                    const data = args.data as Product

                    // creates a product within stripe (rather than manually in their dashboard)
                    const createdProduct = await stripe.products.create({
                        // add same name of product as in DB
                        name: data.name,
                        default_price_data: {
                            currency: "GBP",
                            unit_amount: Math.round(data.price * 100),
                        },
                    })

                    // collect the stripe info to add to DB for that product
                    const updated: Product = {
                        ...data,
                        stripeId: createdProduct.id,
                        priceId: createdProduct.default_price as string,
                    }

                    return updated
                } else if (args.operation === "update") {
                    const data = args.data as Product

                    // update product in stripe
                    const updatedProduct = await stripe.products.update(data.stripeId!, {
                        name: data.name,
                        default_price: data.priceId!,
                    })
                    // ! means we know the variable will exist

                    // collect the stripe info to add to DB for that product
                    const updated: Product = {
                        ...data,
                        stripeId: updatedProduct.id,
                        priceId: updatedProduct.default_price as string,
                    }

                    return updated
                }
            },
        ],
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
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "description",
            type: "textarea",
            label: "Product details",
        },
        {
            name: "price",
            label: "Price in GBP",
            min: 0,
            max: 1000,
            type: "number",
            required: true,
        },
        {
            name: "category",
            label: "category",
            type: "select",
            options: PRODUCT_CATEGORIES.map(({ label, value }) => ({ label, value })),
            required: true,
        },
        {
            name: "product_files",
            label: "Product file(s)",
            type: "relationship",
            required: true,
            relationTo: "product_files",
            hasMany: false,
        },
        {
            name: "approvedForSale",
            label: "Product Status",
            type: "select",
            defaultValue: "pending",
            access: {
                create: ({ req }) => req.user.role === "admin",
                read: ({ req }) => req.user.role === "admin",
                update: ({ req }) => req.user.role === "admin",
            },
            options: [
                {
                    label: "Pending verfication",
                    value: "pending",
                },
                {
                    label: "Approved",
                    value: "approved",
                },
                {
                    label: "Denied",
                    value: "denied",
                },
            ],
        },
        {
            name: "priceId",
            access: {
                create: () => false,
                read: () => false,
                update: () => false,
            },
            type: "text",
            admin: {
                hidden: true,
            },
        },
        {
            name: "stripeId",
            access: {
                create: () => false,
                read: () => false,
                update: () => false,
            },
            type: "text",
            admin: {
                hidden: true,
            },
        },
        {
            name: "images",
            type: "array",
            label: "Product images",
            minRows: 1,
            maxRows: 4,
            required: true,
            labels: {
                singular: "Image",
                plural: "Images",
            },
            fields: [
                {
                    name: "image",
                    type: "upload",
                    relationTo: "media",
                    required: true,
                },
            ],
        },
    ],
}
