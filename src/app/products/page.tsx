import MaxWidthWrapper from "@/components/MaxWidthWrapper"
import ProductReel from "@/components/ProductReel"
import { PRODUCT_CATEGORIES } from "@/config"

type Param = string | string[] | undefined

interface ProductPageProps {
    searchParams: { [key: string]: Param }
}

// utility function
// ensuring not a string array (string[]) so can work with it in ProductsPage
const parse = (param: Param) => {
    return typeof param === "string" ? param : undefined
}

const ProductsPage = ({ searchParams }: ProductPageProps) => {
    const sort = parse(searchParams.sort)
    const category = parse(searchParams.category)

    const label = PRODUCT_CATEGORIES.find(({ value }) => value === category)?.label

    return (
        <MaxWidthWrapper>
            <ProductReel title={label ?? "Browse high-quality assets"} query={{ category, limit: 40, sort: sort === "desc" || sort === "asc" ? sort : undefined }} />
        </MaxWidthWrapper>
    )
}

export default ProductsPage
