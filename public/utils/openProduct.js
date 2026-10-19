export function openProduct(product) {
    location.hash = `/product/${encodeURIComponent(product.id)}`
}
