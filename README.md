# Student Academic Record Management System

SAMS is set up for a split deployment:

- Frontend on Vercel
- Backend on Render
- Database on Supabase Postgres

This keeps your React app simple on Vercel and avoids forcing the Express backend into Vercel serverless functions.

## Stack

- Frontend: React 18, Vite, Tailwind CSS
- Backend: Node.js, Express, JWT, bcrypt
- Database: Supabase Postgres
- Hosting: Vercel + Render

## Deployment Files Included

- [`vercel.json`](c:\Users\abdik\3D Objects\Student Academic Record Management up - Copy\vercel.json) for the frontend
- [`render.yaml`](c:\Users\abdik\3D Objects\Student Academic Record Management up - Copy\render.yaml) for the backend
- [`database/schema.supabase.complete.sql`](c:\Users\abdik\3D Objects\Student Academic Record Management up - Copy\database\schema.supabase.complete.sql) for one-shot Supabase setup

## 1. Supabase Setup

Open the Supabase SQL Editor and paste:

[`database/schema.supabase.complete.sql`](c:\Users\abdik\3D Objects\Student Academic Record Management up - Copy\database\schema.supabase.complete.sql)

Temporary seeded admin:

- Username: `admin`
- Password: `Admin@123456`

Change that password after first login.

## 2. Backend Deployment on Render

Create a new Render Web Service from this repo.

Render is already prepared to use:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

Set these environment variables in Render:

```env
DATABASE_URL=postgresql://postgres:YOUR_SUPABASE_DB_PASSWORD@db.zggitbfdoxpsoummthcp.supabase.co:5432/postgres
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters_long
CORS_ORIGIN=https://your-frontend-project.vercel.app
NODE_ENV=production
PORT=5000
```

After deploy, copy the backend URL, for example:

```text
https://sams-backend.onrender.com
```

Check:

```text
https://sams-backend.onrender.com/health
```

## 3. Frontend Deployment on Vercel

Deploy the repo to Vercel as a Vite frontend.

Set this environment variable in Vercel:

```env
VITE_API_URL=https://your-backend-service.onrender.com/api
```

Example:

```env
VITE_API_URL=https://sams-backend.onrender.com/api
```

Then redeploy the frontend.

## 4. Local Development

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Backend `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_SUPABASE_DB_PASSWORD@db.zggitbfdoxpsoummthcp.supabase.co:5432/postgres
PORT=5000
NODE_ENV=development
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters_long
CORS_ORIGIN=http://localhost:5173
```

Run backend:

```bash
cd backend
npm install
npm start
```

Run frontend:

```bash
npm install
npm run dev
```

## 5. Verification

- Supabase schema runs successfully
- Render backend starts and `/health` returns OK
- Vercel frontend uses the Render backend URL through `VITE_API_URL`
- Admin login works with the seeded admin
- Protected routes work after login

## Important Notes

- Vercel does not automatically run `backend/server.js`
- The frontend and backend must be deployed separately in this setup
- The backend needs the Supabase Postgres password, not just the project URL
- If login fails in production, first verify Render env vars and `CORS_ORIGIN`
