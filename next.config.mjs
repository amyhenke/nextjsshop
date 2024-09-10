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
        domains: ["localhost", "https://nextjsshop-production.up.railway.app/"],
    },
}

export default nextConfig
