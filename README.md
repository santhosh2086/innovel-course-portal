# Innovel LMS — React + Vite, Express and PostgreSQL

Course portal with course discovery, student learning area, payments, email OTP and Zoom class scheduling. The existing UI is unchanged in this deployment-preparation package.

## Repository layout

- `client/` — React + Vite frontend
- `server/` — Express API
- `server/schema.sql` — PostgreSQL schema
- `server/seed.js` — optional sample data seeder

## Run locally (Windows PowerShell)

1. Install Node.js LTS and PostgreSQL.
2. Create a database, then apply `server/schema.sql` using your PostgreSQL SQL client.
3. Copy `server/.env.example` to `server/.env` and fill in your own local database and service credentials. Never commit `.env`.
4. In terminal 1:

   ```powershell
   cd server
   npm install
   npm start
   ```

5. In terminal 2:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

The Vite development server proxies `/api` to `http://localhost:4000`.

## GitHub upload

Upload the contents of this folder to a GitHub repository. `node_modules`, `.env`, and build output are intentionally excluded. Keep the repository private if it contains non-public source code.

## Deployment outline

### 1. Neon PostgreSQL

- Create a PostgreSQL project in Neon.
- Run the SQL in `server/schema.sql` in the Neon SQL Editor.
- Copy the Neon connection string and set it as `DATABASE_URL` in Render. Keep it private.

### 2. Render backend

Create a Web Service connected to this repository. Set **Root Directory** to `server` (or the repository-relative path to this folder if the repository contains an enclosing folder). Use:

- Build command: `npm install`
- Start command: `npm start`

Add environment variables in Render from the keys listed in `server/.env.example`. Use newly generated production secrets and real service credentials. Do not set placeholders as values.

### 3. Vercel frontend

Import the same repository in Vercel and set **Root Directory** to `client`. Use build command `npm run build` and output directory `dist`. Add `client/vercel.json` and replace `YOUR-RENDER-SERVICE.onrender.com` with the actual Render service hostname before deploying; it forwards `/api/*` requests to the backend and supports SPA routes.

### 4. Verify production

Test course loading, sign up/login, email OTP, admin permissions, course purchase in Razorpay test mode, payment verification, and Zoom meeting creation. Check Render logs and browser DevTools if an API request fails. Switch to live payment keys only after end-to-end verification.

## Security

- Never commit `.env`, passwords, database URLs, JWT secrets, Razorpay secrets, Zoom secrets, or Gmail app passwords.
- If a credential has previously been shared or committed, rotate it at the provider. Removing it from the latest commit alone does not invalidate it.
- Do not use sample/demo passwords for production accounts.
