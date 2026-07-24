# Student PMS client applications

From this directory, start every client portal with one command:

```bash
npm run dev
```

Then open the application at `http://localhost:5172`. Every portal is served from this same port:

- Coordinator: `http://localhost:5172/coordinator/login`
- Student: `http://localhost:5172/student/login`
- Supervisor: `http://localhost:5172/supervisor/login`

The command also starts the backend and proxies `/api` and `/uploads`, so all browser activity stays on port `5172`. The backend still needs a valid `Server/.env` and access to its MongoDB database.

To create production builds for all four frontends, run:

```bash
npm run build
```
