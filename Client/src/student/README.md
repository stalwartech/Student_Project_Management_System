# SPMS — Student Frontend

React + Vite + TypeScript + Tailwind, built against the same backend as the
Coordinator and Supervisor frontends. Covers all 8 Student screens from
SCREENS.md, plus the shared screens (auth, notifications, messages, account
settings).

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

Shares its architecture with the Coordinator and Supervisor frontends (same
UI kit, same `useForm` `update()` pattern, same auth/toast context, same
Tailwind config).

```
src/
  api/          projects.ts (my-project only), chapters.ts (read-only),
                tasks.ts (FULL CRUD - students own this entirely per the
                backend), submissions.ts (create/version/history, no
                approve/reject), feedback.ts (list + reply only), meetings.ts
                (list/get/join only)
  pages/student/     Dashboard, My Project, Chapter Workspace, Task Detail,
                Chapter Submission, Feedback, Meetings, Progress
  pages/shared/      Messages here is a THIRD different implementation -
                supervisor thread + project group chat, see below
```

## Screen-by-screen notes

- **Task Detail** is the one screen in this whole three-role build where the
  student has full CRUD (create/edit/delete tasks, checklist items, and
  evidence uploads) — matches the backend exactly, since `taskRoute.js` is
  `authorize("student")` throughout.
- **Chapter Submission** surfaces the most recent supervisor comment above
  the upload box whenever the latest version's status is
  `revision_requested`, per the spec's explicit requirement that students
  see what to fix before re-uploading.
- **Dashboard**'s "project health" badge (On Track / Slightly Behind / At
  Risk) is a client-side heuristic comparing elapsed-time-vs-deadline
  against `completionPercentage` — SCREENS.md flagged this as having no
  backend field, so this is a placeholder calculation, not authoritative.
  Replace it if a real backend field gets added.
- **Messages** is the student-specific version: a direct thread with their
  supervisor plus the project's group chat — no user search at all, since
  students only have one relationship to message (their assigned
  supervisor/project).

## Known backend gaps (flagged, not silently worked around)

1. **No way to resolve "chapter → its current submission."** There's no
   `GET /chapters/:id/latest-submission` (or similar) endpoint. Both
   **Chapter Submission** and the supervisor's **Chapter Review** page hit
   this: they can track a submission's version history *after* the student
   uploads in the current session (since create/addVersion return the new
   submission), but a fresh page load for an already-submitted chapter has
   no id to start from. Fixing this needs either a new backend endpoint or
   storing a `latestSubmission` ref on the Chapter model.

2. **No GET endpoint for a task's evidence.** `POST /tasks/:id/evidence`
   and `DELETE /tasks/:id/evidence/:fileId` exist, but there's no
   `GET /tasks/:id/evidence` to list what's already attached. The Task
   Detail page can only show evidence uploaded in the current browser
   session — a page refresh loses the gallery even though the files are
   still there in the database. This needs either a new endpoint or an
   `evidence: [ObjectId]` array added to the Task model.

Both are called out directly in the relevant page's code comments, not just
buried here.

## Known simplifications

- Checklist items can be checked off but not un-checked — the backend only
  exposes `PATCH /checklist/:id/complete`, no "uncomplete" action.
- Progress page computes checklist completion by fetching every chapter's
  tasks client-side (N+1 calls) rather than a single aggregate endpoint —
  fine at this scale, worth revisiting if a project has many chapters.
