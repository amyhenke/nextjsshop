/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // remotePatterns: [
        //     {
        //         hostname: "localhost",
        //         pathname: "**",
        //         port: "3000",
        //         protocol: "http",
        //     },
        // ],
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
            },
            {
                protocol: "https",
                hostname: "nextjsshop-production.up.railway.app",
            },
        ],
    },
}

export default nextConfig
