# Student Academic Record Management System (SAMS)

A web-based academic record management system for schools. Supports admin, teacher, and student roles.

## Stack

- Frontend: React 18, Vite, Tailwind CSS
- Backend: Node.js, Express, JWT auth
- Database: Supabase (Postgres)
- Hosting: Vercel (frontend) + Render (backend)

## Features

- Role-based access: Admin, Teacher, Student
- Student and teacher management
- Class and subject assignment
- Marks entry with Mid, Final, Quiz, Assignment breakdown — total auto-calculated
- Grade computation and academic reports
- Academic year and exam type management

## Project Structure

```
/
├── src/              # React frontend
├── backend/          # Express API server
├── database/         # SQL schema files
├── vercel.json       # Vercel frontend config
└── render.yaml       # Render backend config
```

## Local Development

1. Copy `.env.example` to `.env` and fill in your values
2. Copy `backend/.env.example` to `backend/.env` and fill in your values

Run the backend:

```bash
cd backend
npm install
npm start
```

Run the frontend:

```bash
npm install
npm run dev
```

## Deployment

### Database

Run `database/schema.supabase.complete.sql` in your Supabase SQL editor to set up the schema.

### Backend (Render)

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

Required environment variables:

```
DATABASE_URL=
JWT_SECRET=
CORS_ORIGIN=
NODE_ENV=production
PORT=5000
```

### Frontend (Vercel)

Deploy as a Vite project. Set one environment variable:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## Notes

- Frontend and backend are deployed separately
- After first deploy, create an admin account using `backend/scripts/bootstrap-admin.js`
- Change default credentials immediately after first login
