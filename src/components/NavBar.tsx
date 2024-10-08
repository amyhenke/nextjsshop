import Link from "next/link"
import MaxWidthWrapper from "./MaxWidthWrapper"
import { Icons } from "./Icons"
import NavItems from "./NavItems"
import { buttonVariants } from "./ui/button"
import Cart from "./Cart"
import { getServerSideUser } from "@/lib/payload-utils"
import { cookies } from "next/headers"
import UserAccountNav from "./UserAccountNav"
import MobileNav from "./MobileNav"

const NavBar = async () => {
    const nextCookies = cookies()
    const { user } = await getServerSideUser(nextCookies)

    return (
        <div className="bg-white sticku z-50 top-0 inset-x-0 h-16">
            <header className="relative bg-white">
                <MaxWidthWrapper>
                    <div className="border-b border-gray-200">
                        <div className="flex h-16 items-center">
                            {/* TODO: Mobile nav */}
                            <MobileNav />

                            <div className="ml-4 flex lg:ml-0">
                                <Link href="/">
                                    <Icons.logo className="h=10 w-10" />
                                </Link>
                            </div>
                            <div className="hidden nz-50 lg:ml-8 lg:block lg:self-stretch">
                                <NavItems />
                            </div>

                            <div className="ml-auto flex items-center">
                                <div className="flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
                                    {user ? null : (
                                        <Link href="/sign-in" className={buttonVariants({ variant: "ghost", className: "hidden lg:block" })}>
                                            Sign in
                                        </Link>
                                    )}
                                    {user ? null : <span className="hidden lg:block h-6 w-px bg-gray-200" aria-hidden="true" />}

                                    {user ? (
                                        <UserAccountNav user={user} />
                                    ) : (
                                        <Link href="/sign-up" className={buttonVariants({ variant: "ghost", className: "hidden lg:block" })}>
                                            Create Account
                                        </Link>
                                    )}

                                    {user ? <span className="hidden lg:block h-6 w-px bg-gray-200" aria-hidden="true" /> : null}

                                    {user ? null : (
                                        <div className="flex lg:ml-6">
                                            <span className="h-6 w-px bg-gray-200" aria-hidden="true" />
                                        </div>
                                    )}

                                    <div className="ml-4 flow-root lg:ml-6">
                                        <Cart />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </MaxWidthWrapper>
            </header>
        </div>
    )
}

export default NavBar
