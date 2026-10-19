import { createElement } from "./dom.js"
import { categoryLabels, tagLabels } from "./productLabels.js"

function createProductTag(tag) {
    const label = tagLabels[tag] ?? categoryLabels[tag] ?? tag
    const element = createElement("span")
    element.classList.add("product-tag")
    element.textContent = label

    if (categoryLabels[tag]) {
        element.classList.add("product-tag-category")
    } else if (tag === "bestSeller" || tag === "new") {
        element.classList.add("product-tag-blue")
    }

    return element
}

export function createProductTags(tags = [], className) {
    const container = createElement("div", className)
    for (const tag of tags ?? []) {
        container.append(createProductTag(tag))
    }
    return container
}
