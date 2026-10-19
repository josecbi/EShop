import http from "node:http"
import { handleRoute } from "./utils/handleRoute.js"

const PORT = 8000

const server = http.createServer(handleRoute)

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})
