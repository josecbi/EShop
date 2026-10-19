const productsEndpoint = "/api/products"

async function request(url, { allowNotFound = false } = {}) {
    const response = await fetch(url)
    if (allowNotFound && response.status === 404) {
        return null
    }
    if (!response.ok) {
        throw new Error(`Request to ${url} failed: ${response.status}`)
    }
    return response.json()
}

async function requestList(url) {
    const products = await request(url)
    if (!Array.isArray(products)) {
        throw new Error(`Response from ${url} must be an array`)
    }
    return products
}

export function fetchProducts() {
    return requestList(productsEndpoint)
}

export function fetchDeals() {
    return requestList(`${productsEndpoint}/deals`)
}

export function fetchBestSellers() {
    return requestList(`${productsEndpoint}/best-sellers`)
}

export function fetchProductsByCategory(category) {
    return requestList(`${productsEndpoint}/categories/${encodeURIComponent(category)}`)
}

export function searchProducts(query) {
    return requestList(`${productsEndpoint}/search?q=${encodeURIComponent(query)}`)
}

export function fetchProduct(id) {
    return request(`${productsEndpoint}/${encodeURIComponent(id)}`, { allowNotFound: true })
}

export async function fetchRelatedProducts(id) {
    return (await request(`${productsEndpoint}/${encodeURIComponent(id)}/related`, { allowNotFound: true })) ?? []
}
