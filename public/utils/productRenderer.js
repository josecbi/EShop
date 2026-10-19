import { createElement, createStatus } from "./dom.js"
import { formatCurrency } from "./formatCurrency.js"
import { createProductTags } from "./productTag.js"

function createProductCard(product, onProductSelect, includeCatalogId) {
    const article = createElement("article", "product")
    if (includeCatalogId) {
        article.id = product.id
    }

    const openButton = createElement("button", "product-open")
    openButton.type = "button"
    openButton.setAttribute("aria-label", `View ${product.name} details`)
    openButton.addEventListener("click", () => onProductSelect(product))

    const imageContainer = createElement("div", "product-image")

    const image = createElement("img")
    image.src = product.images[0]
    image.alt = product.imageAlt
    image.loading = "lazy"
    imageContainer.append(image)

    const tags = createProductTags(product.productTag, "product-tags")
    imageContainer.append(tags)

    const meta = createElement("div", "product-meta")

    const name = createElement("h3", "", product.name)

    const price = createElement("span", "", formatCurrency(product.currPrice, product.currency))
    meta.append(name, price)

    const note = createElement("p", "product-note")
    if (product.previousPrice != null) {
        const previousPrice = createElement("del", "", formatCurrency(product.previousPrice, product.currency))
        note.append(previousPrice)
    }
    if (product.summary) {
        if (note.childNodes.length) {
            note.append(" · ")
        }
        note.append(product.summary)
    }

    const viewDetails = createElement("span", "product-view-details")
    viewDetails.append("View details ")
    const arrow = createElement("span")
    arrow.setAttribute("aria-hidden", "true")
    arrow.textContent = "→"
    viewDetails.append(arrow)

    openButton.append(imageContainer, meta, note, viewDetails)
    article.append(openButton)

    if (product.description) {
        const details = createElement("details", "product-details")

        const summary = createElement("summary")
        summary.append("Specifications ")
        const icon = createElement("span")
        icon.setAttribute("aria-hidden", "true")
        icon.textContent = "＋"
        summary.append(icon)

        const description = createElement("p", "", product.description)
        details.append(summary, description)
        article.append(details)
    }

    return article
}

export function renderProductGrid(container, products, emptyMessage, onProductSelect, includeCatalogIds = false) {
    if (!products.length) {
        container.replaceChildren(createStatus(emptyMessage))
        return
    }

    container.replaceChildren(...products.map((product) => createProductCard(product, onProductSelect, includeCatalogIds)))
}
