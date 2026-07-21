# SPMS — Coordinator Frontend

React + Vite + TypeScript + Tailwind, built against the backend from the
earlier deliverable. Covers every Coordinator screen from SCREENS.md, plus
the shared screens coordinators also use (auth, notifications, messages,
account settings).

Verified before delivery: `tsc -b --noEmit` passes clean, and `vite build`
produces a working production bundle with zero errors (1,234 modules).

## Setup

```bash
npm install
npm run dev      # starts on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`
(see `vite.config.ts`) — run the backend from the earlier deliverable
alongside this, no `.env` needed for local dev. Change the proxy target if
your backend runs elsewhere.

```bash
npm run build     # type-checks + production build to dist/
npm run preview   # serve the production build locally
```

## Structure

```
src/
  api/           one file per backend resource - client.ts handles the
                 access-token refresh flow, everything else is typed
                 request wrappers around your exact endpoints
  types/         TypeScript types matching the backend's response shapes
  context/       AuthContext (session/login state), ToastContext (banners)
  hooks/useForm.ts   generic form state + `update(key)` helper, per your
                 established convention - every form in the app uses this
                 instead of a one-off setter per field
  components/ui/     Button, FormField, Modal, ConfirmDialog, Table,
                 Pagination, Badge, StatCard, Dropzone, etc. - all
                 prop-driven with a usage comment above each component
  components/layout/ Sidebar, Topbar (with live notification bell),
                 DashboardLayout, ProtectedRoute
  pages/auth/        Login, Activate (3-step), Forgot Password (3-step)
  pages/shared/      Account Settings, Notifications, Messages
  pages/coordinator/ Dashboard, Academic Sessions, Students (list+detail),
                 Supervisors (list+detail+workload), Bulk Import, Projects
                 (list+detail), Auto Allocation, Activity Log, Reports,
                 Settings
```

## Screen-by-screen notes

- **Bulk Import** renders the full four-part import summary (imported /
  duplicates / invalid / missing) exactly as the backend returns it, plus
  the required-columns reference panel from the spec.
- **Project Detail → Members tab** implements the conflict-resolution flow:
  assigning a student who's already on another project surfaces a
  Keep/Reassign/Skip choice per student, matching the backend's `force`
  parameter exactly.
- **Auto Allocation** enforces preview-before-commit at the UI level — the
  "Confirm & run" button doesn't exist until a preview has been fetched.
- **Supervisor Detail → Workload tab** shows the soft-limit warning state
  and lets you set a per-supervisor limit override, separate from the
  global default on the Settings page.
- **Reports** downloads are fetched with the auth token attached and saved
  as a blob (a plain `<a href>` won't carry the Bearer token these
  endpoints require).

## Known simplifications / next steps

- **Messages** only supports private (1:1) conversations from the
  coordinator side — there's no "list all my conversations" endpoint on
  the backend yet, so this page searches for a person and opens/starts a
  thread rather than showing an inbox. If you want a true inbox view,
  that needs a new backend endpoint to list a user's distinct conversation
  partners.
- **Activity Log** pagination is Previous/Next only, not numbered pages —
  the `GET /activities/system` endpoint doesn't return a total count.
- No dedicated 404 or global error boundary page yet — unmatched routes
  currently redirect to the dashboard.
- Bundle is a single ~700KB JS chunk (unminified concern only — gzip is
  ~200KB). Fine for this scope; revisit with route-based code splitting
  (`React.lazy`) if the app grows significantly.
- Auth token is kept in memory (not localStorage) by design, matching the
  refresh-token-in-httpOnly-cookie pattern from the backend — this means a
  hard page refresh always does one silent refresh call before the app is
  usable, which is expected, not a bug.
