# Student PMS client applications

From this directory, start every client portal with one command:

```bash
npm run dev
```

Then open the application at `http://localhost:5172`. Every portal is served from this same port:

- Coordinator: `http://localhost:5172/coordinator/login`
- Student: `http://localhost:5172/student/login`
- Supervisor: `http://localhost:5172/supervisor/login`

The command also starts the backend and proxies `/api` and `/uploads`, so all browser activity stays on port `5172`. Client-to-server settings are in `Client/.env`; the default API target is `http://127.0.0.1:5000`. The backend still needs a valid `Server/.env` and access to its MongoDB database.

## Production deployment

Vite's proxy only runs in development. Before making a production client build,
set `VITE_API_ORIGIN` in the hosting provider's build environment to the public
origin of the API (for example, `https://api.example.com`), without `/api` at
the end. Set `CLIENT_URL` in the server environment to the exact public client
origin (for example, `https://app.example.com`) and use HTTPS. This prevents
the production client from requesting `/api` from the static frontend host.

The included `vercel.json` and `public/_redirects` files make direct React
Router portal URLs resolve to the app on Vercel and Netlify, respectively.

To create production builds for all four frontends, run:

```bash
npm run build
```
