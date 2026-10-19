import fs from "node:fs/promises"
import path from "node:path"
import { normalizeText } from "../public/utils/normalizeText.js"
import { categoryLabels, tagLabels } from "../public/utils/productLabels.js"

const productsFile = path.resolve(import.meta.dirname, "..", "data", "data.json")

export const categories = Object.keys(categoryLabels)

let productsPromise

function loadProducts() {
    if (!productsPromise) {
        productsPromise = fs.readFile(productsFile, "utf8")
            .then(JSON.parse)
            .catch((error) => {
                productsPromise = undefined
                throw error
            })
    }
    return productsPromise
}

function hasTag(product, tag) {
    return product.productTag?.includes(tag) ?? false
}

function searchableText(product) {
    const tags = (product.productTag ?? []).flatMap((tag) => [
        tagLabels[tag] ?? "",
        categoryLabels[tag] ?? ""
    ])
    return normalizeText([
        product.name,
        product.type,
        product.summary,
        product.description,
        ...tags
    ].filter(Boolean).join(" "))
}

export function getAllProducts() {
    return loadProducts()
}

export async function searchProducts(query) {
    const normalizedQuery = normalizeText(query.trim())
    if (!normalizedQuery) {
        return []
    }
    const products = await loadProducts()
    return products.filter((product) => searchableText(product).includes(normalizedQuery))
}

export async function getDeals() {
    return (await loadProducts()).filter((product) => hasTag(product, "deal"))
}

export async function getBestSellers() {
    return (await loadProducts()).filter((product) => hasTag(product, "bestSeller"))
}

export async function getProductsByCategory(category) {
    return (await loadProducts()).filter((product) => hasTag(product, category))
}

export async function getProductById(id) {
    return (await loadProducts()).find((product) => product.id === id) ?? null
}

export async function getRelatedProducts(id) {
    const others = (await loadProducts()).filter((product) => product.id !== id)
    const deals = others.filter((product) => hasTag(product, "deal"))
    return deals.length ? deals : others
}
