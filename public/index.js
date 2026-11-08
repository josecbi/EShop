import { createCategoryFilter } from "./utils/categoryFilter.js"
import { renderProductCollections } from "./utils/productCollections.js"
import { openProduct } from "./utils/openProduct.js"
import { createProductRouter } from "./utils/productRouter.js"
import { createRecentSearches } from "./utils/recentSearches.js"

const controls = document.querySelector("#sticky-controls")
const updateControlsHeight = () => {
    document.documentElement.style.setProperty("--controls-height", `${controls.offsetHeight}px`)
}
new ResizeObserver(updateControlsHeight).observe(controls)
updateControlsHeight()

const recentSearches = createRecentSearches(openProduct)
const router = createProductRouter(openProduct)
createCategoryFilter(openProduct)
renderProductCollections(openProduct)

document.querySelector("#search-form").addEventListener("submit", (event) => {
    event.preventDefault()
    router.returnToSearch()
    recentSearches.submit(document.querySelector("#search-input").value)
})
