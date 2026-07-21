# SPMS — Supervisor Frontend

React + Vite + TypeScript + Tailwind, built against the same backend as the
Coordinator frontend. Covers all 7 Supervisor screens from SCREENS.md, plus
the shared screens (auth, notifications, messages, account settings).

Verified before delivery: `tsc -b --noEmit` passes clean, and `vite build`
produces a working production bundle with zero errors (427 modules).

## Setup

```bash
npm install
npm run dev      # http://localhost:5173 (proxies /api and /uploads to :5000)
```

Run the backend alongside this. See `vite.config.ts` to change the proxy
target if your backend runs elsewhere.

```bash
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```

## Structure

Shares its architecture with the Coordinator frontend (same UI kit, same
`useForm` `update()` pattern, same auth/toast context, same Tailwind
config) — copied over and trimmed to only what a supervisor role can
actually call.

```
src/
  api/          projects.ts, chapters.ts, submissions.ts, feedback.ts,
                meetings.ts, tasks.ts - all new for this build. auth.ts and
                misc.ts (notifications/messages) are shared with Coordinator;
                the coordinator-only dashboard/activity/settings/report
                endpoints were removed from misc.ts since a supervisor token
                gets a 403 on those.
  types/        extended with Chapter, Task, ChapterSubmission, Feedback,
                Meeting - none of which the coordinator build needed
  pages/supervisor/  Dashboard, Projects, Project Detail, Chapter Review,
                Feedback Inbox, Meetings (list+detail), Task Monitoring
  pages/shared/      Messages here is a DIFFERENT implementation from the
                coordinator build - see below
```

## Screen-by-screen notes

- **Dashboard** is composed client-side from three calls (assigned projects,
  meetings, open feedback) — the backend has no single
  `GET /supervisor/dashboard` endpoint the way it does for coordinators.
  This was flagged as a known gap in SCREENS.md; if you want a real
  aggregate endpoint later, that's a small backend addition.
- **Chapter Review** is the most complex screen: PDF viewer (fetched as a
  blob with the auth token attached, since `<iframe src="...">` alone can't
  carry a Bearer header), a version selector across all submission
  versions, and approve/reject/request-revision actions that each open a
  comment modal (comment is required for request-revision, matching the
  backend's validation).
- **Messages** is intentionally different from the coordinator version: a
  supervisor can only message the students on their own assigned projects
  (built from `GET /projects/assigned`), rather than searching all users —
  the coordinator-only student/supervisor search endpoints aren't
  accessible with a supervisor token, so this avoids calling them at all
  rather than failing at runtime.
- **Project Detail → Messages tab** embeds the project's group chat
  directly (`POST/GET /messages/project/:id`), separate from the private
  1:1 Messages page in the sidebar.

## Known backend gaps (flagged, not silently worked around)

1. **Task Monitoring will 403.** `taskRoute.js` currently applies
   `router.use(protect, authorize("student"))` to the *entire* file,
   including the `GET /tasks` routes. The spec explicitly calls for
   supervisors to have read-only task visibility, but as the backend
   stands today, a supervisor token gets rejected. The frontend page
   detects this (catches the 403) and shows an explanation banner instead
   of a blank screen or a confusing generic error.

   **The fix** is a one-line change in `routes/taskRoute.js`: split the
   file so `GET /tasks` and `GET /tasks/:taskId` use
   `authorize("student", "supervisor")` while the write routes
   (create/update/delete/checklist/evidence) stay `authorize("student")`
   only. Happy to make that change if you want — just say the word.

2. **Chapter Review needs a submission id, not just a chapter id.** There's
   no backend endpoint like `GET /chapters/:id/latest-submission`, so this
   page can't resolve "the current submission for this chapter" on its
   own — it expects to already have a submission id (e.g. from a chapter
   list that also shows submission status). In a real deployment you'd
   want the chapter list to carry the latest submission id, or add a
   small backend endpoint for it.

## Known simplifications

- Meeting attendance can be marked "joined" one attendee at a time from
  the detail page; there's no bulk "mark all present" action.
- No calendar/grid view for meetings, just a list — matches what
  SCREENS.md called a nice-to-have, not a requirement.
