# Student PMS client applications

From this directory, start every client portal with one command:

```bash
npm run dev
```

Then open the launcher at `http://localhost:5172`. It links to the three role portals:

- Coordinator: `http://localhost:5173`
- Student: `http://localhost:5174`
- Supervisor: `http://localhost:5175`

The command also starts the backend at `http://localhost:3021`. Each portal proxies `/api` and `/uploads` to it, so API-backed features work without a second terminal. The backend still needs a valid `Server/.env` and access to its MongoDB database.

To create production builds for all four frontends, run:

```bash
npm run build
```
