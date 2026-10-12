import http from "node:http"
import fs from "node:fs/promises"
import path from "node:path"

const PORT = 8000
const __dirname = import.meta.dirname
const publicDirectory = path.join(__dirname, "public")
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
}

const server = http.createServer(async (req, res) => {
    try {
        const { pathname } = new URL(req.url, `http://${req.headers.host}`)
        if (req.method !== "GET" && req.method !== "HEAD") {
            res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" })
            return res.end("Method not allowed")
        }

        if (pathname === "/api/products") {
            const data = await fs.readFile(path.join(__dirname, "data", "data.json"))
            res.setHeader("Content-Type", contentTypes[".json"])
            return res.end(data)
        }

        let decodedPath
        try {
            decodedPath = decodeURIComponent(pathname)
        } catch {
            res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" })
            return res.end("Invalid URL path")
        }

        const requestedPath = decodedPath === "/"
            ? path.join(publicDirectory, "index.html")
            : path.resolve(publicDirectory, `.${decodedPath}`)
        if (requestedPath !== publicDirectory && !requestedPath.startsWith(`${publicDirectory}${path.sep}`)) {
            res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" })
            return res.end("Forbidden")
        }

        let file
        try {
            file = await fs.readFile(requestedPath)
        } catch (error) {
            if (error.code === "ENOENT" || error.code === "EISDIR") {
                res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
                return res.end("Not found")
            }
            throw error
        }

        const contentType = contentTypes[path.extname(requestedPath)] ?? "application/octet-stream"
        res.writeHead(200, { "Content-Type": contentType })
        return res.end(req.method === "HEAD" ? undefined : file)
    } catch (error) {
        console.error("Request failed:", error)
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
        return res.end("Internal server error")
    }
})

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})
