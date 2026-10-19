import { createElement } from "./dom.js"

export function createProductGallery(product) {
    const gallery = createElement("div", "product-detail-gallery")
    const image = createElement("img", "product-detail-image")
    image.src = product.images[0]
    image.alt = product.imageAlt
    gallery.append(image)

    if (product.images.length > 1) {
        const thumbnails = createElement("div", "product-detail-thumbnails")
        for (const [index, imageUrl] of product.images.entries()) {
            const thumbnail = createElement("button", "product-detail-thumbnail")
            thumbnail.type = "button"
            thumbnail.setAttribute("aria-label", `View product image ${index + 1}`)

            const thumbnailImage = createElement("img")
            thumbnailImage.src = imageUrl
            thumbnailImage.alt = ""
            thumbnail.append(thumbnailImage)
            thumbnail.addEventListener("click", () => {
                image.src = imageUrl
                image.alt = index === 0 ? product.imageAlt : `${product.name}, image ${index + 1}`
            })
            thumbnails.append(thumbnail)
        }
        gallery.append(thumbnails)
    }

    return gallery
}
