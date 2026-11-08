# EShop

Install dependencies with `npm install`. Copy `.env.example` to `.env`, replace
both secrets with different long random values, then run `npm start` and open
<http://localhost:8000>. The login and registration pages are available at
`/auth/login.html` and `/auth/signup.html`.

Product data is loaded from `data/data.json` and cached in memory while the server runs. Restart the server after changing that file.

## Authentication

The Express server exposes the original authentication endpoints under
`/api/auth` and issues a CSRF token at `/api/csrf-token`. Send that token in the
`X-CSRF-Token` header and include cookies for authentication requests.
`GET /me` returns a `user` object with `id`, `username`, `email`, and `role` for
an authenticated session, or 401 if the session is missing, expired, or its
user no longer exists. The session expires after `IDLE_TIMEOUT` milliseconds
without activity (30 minutes by default); its cookie also expires after 24
hours. Sessions are held in memory and are lost on server restart. The default
memory store is for development only; configure a persistent session store
before deploying to production.

Accounts are stored in the ignored `login.db` in the project root.
Set `DATABASE_PATH` to use another SQLite file; for example, set it to
`./Login/login.db` to use the database from the copied login project. Existing
database files are not copied or modified during installation.

Email verification and password reset require either Brevo credentials
(`BREVO_API_KEY` and `BREVO_FROM_EMAIL`) or SMTP settings (`EMAIL_HOST`,
`EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS`). `ADMIN_EMAILS` is an optional
comma-separated list. `CORS_ORIGIN` accepts a comma-separated allowlist.
Set `BASE_URL` to the public application URL for email links. For HTTPS
production deployments set `NODE_ENV=production`; set `TRUST_PROXY=1` only
when running behind one trusted reverse proxy.

The copied change-password page has no corresponding endpoint in the original
login project and is not currently functional; use the password-reset flow.
