import { createStatus } from "./dom.js"
import { renderProductGrid } from "./productRenderer.js"
import { fetchProducts, fetchProductsByCategory } from "./productsApi.js"

export function createCategoryFilter(onProductSelect) {
    const nav = document.querySelector("#category-nav")
    const container = document.querySelector("#products")
    let latestRequest = 0

    async function select(link) {
        const category = link.dataset.category
        const request = ++latestRequest

        for (const item of nav.querySelectorAll("a")) {
            item.classList.toggle("category-active", item === link)
        }

        try {
            const products = category === "all"
                ? await fetchProducts()
                : await fetchProductsByCategory(category)
            if (request === latestRequest) {
                renderProductGrid(container, products, "No products in this category yet.", onProductSelect, true)
            }
        } catch (error) {
            console.error("Unable to filter products:", error)
            if (request === latestRequest) {
                container.replaceChildren(createStatus("Products could not be loaded. Please try again later.", "alert"))
            }
        }
    }

    nav.addEventListener("click", (event) => {
        const link = event.target.closest("a[data-category]")
        if (link) {
            event.preventDefault()
            select(link)
        }
    })
}
