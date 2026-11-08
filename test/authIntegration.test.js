import assert from "node:assert/strict"
import test from "node:test"
import crypto from "node:crypto"
import bcrypt from "bcrypt"

process.env.LOGIN_SESSION_SECRET = "test-session-secret"
process.env.CSRF_SECRET = "test-csrf-secret"
process.env.DATABASE_PATH = ":memory:"
process.env.IDLE_TIMEOUT = "500"

const { createApp } = await import("../app.js")
const { getConnection } = await import("../auth/db/db.js")

test("Express serves the shop and maintains authenticated sessions", async t => {
    const app = await createApp()
    const db = await getConnection()
    const password = "Password1!"
    await db.run("INSERT INTO user (username, email, password) VALUES (?, ?, ?)", [
        "shopper", "shopper@example.com", await bcrypt.hash(password, 10)
    ])
    const server = app.listen(0)
    await new Promise(resolve => server.once("listening", resolve))
    t.after(async () => {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
        await db.close()
    })
    const base = `http://127.0.0.1:${server.address().port}`

    const home = await fetch(`${base}/`)
    assert.equal(home.status, 200)
    assert.match(await home.text(), /Echop/)
    assert.equal((await fetch(`${base}/auth/login.html`)).status, 200)
    assert.equal((await fetch(`${base}/auth/index.css`)).status, 200)
    assert.equal((await fetch(`${base}/api/products`)).status, 200)
    const anonymous = await fetch(`${base}/me`)
    assert.equal(anonymous.status, 401)
    assert.equal(anonymous.headers.get("set-cookie"), null)

    const csrfResponse = await fetch(`${base}/api/csrf-token`)
    const { csrfToken } = await csrfResponse.json()
    const csrfCookie = csrfResponse.headers.get("set-cookie").split(";")[0]
    const login = async () => fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            cookie: csrfCookie,
            "x-csrf-token": csrfToken
        },
        body: JSON.stringify({ email: "shopper@example.com", password })
    })
    assert.equal((await fetch(`${base}/api/auth/login`, { method: "POST" })).status, 403)
    const loginResponse = await login()
    assert.equal(loginResponse.status, 200)
    const sessionCookie = loginResponse.headers.get("set-cookie").split(";")[0]
    const me = await fetch(`${base}/me`, { headers: { cookie: sessionCookie } })
    assert.equal(me.status, 200)
    assert.equal(me.headers.get("cache-control"), "no-store")
    assert.deepEqual(await me.json(), {
        user: { id: 1, username: "shopper", email: "shopper@example.com", role: "basic" }
    })
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal((await fetch(`${base}/me`, { headers: { cookie: sessionCookie } })).status, 200)
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal((await fetch(`${base}/me`, { headers: { cookie: sessionCookie } })).status, 200)
    await new Promise(resolve => setTimeout(resolve, 600))
    const expired = await fetch(`${base}/me`, { headers: { cookie: sessionCookie } })
    assert.equal(expired.status, 401)
    assert.equal((await expired.json()).error, "Session expired")
    assert.match(expired.headers.get("set-cookie"), /connect\.sid=;/)
    assert.equal((await fetch(`${base}/me`, { headers: { cookie: sessionCookie } })).status, 401)

    const secondLogin = await login()
    assert.equal(secondLogin.status, 200)
    const secondCookie = secondLogin.headers.get("set-cookie").split(";")[0]
    await db.run("DELETE FROM user WHERE email = ?", ["shopper@example.com"])
    assert.equal((await fetch(`${base}/me`, { headers: { cookie: secondCookie } })).status, 401)

    const token = "verification-token"
    await db.run(
        "INSERT INTO pending_users (username, email, password, token, expires_at) VALUES (?, ?, ?, ?, ?)",
        ["newuser", "new@example.com", await bcrypt.hash(password, 10),
            crypto.createHash("sha256").update(token).digest("hex"), Math.floor(Date.now() / 1000) + 60]
    )
    const verification = await fetch(`${base}/api/auth/verify-email`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: csrfCookie, "x-csrf-token": csrfToken },
        body: JSON.stringify({ token })
    })
    assert.equal(verification.status, 200)
    const verifiedCookie = verification.headers.get("set-cookie").split(";")[0]
    const verified = await fetch(`${base}/me`, { headers: { cookie: verifiedCookie } })
    assert.equal(verified.status, 200)
    assert.equal((await verified.json()).user.username, "newuser")
})
