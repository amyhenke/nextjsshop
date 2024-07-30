"use client"

import { PRODUCT_CATEGORIES } from "@/config"
import { useEffect, useRef, useState } from "react"
import NavItem from "./NavItem"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"

const NavItems = () => {
    const [activeIndex, setActiveIndex] = useState<null | number>(null)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveIndex(null)
            }
        }

        document.addEventListener("keydown", handler)

        // prevent memory leaks when component unmounts by cleaning up
        return () => {
            document.removeEventListener("keydown", handler)
        }
    }, [])

    const isAnyOpen = activeIndex !== null

    const navRef = useRef<HTMLDivElement | null>(null)

    // if click outside of nav (level2) close it
    useOnClickOutside(navRef, () => setActiveIndex(null))

    return (
        <div className="flex gap-4 h-full" ref={navRef}>
            {PRODUCT_CATEGORIES.map((category, i) => {
                const handleOpen = () => {
                    if (activeIndex === i) {
                        setActiveIndex(null)
                    } else {
                        setActiveIndex(i)
                    }
                }

                // check if item is currently opened so can change styling
                const isOpen = i === activeIndex

                return <NavItem category={category} handleOpen={handleOpen} isOpen={isOpen} key={category.value} isAnyOpen={isAnyOpen} />
            })}
        </div>
    )
}

export default NavItems
