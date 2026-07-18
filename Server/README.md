# Student Project Management System — Backend (Rebuilt)

This is a full rebuild of your uploaded `models/` and `routes/` into a working
Express + MongoDB backend: fixed models, real controllers, wired routes,
JWT auth (access + refresh tokens), and local-disk file uploads via multer.

Verified before delivery: every file passes `node --check`, every model/
controller/route module `require()`s cleanly, and every one of the 21 route
files mounts on a real Express app with zero registration errors (the
original routes crashed on every single endpoint — see "What was broken" below).

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI and the JWT secrets at minimum
npm run dev             # or: npm start
```

MongoDB must be running and reachable at `MONGO_URI`. Uploaded files are
written to `/uploads/{photos,submissions,evidence,attachments}` and served
at `http://localhost:<PORT>/uploads/...`.

## Folder structure

```
config/db.js          Mongo connection
models/                13 fixed models + 2 new ones (ActivityLog, Settings)
middleware/             auth.js (protect/authorize/requireActivationToken),
                        upload.js (multer configs), errorHandler.js
utils/                  tokens, OTP, email, CSV parsing, activity logging,
                        notifications, allocation engine, report export
controllers/            one file per route file
routes/                 your 19 route files, fixed and wired + 2 new ones
uploads/                local file storage (gitignore this in your repo)
server.js               mounts everything
```

## What was broken in your uploads, and how it was fixed

### Models
- **Project.js** — used a bare `Schema` that was never imported (`ReferenceError`
  on load). Fixed to `mongoose.Schema.Types.ObjectId`.
- **Project.js** — `student` was a single ObjectId, which can't represent a
  Group project. Changed to `students: [ObjectId]`.
- **Project.js** — `academicSession` was a free-text String, so the
  duplicate-title-per-session rule and session-scoped queries couldn't work.
  Changed to a ref + compound unique index on `(title, academicSession)`.
- **Project.js** — no `status` or `completionPercentage`, both of which the
  spec says the system auto-generates. Added.
- **Project.js** — `isLocked` mixed `type: String` with boolean enum values.
  Fixed to a real Boolean.
- **Meeting.js / SupervisorLimit.js** — referenced model names (`'User'`,
  `'Project'`, `'Supervisor'`) that don't match what's actually registered
  (`'auth'`, `'project'`) or don't exist at all. `.populate()` would have
  silently returned `null`. Fixed everywhere.
- **User.js** — `phone`, `whatsapp`, `matric`, `staffId`, `title`, `cgpa`,
  `photo` were all schema-required on one shared collection, contradicting
  the spec (phone/WhatsApp optional; matric only for students; staffId/title
  only for supervisors). Moved role-specific requirements into a
  `pre('validate')` hook; added the missing `department` field.
- **Feedback.js** — referenced a `project_submission` model that doesn't
  exist anywhere. Renamed to `chapterSubmission`, pointing at the real
  `chapter_submission` model.
- **Message.js** — had no `sender`, no `content`, and no way to know which
  project or recipient a message belonged to. Added all three.
- **OTPModel.js** — `User` field was a free-text String instead of a ref.
  Fixed to `user: ObjectId ref 'auth'`.
- **Task.js** — had no checklist storage even though the routes expose
  `/tasks/:id/checklists`. Added an embedded `checklist[]` subdocument.
- **Chapter.js** — `Dealine` typo fixed to `deadline`.

### Routes (the big one)
**Every route in every one of your 19 files was missing its handler
function** (e.g. `router.post("/coordinator/academic-session")` with
nothing after the path) — this throws immediately on `require()` in real
Express, meaning the entire app would have crashed on startup, not just
individual endpoints. All handlers are now wired to real controllers.

Also fixed:
- **OTPRouts.js, studentManagemntRoute.js** — missing `module.exports`, so
  `require()` returned `undefined`.
- **notificationRoute.js** — `"/notification/notificationId"` was missing the
  `:` on the param (matched a literal string, not a route param) and was
  singular while every other path in the file is plural. Fixed to
  `/notifications/:notificationId`.
- **projectRoutes.js** — `"/project/filter"` was singular/inconsistent.
  Fixed to `/projects/filter`, and reordered before the generic
  `/projects/:projectId` route so Express doesn't try to match `filter` as an id.
- **meetingRoute.js** — had `POST .../attendance` but no `GET`, even though
  "View attendance" is an explicit Supervisor capability. Added.
- **supervisorManagementRoute.js** — had no route for "Edit supervisor
  information" or "View supervisor workload", both explicit spec items.
  Added `PATCH /coordinator/supervisors/:id` and
  `GET /coordinator/supervisors/:id/workload`.
- **projectManagementRoute.js** — was an empty file (just boilerplate, zero
  routes) and appears to be an abandoned duplicate of `projectRoutes.js`.
  Dropped rather than regenerated — let me know if it was meant to hold
  something distinct.

### New files (spec required these, nothing existed for them)
- **models/ActivityLog.js**, **controllers/activityController.js** — backs
  the Coordinator's activity-monitoring feed (`activityRoute.js` had routes
  but no model to read from).
- **models/Settings.js**, **controllers/settingsController.js** — backs the
  global project/supervisor/student limit + auto-allocation toggle
  (`settingsRoute.js` had routes but no model).
- **models/Message.js fields + controllers/messageController.js +
  routes/messageRoute.js** — real-time chat was fully spec'd (private +
  project-group, attachments, read receipts) but had no route at all.
- **controllers/reportController.js + routes/reportRoute.js +
  utils/exportHelpers.js** — the spec explicitly lists exportable Student /
  Supervisor / Project / Session / Completion / Meeting / Feedback reports in
  PDF / Excel / CSV. Implemented via `exceljs` and `pdfkit`
  (`GET /api/reports/:type?format=csv|excel|pdf`).
- **utils/allocationEngine.js** — implements the soft-limit check used on
  manual supervisor assignment (warns, still allows) versus the hard-limit
  check used during Smart Auto Allocation (skips if exceeded), as two
  genuinely different behaviors per the spec.

## Business logic decisions I made that you should sanity-check

- **Auth**: JWT access token (short-lived, in response body) + refresh token
  (httpOnly cookie, scoped to `/api/auth/refresh-token`), per your answer.
- **Login identifier**: students log in with matric + password; supervisors/
  coordinators with email + password — handled by one `/auth/login` endpoint
  that detects which based on whether the identifier contains `@`.
- **Activation / password reset flow**: OTP verification returns a
  short-lived "activation token" (separate JWT, separate secret) that must
  be presented to `create-password` / `reset-password`. This avoids
  requiring a user to log in before they have a password.
- **Deleting a project**: I interpreted "before students begin work" as "no
  chapters exist yet for this project." If you meant something narrower or
  broader (e.g. no submissions yet, regardless of chapters), tell me and
  I'll adjust the check in `projectController.deleteProject`.
- **File storage**: local disk under `/uploads`, per your answer — note this
  won't survive redeploys on most hosting platforms (Heroku, Render, etc.)
  without a persistent volume. Worth revisiting before you deploy.
- **Auto Allocation**: a straightforward greedy allocator (first project with
  capacity + supervisor under their hard limit). It's a reasonable starting
  point but not a true optimizer — if you want something smarter (e.g.
  balancing load evenly, matching by department), that's a bigger
  conversation and I'd want details on what "smart" means to you here.

## Not implemented (flagging rather than guessing)

- Email sending is wired through `nodemailer` but falls back to console
  logging if `SMTP_HOST`/`SMTP_USER` aren't set in `.env` — so the app runs
  end-to-end without a real mail provider, but you'll want to plug one in
  before this is user-facing.
- Google Meet integration: `meetingURL` is stored as a plain string the
  caller supplies. Actually generating a Meet link via Google's Calendar API
  is a separate integration (OAuth + API credentials) I didn't build, since
  it wasn't part of what you uploaded.
