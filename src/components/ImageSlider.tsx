"use client"

import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/pagination"
import type SwiperType from "swiper"
import { useEffect, useState } from "react"
import { Pagination } from "swiper/modules"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ImageSliderProps {
    urls: string[]
}

const ImageSlider = ({ urls }: ImageSliderProps) => {
    const [swiper, setSwiper] = useState<null | SwiperType>(null)
    const [activeIndex, setActiveIndex] = useState(0)

    const activeStyles = "active:scale-[0.97] grid opacity-100 hoveR:scale-105 absolute top-1/2 -translate-y-1/2 aspect-square h-8 w-8 z-50 place-items-center rounded-full border-2 bg-white border-zinc-300"
    const inactiveStyles = "hidden text-gray-400"

    const [slideConfig, setSlideConfig] = useState({
        isBeginning: true,
        isEnd: activeIndex === (urls.length ?? 0) - 1,
    })

    useEffect(() => {
        swiper?.on("slideChange", ({ activeIndex }) => {
            setActiveIndex(activeIndex)
            setSlideConfig({
                isBeginning: activeIndex === 0,
                isEnd: activeIndex === (urls.length ?? 0) - 1,
            })
        })
        // dependancy array - when will rerun
    }, [swiper, urls])

    return (
        <div className="group relative bg-zinc-100 aspect-square overflow-hidden rounded-xl">
            <div className="absolute z-10 inset-0 opacity-0 group-hover:opacity-100 transition">
                <button
                    onClick={e => {
                        e.preventDefault()
                        swiper?.slideNext()
                    }}
                    className={cn(activeStyles, "right-3 transition", {
                        [inactiveStyles]: slideConfig.isEnd,
                        "hover:bg-primary-300 text-primary-300 opactiy-100": !slideConfig.isEnd,
                    })}
                    aria-label="Next button"
                >
                    <ChevronRight className="h-4 w-4 text-zinc-700" />
                </button>
                <button
                    onClick={e => {
                        e.preventDefault()
                        swiper?.slidePrev()
                    }}
                    className={cn(activeStyles, "left-3 transition", {
                        [inactiveStyles]: slideConfig.isBeginning,
                        "hover:bg-primary-300 text-primary-300 opactiy-100": !slideConfig.isBeginning,
                    })}
                    aria-label="Previous button"
                >
                    <ChevronLeft className="h-4 w-4 text-zinc-700" />
                </button>
            </div>

            <Swiper
                pagination={{
                    renderBullet: (_, className) => {
                        return `<span class="rounded-full transition ${className}"></span>`
                    },
                }}
                onSwiper={swiper => setSwiper(swiper)}
                spaceBetween={50}
                modules={[Pagination]}
                slidesPerView={1}
                className="h-full w-full"
            >
                {urls.map((url, i) => (
                    <SwiperSlide key={i} className="-z-10 relative h-full w-full">
                        <Image fill loading="eager" className="-z-10 h-full w-full object-cover" src={url} alt="Product Image" />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}

export default ImageSlider
