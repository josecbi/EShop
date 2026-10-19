import { createProductGallery } from "./productGallery.js"
import { createProductInformation } from "./productInformation.js"
import { renderProductGrid } from "./productRenderer.js"
import { createElement } from "./dom.js"

export function createProductPage(onProductSelect) {
    const main = document.querySelector("main")
    const page = document.querySelector("#product-page")
    const content = document.querySelector("#product-page-content")
    const related = document.querySelector("#related-products")
    const homeTitle = document.title

    function show(product, relatedProducts) {
        const layout = createElement("div", "product-detail-layout")
        layout.append(createProductGallery(product), createProductInformation(product))
        content.replaceChildren(layout)

        renderProductGrid(
            related,
            relatedProducts,
            "More products will appear here soon.",
            onProductSelect
        )

        document.title = `${product.name} — Echop`
        main.classList.add("showing-product")
        page.hidden = false
    }

    function hide() {
        main.classList.remove("showing-product")
        page.hidden = true
        content.replaceChildren()
        document.title = homeTitle
    }

    return { show, hide, isOpen: () => !page.hidden }
}
