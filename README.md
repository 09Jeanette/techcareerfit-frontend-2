# TechCareerFit frontend

React + Vite frontend for TechCareerFit: a light, animated, mobile-friendly UI for explainable ATS analysis,
learning roadmaps, application tracking, a career journal, market insights and an admin workspace.

It talks to the [TechCareerFit API](../techcareerfit-backend) over REST with a bearer token.

## Run locally

```bash
npm install
cp .env.example .env      # set VITE_API_URL to your API, e.g. http://localhost:8000
npm run dev               # http://localhost:5173
```

## Build

```bash
npm run build             # output in dist/
npm run preview
```

## Environment

| Name | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the API, without a trailing slash. Read at **build time**. |

## Deploy on Render

**Option A, static site (simplest):**
1. New **Static Site** from this repo.
2. Build command `npm install && npm run build`, publish directory `dist`.
3. Add `VITE_API_URL` under Environment.

**Option B, Docker (matches the current setup):**
1. New **Web Service**, runtime Docker.
2. Add `VITE_API_URL` as an environment variable **and** as a Docker build argument, because Vite reads it at build time.

Routing uses the URL hash (`/#home`, `/#report/<id>`), so no server rewrite rules are needed.
Remember to add the frontend URL to the API's `CORS_ORIGINS`.

## Structure

```
src/
  main.jsx, App.jsx        entry point and hash router with auth guard
  auth.jsx                 login, register, logout, current user
  lib/api.js               fetch wrapper (token, errors, 401 handling)
  lib/pdf.js               two-page PDF report (jsPDF)
  lib/format.js, router.js helpers
  components/              AppShell (sidebar, top bar, tab bar), Icon, shared UI (Ring, Field, Modal, Popover, Toast)
  pages/                   Landing, AuthPage, Home, Analyse, Report, Roadmap, Applications, ApplyForm,
                           ApplicationDetail, Market, Journal, Profile, Admin
  styles/                  base, components, motion (animations), landing, auth
  assets/                  hero and roadmap illustrations
```

## Notes

- Animations respect the operating system's "reduce motion" setting.
- Notification read state is stored in the browser (localStorage); notifications themselves come from `GET /notifications`.
- Admin pages are shown only to users whose role is `admin` (set `ADMIN_EMAILS` on the API).
