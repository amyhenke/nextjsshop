import { PrimaryActionEmailHtml } from "../components/emails/PrimaryActionEmail"
import { Access, CollectionConfig } from "payload/types"

// only admins and currently logged in user can view the currently logged in user
const adminsAndUser: Access = ({ req: { user } }) => {
    if (user.role === "admin") return true

    return {
        id: {
            equals: user.id,
        },
    }
}

export const Users: CollectionConfig = {
    slug: "users",
    auth: {
        verify: {
            generateEmailHTML: ({ token }) => {
                return PrimaryActionEmailHtml({ actionLabel: "Verify your account", buttonText: "Verify Account", href: `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}` })
            },
        },
    },
    access: {
        read: adminsAndUser,
        // anyone can sign up
        create: () => true,
        update: ({ req }) => req.user.role === "admin",
        delete: ({ req }) => req.user.role === "admin",
    },
    admin: {
        // hidden for everyone who is not an admin
        hidden: ({ user }) => user.role !== "admin",
        defaultColumns: ["id"],
    },
    fields: [
        {
            name: "products",
            label: "Products",
            admin: {
                condition: () => false,
            },
            type: "relationship",
            relationTo: "products",
            hasMany: true,
        },
        {
            name: "product_files",
            label: "Product files",
            admin: {
                condition: () => false,
            },
            type: "relationship",
            relationTo: "product_files",
            hasMany: true,
        },
        {
            name: "role",
            defaultValue: "user",
            required: true,
            // admin: {
            // condition: ({ req }) => req.user.role === "admin",
            // condition: () => false,
            // },
            type: "select",
            options: [
                {
                    label: "Admin",
                    value: "admin",
                },
                {
                    label: "User",
                    value: "user",
                },
            ],
        },
    ],
}
