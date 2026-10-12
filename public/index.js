const categoryLabels = {
    "tv-video": "TV & video",
    phones: "Phones",
    gaming: "Gaming",
    "home-appliances": "Home appliances",
    computers: "Computers",
    audio: "Audio"
}

const tagLabels = {
    deal: "Deal",
    bestSeller: "Best seller",
    new: "New"
}

function createProductTag(tag) {
    const label = tagLabels[tag] ?? categoryLabels[tag] ?? tag
    const element = document.createElement("span")
    element.classList.add("product-tag")
    element.textContent = label

    if (categoryLabels[tag]) {
        element.classList.add("product-tag-category")
    } else if (tag === "deal") {
        element.classList.add("product-tag-coral")
    } else if (tag === "bestSeller" || tag === "new") {
        element.classList.add("product-tag-blue")
    }

    return element
}

function createProductCard(product) {
    const article = document.createElement("article")
    article.className = "product"
    article.id = product.id

    const imageContainer = document.createElement("div")
    imageContainer.className = "product-image"

    const image = document.createElement("img")
    image.src = product.images[0]
    image.alt = product.imageAlt
    image.loading = "lazy"
    imageContainer.append(image)

    const tags = document.createElement("div")
    tags.className = "product-tags"
    for (const tag of product.productTag ?? []) {
        tags.append(createProductTag(tag))
    }
    imageContainer.append(tags)

    const meta = document.createElement("div")
    meta.className = "product-meta"

    const name = document.createElement("h3")
    name.textContent = product.name

    const price = document.createElement("span")
    price.textContent = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: product.currency
    }).format(product.currPrice)
    meta.append(name, price)

    const note = document.createElement("p")
    note.className = "product-note"
    if (product.previousPrice != null) {
        const previousPrice = document.createElement("del")
        previousPrice.textContent = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: product.currency
        }).format(product.previousPrice)
        note.append(previousPrice)
    }
    if (product.summary) {
        if (note.childNodes.length) {
            note.append(" · ")
        }
        note.append(product.summary)
    }

    article.append(imageContainer, meta, note)

    if (product.description) {
        const details = document.createElement("details")
        details.className = "product-details"

        const summary = document.createElement("summary")
        summary.append("Specifications ")
        const icon = document.createElement("span")
        icon.setAttribute("aria-hidden", "true")
        icon.textContent = "＋"
        summary.append(icon)

        const description = document.createElement("p")
        description.textContent = product.description
        details.append(summary, description)
        article.append(details)
    }

    return article
}

async function loadProducts() {
    const productsContainer = document.querySelector("#products")

    try {
        const response = await fetch("/api/products")
        if (!response.ok) {
            throw new Error(`Product request failed: ${response.status}`)
        }

        const products = await response.json()
        if (!Array.isArray(products)) {
            throw new Error("Product response must be an array")
        }

        productsContainer.replaceChildren(...products.map(createProductCard))
    } catch (error) {
        console.error("Unable to load products:", error)
        const status = document.createElement("p")
        status.className = "products-status"
        status.setAttribute("role", "alert")
        status.textContent = "Products could not be loaded. Please try again later."
        productsContainer.replaceChildren(status)
    }
}

loadProducts()
