# Student Academic Record Management System

SAMS is a React and Express application configured to run against Supabase Postgres while keeping the existing custom backend API and role-based auth flow.

## Stack

- Frontend: React 18, Vite, Tailwind CSS
- Backend: Node.js, Express, JWT, bcrypt
- Database: Supabase Postgres

## What Changed

- Replaced the backend database driver path with PostgreSQL-compatible access
- Added Supabase-ready backend environment configuration
- Added a Postgres schema at `database/schema.supabase.sql`
- Kept the existing Express routes, JWT auth, and role logic
- Preserved the one-time admin bootstrap command

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- A Supabase project with database access

## Install

Frontend:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

## Environment Configuration

Frontend:

1. Copy `.env.example` to `.env`
2. Set `VITE_API_URL`

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

Backend:

1. Copy `backend/.env.example` to `backend/.env`
2. Replace the placeholder `DATABASE_URL` with your Supabase Postgres connection string

Required backend variables:

```env
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.zggitbfdoxpsoummthcp.supabase.co:5432/postgres
PORT=5000
NODE_ENV=production
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters_long
CORS_ORIGIN=http://localhost:5173
```

Notes:

- Use the Supabase database password and direct Postgres connection string from your Supabase project settings
- `JWT_SECRET` must be at least 32 characters long
- Do not commit populated `.env` files

## Supabase Database Setup

Open the Supabase SQL Editor and run the contents of:

[`database/schema.supabase.sql`](c:\Users\abdik\3D Objects\Student Academic Record Management up - Copy\database\schema.supabase.sql)

This creates the core tables and reference data required by the current app runtime.

## Bootstrap the First Admin

After the schema is created, run:

```bash
cd backend
npm run bootstrap-admin -- --username admin --password "ReplaceWithAStrongPassword!" --name "System Administrator" --email admin@example.com
```

## Run the Application

Start the backend:

```bash
cd backend
npm start
```

Start the frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## Health Check

When the backend is running:

```bash
http://localhost:5000/health
```

Expected response:

```json
{"status":"OK","message":"Server is running"}
```

## Important Limitations

- This migration keeps your custom Express auth. It does not switch the app to Supabase Auth.
- You still need the actual Supabase Postgres password to connect the backend.
- The legacy MySQL schema file remains in the repo only as historical reference. Use `database/schema.supabase.sql` for Supabase.

## Verification Checklist

- Backend starts with a valid Supabase `DATABASE_URL`
- Frontend build passes with `npm run build`
- Admin bootstrap succeeds
- Admin login works through the existing backend API
- Protected routes still enforce roles

## Troubleshooting

- If backend startup fails, check `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN`
- If the backend cannot connect, verify your Supabase database password and host
- If inserts fail on first setup, confirm you ran `database/schema.supabase.sql` in Supabase SQL Editor
