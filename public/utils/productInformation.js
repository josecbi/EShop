import { createElement } from "./dom.js"
import { formatCurrency } from "./formatCurrency.js"
import { categoryLabels } from "./productLabels.js"
import { createProductTags } from "./productTag.js"

function createPricing(product) {
    const pricing = createElement("div", "product-detail-pricing")
    pricing.append(createElement(
        "p",
        "product-detail-price",
        formatCurrency(product.currPrice, product.currency)
    ))

    if (product.previousPrice != null && product.previousPrice > product.currPrice) {
        pricing.append(createElement("del", "", formatCurrency(product.previousPrice, product.currency)))

        const savings = product.previousPrice - product.currPrice
        const percent = Math.round((savings / product.previousPrice) * 100)
        pricing.append(createElement(
            "span",
            "product-detail-savings",
            `Save ${formatCurrency(savings, product.currency)} (${percent}%)`
        ))
    }

    return pricing
}

function createSection(title, content) {
    const section = createElement("section", "product-detail-section")
    section.append(createElement("h3", "", title), content)
    return section
}

function createHighlights(summary) {
    const highlights = summary.split(" · ").filter(Boolean)
    if (!highlights.length) {
        return null
    }

    const list = createElement("ul", "product-detail-highlights")
    for (const highlight of highlights) {
        list.append(createElement("li", "", highlight))
    }
    return createSection("Highlights", list)
}

function createSpecifications(product) {
    const specs = createElement("dl", "product-detail-specs")
    const categories = (product.productTag ?? []).map((tag) => categoryLabels[tag]).filter(Boolean)
    const rows = [["Type", product.type]]

    if (categories.length) {
        rows.push(["Category", categories.join(", ")])
    }
    if (product.brand) {
        rows.push(["Brand", product.brand])
    }
    rows.push(["Model ID", product.id])

    for (const [label, value] of rows) {
        specs.append(createElement("dt", "", label), createElement("dd", "", value))
    }
    return createSection("Specifications", specs)
}

function createReviews(product) {
    const message = product.reviews?.length
        ? `${product.reviews.length} customer reviews`
        : "No customer reviews yet."
    return createSection("Customer reviews", createElement("p", "product-detail-description", message))
}

export function createProductInformation(product) {
    const information = createElement("div", "product-detail-information")
    information.append(createElement("p", "eyebrow eyebrow-red", product.type))

    const name = createElement("h1", "", product.name)
    name.id = "product-page-title"
    information.append(name, createProductTags(product.productTag, "product-detail-tags"), createPricing(product))

    const highlights = createHighlights(product.summary ?? "")
    if (highlights) {
        information.append(highlights)
    }
    if (product.description) {
        information.append(createSection(
            "About this item",
            createElement("p", "product-detail-description", product.description)
        ))
    }

    information.append(createSpecifications(product), createReviews(product))
    return information
}
