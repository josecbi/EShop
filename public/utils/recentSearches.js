import { createElement, createStatus } from "./dom.js"
import { normalizeText } from "./normalizeText.js"
import { renderProductGrid } from "./productRenderer.js"
import { searchProducts } from "./productsApi.js"

const searchHistoryKey = "echop-recentSearches"
const maxRecentSearches = 5
const maxSearchLength = 100

export function createRecentSearches(onProductSelect) {
    const section = document.querySelector("#recent-searches")
    const termsContainer = document.querySelector("#recent-search-terms")
    const productsContainer = document.querySelector("#recent-search-products")
    const searchInput = document.querySelector("#search-input")
    let recentSearches = []
    let storageWarning = ""
    let latestRender = 0

    async function loadMatchingProducts() {
        const results = await Promise.all(recentSearches.map(searchProducts))
        const matchingProducts = new Map()
        for (const product of results.flat()) {
            if (!matchingProducts.has(product.id)) {
                matchingProducts.set(product.id, product)
            }
        }
        return [...matchingProducts.values()]
    }

    async function render() {
        const renderId = ++latestRender
        section.hidden = recentSearches.length === 0 && !storageWarning
        termsContainer.replaceChildren()

        for (const term of recentSearches) {
            const button = createElement("button", "recent-search-term", term)
            button.type = "button"
            button.addEventListener("click", () => {
                searchInput.value = term
                submit(term)
            })
            termsContainer.append(button)
        }

        if (storageWarning) {
            termsContainer.append(createStatus(storageWarning, "alert"))
        }

        try {
            const matchingProducts = await loadMatchingProducts()
            if (renderId === latestRender) {
                renderProductGrid(
                    productsContainer,
                    matchingProducts,
                    "No products matched your recent searches.",
                    onProductSelect
                )
            }
        } catch (error) {
            console.error("Unable to search products:", error)
            if (renderId === latestRender) {
                productsContainer.replaceChildren(createStatus("Search is unavailable right now. Please try again later.", "alert"))
            }
        }
    }

    function submit(query) {
        const term = query.trim()
        if (!term) {
            return
        }

        recentSearches = [
            term,
            ...recentSearches.filter((search) => normalizeText(search) !== normalizeText(term))
        ].slice(0, maxRecentSearches)

        try {
            localStorage.setItem(searchHistoryKey, JSON.stringify(recentSearches))
            storageWarning = ""
        } catch (error) {
            console.error("Unable to save recent searches:", error)
            storageWarning = "Recent searches could not be saved in this browser."
        }

        render()
        section.scrollIntoView({ behavior: "smooth" })
    }

    try {
        const storedSearches = localStorage.getItem(searchHistoryKey)
        if (storedSearches) {
            const parsedSearches = JSON.parse(storedSearches)
            if (!Array.isArray(parsedSearches) || !parsedSearches.every((term) => typeof term === "string")) {
                throw new Error("Stored search history must be an array of strings")
            }
            recentSearches = parsedSearches
                .filter((term) => term.trim() && term.length <= maxSearchLength)
                .slice(0, maxRecentSearches)
        }
    } catch (error) {
        console.error("Unable to load recent searches:", error)
        storageWarning = "Recent searches could not be loaded from this browser."
    }

    render()
    return { submit }
}
