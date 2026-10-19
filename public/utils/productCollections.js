import { createStatus } from "./dom.js"
import { renderProductGrid } from "./productRenderer.js"
import { fetchBestSellers, fetchDeals, fetchProducts } from "./productsApi.js"

const loadError = "Products could not be loaded. Please try again later."

const collections = [
    {
        selector: "#deal-products",
        load: fetchDeals,
        emptyMessage: "There are no active deals right now."
    },
    {
        selector: "#best-seller-products",
        load: fetchBestSellers,
        emptyMessage: "Best sellers will appear here soon."
    },
    {
        selector: "#products",
        load: fetchProducts,
        emptyMessage: "No products are available right now.",
        includeCatalogIds: true
    }
]

async function renderCollection(collection, onProductSelect) {
    const container = document.querySelector(collection.selector)
    try {
        renderProductGrid(
            container,
            await collection.load(),
            collection.emptyMessage,
            onProductSelect,
            collection.includeCatalogIds
        )
    } catch (error) {
        console.error(`Unable to load ${collection.selector}:`, error)
        container.replaceChildren(createStatus(loadError, "alert"))
    }
}

export function renderProductCollections(onProductSelect) {
    return Promise.all(collections.map((collection) => renderCollection(collection, onProductSelect)))
}
