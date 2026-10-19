import assert from "node:assert/strict"
import test from "node:test"
import { handleApiRoute } from "../utils/apiRoutes.js"
import { categories } from "../utils/productService.js"

const route = (pathname, query = "") => handleApiRoute(pathname, new URLSearchParams(query))

test("returns the product catalog and category collections", async () => {
    const catalog = await route("/api/products")
    assert.equal(catalog.status, 200)
    assert.ok(Array.isArray(catalog.body))

    const category = await route(`/api/products/categories/${categories[0]}`)
    assert.equal(category.status, 200)
    assert.ok(Array.isArray(category.body))

    for (const collection of ["deals", "best-sellers"]) {
        const result = await route(`/api/products/${collection}`)
        assert.equal(result.status, 200)
        assert.ok(Array.isArray(result.body))
    }
})

test("validates search queries and categories", async () => {
    assert.equal((await route("/api/products/search")).status, 400)
    assert.equal((await route("/api/products/search", `q=${"a".repeat(101)}`)).status, 400)
    assert.equal((await route("/api/products/categories/unknown")).status, 404)
    assert.equal((await route("/api/products/search", "q=phones")).status, 200)
})

test("returns a product and excludes it from related products", async () => {
    const { body: products } = await route("/api/products")
    assert.ok(products.length > 0)

    const product = products[0]
    const result = await route(`/api/products/${product.id}`)
    assert.equal(result.status, 200)
    assert.equal(result.body.id, product.id)

    const related = await route(`/api/products/${product.id}/related`)
    assert.equal(related.status, 200)
    assert.ok(Array.isArray(related.body))
    assert.ok(related.body.every((item) => item.id !== product.id))
})

test("rejects invalid and unknown product ids and paths", async () => {
    assert.equal((await route("/api/products/%2F")).status, 400)
    assert.equal((await route("/api/products/__missing_product__")).status, 404)
    assert.equal((await route("/api/unknown")).status, 404)
})
