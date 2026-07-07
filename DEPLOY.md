# 🚀 Deploy — Vercel (frontend) + Render (backend)

No Docker needed. Frontend builds on Vercel, backend builds on Render, database is
MongoDB Atlas.

> ⚠️ **Before you start — MongoDB Atlas must work.**
> The connection string previously in `.env` failed authentication (`bad auth`).
> In Atlas → **Database Access**, confirm/reset the DB user's password, and in
> **Network Access** add `0.0.0.0/0` (allow from anywhere) so Render can connect.
> You need a **working** `mongodb+srv://…` string before the backend will start.

---

## Order of operations

1. Deploy the **backend on Render** → copy its URL (e.g. `https://box-office-science-api.onrender.com`).
2. Deploy the **frontend on Vercel** with that URL → copy the Vercel URL.
3. Go back to Render and set `ALLOWED_ORIGINS` to the Vercel URL → redeploy.

---

## 1) Backend → Render

- New → **Blueprint** → pick this repo (it reads `render.yaml`), **or** New → Web Service:
  - Root Directory: `backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Health Check Path: `/health`

**Environment variables (paste in Render):**

```
MONGODB_URI=mongodb+srv://<user>:<password>@the-box-office-science.ood2e7q.mongodb.net/?appName=The-Box-Office-Science
MONGODB_DB=boxoffice
SECRET_KEY=<generate-a-32-byte-hex-secret>
ALLOWED_ORIGINS=https://YOUR-APP.vercel.app
DEBUG=false
```

> - Replace `<user>:<password>` with your **working** Atlas credentials.
> - `SECRET_KEY` — generate one and paste it (never commit it):
>   `openssl rand -hex 32`  or  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
>   Use the **same** value for the frontend's `JWT_SECRET`.
> - `ALLOWED_ORIGINS` — put your real Vercel URL here (step 3). Comma-separate
>   multiple origins if needed. On first deploy you can temporarily set it to `*`.

---

## 2) Frontend → Vercel

- New Project → import this repo.
- **Root Directory: `frontend`**  ← important (this is a monorepo).
- Framework preset: **Next.js** (auto-detected). Build/output settings: leave default.

**Environment variables (paste in Vercel):**

```
NEXT_PUBLIC_API_URL=https://box-office-science-api.onrender.com
JWT_SECRET=<same-value-as-backend-SECRET_KEY>
NEXT_PUBLIC_APP_NAME=The Box Office Science
```

> - `NEXT_PUBLIC_API_URL` — your Render backend URL (no trailing slash).
> - `JWT_SECRET` — **must be identical** to the backend's `SECRET_KEY`, or the
>   middleware can't verify the session and every route bounces to `/login`.

---

## 3) Wire CORS back

After Vercel gives you a URL, set it on Render:

```
ALLOWED_ORIGINS=https://your-actual-app.vercel.app
```

Redeploy the backend. Done.

---

## Notes

- **Demo login:** `demo@boxofficescience.ai` / `Demo@1234` (auto-seeded on first
  backend boot, along with 18 sample films).
- **Render free tier** sleeps after ~15 min idle; the first request afterwards
  takes ~30–50s to wake. Not an error.
- **Secrets:** the `SECRET_KEY` above is freshly generated for this deploy. Rotate
  it if this file ever becomes public — and update both Render + Vercel together.
