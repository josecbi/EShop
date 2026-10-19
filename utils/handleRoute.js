import fs from "node:fs/promises"
import path from "node:path"
import { handleApiRoute } from "./apiRoutes.js"
import { contentTypes, getContentType } from "./mimeTypes.js"

const rootDirectory = path.resolve(import.meta.dirname, "..")
const publicDirectory = path.join(rootDirectory, "public")

function sendText(res, statusCode, message) {
    res.writeHead(statusCode, {
        "Content-Type": contentTypes[".txt"],
        "Cache-Control": "no-store"
    })
    return res.end(message)
}

function sendJson(req, res, statusCode, body) {
    res.writeHead(statusCode, {
        "Content-Type": contentTypes[".json"],
        "Cache-Control": "no-store"
    })
    return res.end(req.method === "HEAD" ? undefined : JSON.stringify(body))
}

async function serveApi(req, res, url) {
    const { status, body } = await handleApiRoute(url.pathname, url.searchParams)
    return sendJson(req, res, status, body)
}

async function serveStaticFile(req, res, pathname) {
    let decodedPath
    try {
        decodedPath = decodeURIComponent(pathname)
    } catch {
        return sendText(res, 400, "Invalid URL path")
    }

    const requestedPath = decodedPath === "/"
        ? path.join(publicDirectory, "index.html")
        : path.resolve(publicDirectory, `.${decodedPath}`)
    if (requestedPath !== publicDirectory && !requestedPath.startsWith(`${publicDirectory}${path.sep}`)) {
        return sendText(res, 403, "Forbidden")
    }

    let file
    try {
        file = await fs.readFile(requestedPath)
    } catch (error) {
        if (error.code === "ENOENT" || error.code === "EISDIR") {
            return sendText(res, 404, "Not found")
        }
        throw error
    }

    res.writeHead(200, {
        "Content-Type": getContentType(requestedPath),
        "Cache-Control": "no-store"
    })
    return res.end(req.method === "HEAD" ? undefined : file)
}

export async function handleRoute(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`)
        if (req.method !== "GET" && req.method !== "HEAD") {
            return sendText(res, 405, "Method not allowed")
        }

        if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
            return await serveApi(req, res, url)
        }
        return await serveStaticFile(req, res, url.pathname)
    } catch (error) {
        console.error("Request failed:", error)
        return sendText(res, 500, "Internal server error")
    }
}
