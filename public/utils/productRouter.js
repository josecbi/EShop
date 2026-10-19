import { createProductPage } from "./productPage.js"
import { fetchProduct, fetchRelatedProducts } from "./productsApi.js"

const productRoute = /^#\/product\/(.+)$/

function readProductId() {
    const match = location.hash.match(productRoute)
    if (!match) {
        return null
    }
    try {
        return decodeURIComponent(match[1])
    } catch (error) {
        if (error instanceof URIError) {
            return null
        }
        throw error
    }
}

export function createProductRouter(onProductSelect) {
    const productPage = createProductPage(onProductSelect)
    let latestNavigation = 0

    function showHome() {
        const wasOpen = productPage.isOpen()
        productPage.hide()
        if (wasOpen) {
            const target = location.hash.length > 1
                ? document.getElementById(location.hash.slice(1))
                : null
            if (target) {
                target.scrollIntoView()
            } else {
                window.scrollTo(0, 0)
            }
        }
    }

    async function sync() {
        const navigation = ++latestNavigation
        const productId = readProductId()
        if (productId === null) {
            showHome()
            return
        }

        let product = null
        let related = []
        try {
            [product, related] = await Promise.all([
                fetchProduct(productId),
                fetchRelatedProducts(productId)
            ])
        } catch (error) {
            console.error("Unable to load product:", error)
        }

        if (navigation !== latestNavigation) {
            return
        }
        if (!product) {
            showHome()
            return
        }
        productPage.show(product, related)
        window.scrollTo(0, 0)
    }

    function returnToSearch() {
        if (!productRoute.test(location.hash)) {
            return
        }
        history.pushState(null, "", "#recent-searches")
        sync()
    }

    window.addEventListener("hashchange", sync)
    sync()
    return { returnToSearch }
}
