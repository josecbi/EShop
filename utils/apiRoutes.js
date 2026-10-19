import {
    categories,
    getAllProducts,
    getBestSellers,
    getDeals,
    getProductById,
    getProductsByCategory,
    getRelatedProducts,
    searchProducts
} from "./productService.js"

const maxQueryLength = 100
const productIdPattern = /^[A-Za-z0-9_-]{1,64}$/

function ok(body) {
    return { status: 200, body }
}

function fail(status, message) {
    return { status, body: { error: message } }
}

function decodeSegment(segment) {
    try {
        return decodeURIComponent(segment)
    } catch {
        return null
    }
}

async function searchRoute(searchParams) {
    const query = searchParams.get("q")?.trim() ?? ""
    if (!query) {
        return fail(400, "Query parameter q is required")
    }
    if (query.length > maxQueryLength) {
        return fail(400, `Query parameter q must be at most ${maxQueryLength} characters`)
    }
    return ok(await searchProducts(query))
}

async function categoryRoute(rawCategory) {
    const category = decodeSegment(rawCategory)
    if (!categories.includes(category)) {
        return fail(404, "Category not found")
    }
    return ok(await getProductsByCategory(category))
}

async function productRoute(rawId, action) {
    const id = decodeSegment(rawId)
    if (!productIdPattern.test(id ?? "")) {
        return fail(400, "Invalid product id")
    }

    const product = await getProductById(id)
    if (!product) {
        return fail(404, "Product not found")
    }
    return ok(action === "related" ? await getRelatedProducts(id) : product)
}

export async function handleApiRoute(pathname, searchParams) {
    const segments = pathname.split("/").filter(Boolean)
    const [api, resource, first, second, ...rest] = segments
    if (api !== "api" || resource !== "products" || rest.length) {
        return fail(404, "Not found")
    }

    if (first === undefined) {
        return ok(await getAllProducts())
    }
    if (second === undefined) {
        if (first === "search") {
            return searchRoute(searchParams)
        }
        if (first === "deals") {
            return ok(await getDeals())
        }
        if (first === "best-sellers") {
            return ok(await getBestSellers())
        }
        return productRoute(first)
    }
    if (first === "categories") {
        return categoryRoute(second)
    }
    if (second === "related") {
        return productRoute(first, "related")
    }
    return fail(404, "Not found")
}
