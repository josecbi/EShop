import "dotenv/config"
import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import session from "express-session"
import { doubleCsrf } from "csrf-csrf"
import fs from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { authRouter } from "./auth/routers/authRouter.js"
import { getConnection } from "./auth/db/db.js"
import { handleRoute } from "./utils/handleRoute.js"

const root = import.meta.dirname
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
}

export async function createApp() {
    const secret = process.env.LOGIN_SESSION_SECRET
    const csrfSecret = process.env.CSRF_SECRET
    const idleTimeout = Number(process.env.IDLE_TIMEOUT || 30 * 60 * 1000)
    if (!secret || !csrfSecret) {
        throw new Error("LOGIN_SESSION_SECRET and CSRF_SECRET must be configured")
    }
    if (!Number.isFinite(idleTimeout) || idleTimeout <= 0) {
        throw new Error("IDLE_TIMEOUT must be a positive number of milliseconds")
    }

    const db = await getConnection()
    const schema = await fs.readFile(path.join(root, "auth/db/schema.sql"), "utf8")
    await db.exec(schema)

    const app = express()
    if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1)
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim()).filter(Boolean)
        : (process.env.BASE_URL ? [process.env.BASE_URL] : [])
    app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false, credentials: true }))
    app.use(express.json())
    app.use(cookieParser())
    app.use(session({
        secret,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 }
    }))
    app.use((req, res, next) => {
        if (!req.session.userId) return next()
        const now = Date.now()
        if (req.session.lastActivity && now - req.session.lastActivity > idleTimeout) {
            return req.session.destroy(error => {
                if (error) return next(error)
                res.clearCookie("connect.sid", cookieOptions)
                return res.status(401).json({ error: "Session expired" })
            })
        }
        req.session.lastActivity = now
        next()
    })

    const { generateToken, doubleCsrfProtection } = doubleCsrf({
        getSecret: () => csrfSecret,
        cookieName: "XSRF-TOKEN",
        cookieOptions,
        size: 64,
        ignoredMethods: ["GET", "HEAD", "OPTIONS"],
        getTokenFromRequest: req => req.headers["x-csrf-token"]
    })
    app.get("/api/csrf-token", (req, res) => {
        res.set("Cache-Control", "no-store").json({ csrfToken: generateToken(req, res) })
    })
    app.use("/api/auth", doubleCsrfProtection, authRouter)
    app.get("/me", async (req, res) => {
        res.set("Cache-Control", "no-store")
        if (!req.session.userId) {
            return res.status(401).json({ error: "Not authenticated" })
        }
        const user = await db.get(
            "SELECT id, username, email, role FROM user WHERE id = ?",
            [req.session.userId]
        )
        if (!user) {
            return req.session.destroy(error => {
                if (error) {
                    console.error("Failed to end session:", error)
                    return res.status(500).json({ error: "Failed to end session" })
                }
                res.clearCookie("connect.sid", cookieOptions)
                return res.status(401).json({ error: "Not authenticated" })
            })
        }
        res.json({ user })
    })
    app.use("/auth", express.static(path.join(root, "public/auth"), { index: false }))
    app.use((err, req, res, next) => {
        if (err.code === "EBADCSRFTOKEN") {
            return res.status(403).json({ error: "Invalid CSRF token." })
        }
        console.error("Request failed:", err)
        res.status(500).json({ error: "Internal server error" })
    })
    app.use(handleRoute)
    return app
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const port = Number(process.env.PORT || 8000)
    const app = await createApp()
    app.listen(port, () => {
        console.log(`Server running on port: ${port}`)
    })
}
