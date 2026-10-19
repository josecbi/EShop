import path from "node:path"

export const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8"
}

export function getContentType(filePath) {
    return contentTypes[path.extname(filePath)] ?? "application/octet-stream"
}
