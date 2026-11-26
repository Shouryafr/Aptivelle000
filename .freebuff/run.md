# Aptivelle dev setup (worktree)

## 1. Reproduce artifacts (fresh checkout)

The repository stores only the DB schema and seed in source. On first checkout you need:

- **Dependencies**: `npm install` at the repo root (workspaces: `backend`, `frontend`).
- **Database file**: The SQLite DB `backend/prisma/dev.db` and its journal are gitignored. The project ships a pre-seeded DB in the main checkout, so copy it from the main checkout if missing:
  - Copy `backend/prisma/dev.db` (and `dev.db-journal` if present) from the main checkout into this worktree's `backend/prisma/` folder.
- **Env file**: Only `backend/.env` is needed at runtime; it's gitignored. Copy it from the main checkout into this worktree's `backend/.env`. The API uses `API_PORT=4000` (from `backend/.env`); the web dev server in THIS worktree runs on **5174**, not the 5173 default — see [Ports](#ports).

Do NOT commit these copied files; they remain gitignored.

## 2. Run the dev servers

The repo root `package.json` defines `npm run dev`, which starts both processes concurrently:

- **API**: `npm run dev --workspace backend` → `node --watch src/index.js` (port from `backend/.env`: `API_PORT=4000`).
- **Web**: `npm run dev --workspace frontend` → `vite` (port from `frontend/vite.config.js`: 5173 default, **5174 in this worktree** — see [Ports](#ports); `/api` proxied to `http://localhost:4000`).

Start both with one command from the repo root:

```powershell
npm run dev
```

Or start them separately if you only need one:

```powershell
npm run dev:frontend   # Vite only (5173 default / 5174 in this worktree)
npm run dev:backend    # API only (port 4000)
```

When the preview dies after an app restart, the two servers may not die together (the detached
parent tree can be torn down while the API keeps running). Check the listeners on 4000/5174
before restarting: if only the frontend is gone, start the frontend alone rather than
`npm run dev`, which would otherwise try to bind 4000 again.

### Health check (no browser needed)

`npm run test:smoke` logs in as each of the three demo accounts (`student@` / `faculty@` /
`recruiter@aptivelle.in`, password `demo1234`) and asserts that each role's dashboard really returns
seeded data. It defaults to `http://127.0.0.1:5174`, so the Vite `/api` proxy is covered as well; set
`SMOKE_BASE_URL=http://127.0.0.1:4000` to talk to the API directly. It uses Node's built-in test
runner, so it needs no extra dependencies. A failure says which of the three things broke: nothing
listening on the origin, a different server behind the port (`/api/health` must answer with our
`{"message":"Endpoint not found."}` 404), or a demo account/dashboard whose seeded data is missing.

### Detached preview launch (what the Preview tab is registered against)

The Preview tab is registered against the **Vite process** (`http://127.0.0.1:5174`), with the API
running as a companion process beside it. Both are started detached on Windows with PowerShell so
they outlive the conversation; `npm run dev` is not used because the Vite port must be pinned to
5174, which the nested `npm:dev:frontend` script does not forward reliably.

```powershell
# 1) API — node --watch is the actual watcher; its child is the server on 4000
$p=(Start-Process -FilePath 'node.exe' -ArgumentList '--watch','src/index.js' `
  -WorkingDirectory '<repo>\backend' `
  -RedirectStandardOutput '<repo>\.freebuff\preview-api.log' `
  -RedirectStandardError  '<repo>\.freebuff\preview-api.log.err' `
  -WindowStyle Hidden -PassThru).Id; $p

# 2) WEB — Vite straight from the hoisted install, pinned to 5174
$p=(Start-Process -FilePath 'node.exe' `
  -ArgumentList '<repo>\node_modules\vite\bin\vite.js','--port','5174','--strictPort','--host','127.0.0.1' `
  -WorkingDirectory '<repo>\frontend' `
  -RedirectStandardOutput '<repo>\.freebuff\preview-fe.log' `
  -RedirectStandardError  '<repo>\.freebuff\preview-fe.log.err' `
  -WindowStyle Hidden -PassThru).Id; $p
```

Notes that cost time to rediscover:

- `-WorkingDirectory` is required for both: the API loads `backend/.env`, and Vite resolves its
config/root from `frontend/`.
- stdout and stderr must be **different** files, and the launching shell command hangs on the
redirected handles — write the pid to a file in the same command so it survives the timeout.
- Register the preview with the Vite pid. The API pid must be killed/started separately.
- `node --watch` re-reads files under `node_modules` (this repo lives in OneDrive), so the API logs
`Change detected … Restarting` on its own. A request that lands inside that restart window returns
`500` in the UI; reload once the log shows `Aptivelle API running → http://localhost:4000`.

### Choosing the ports

Both ports can be overridden at launch, so a worktree can coexist with anything else already
listening on the defaults:

- **API**: `API_PORT` wins over `backend/.env` (dotenv does not overwrite existing env vars),
e.g. `API_PORT=4001 npm run dev:backend`.
- **Web**: the Vite `/api` proxy target follows `VITE_API_PORT` (defaults to `4000`), e.g.
`VITE_API_PORT=4001 npm run dev:frontend`. Set both to the same value whenever 4000 is taken.

To pass an env var to the detached PowerShell launcher, set it on the PowerShell process first —
`Start-Process` children inherit it:

```powershell
$env:VITE_API_PORT="4001"; (Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev:frontend" -WindowStyle Hidden -PassThru).Id
```

Always check the listeners before starting (`netstat -ano | Select-String ':4000|:5174'`): port 4000 is
sometimes occupied by an unrelated app, which silently breaks `/api/...` calls instead of erroring.

Ask the proxy a question to be sure it reaches *our* API: `curl http://127.0.0.1:5174/api/health`
returns our JSON 404 (`{"message":"Endpoint not found."}`) because only `/health` is mounted at the
root — a `404` from a *different* app would not look like that. `curl http://127.0.0.1:4000/health`
must answer `{"status":"ok","service":"aptivelle-api",…}`.

### Troubleshooting

Right after `npm run dev` starts, the backend takes a couple of seconds to accept connections.
Requests made in that window can surface as `500` in the browser plus a Vite log line like
`http proxy error: /api/...` / `ECONNREFUSED` / `ECONNRESET`. This is a startup race, not a code bug —
reload the page once the log shows `Aptivelle API running → http://localhost:<port>`.

If **every** `/api/...` call returns `404` with a JSON body like `{"error":"Not found"}` (note: our
API returns `{"message":"Endpoint not found."}` and serves `/health`), the frontend proxy is not
talking to our API — another process owns port 4000. Confirm with
`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'ProcessId = <pid>' | Select-Object CommandLine"`,
then run the API on a free port and restart Vite with `VITE_API_PORT` set to match.

### Ports

- Frontend dev server: **5174** in this worktree. `frontend/vite.config.js` still defaults to 5173,
which on this machine can be taken by an unrelated app (`…\Desktop\SentinelGate`) bound to
`[::1]:5173`. That binding is IPv6-loopback-only, so binding 5173 anyway "succeeds" on
`0.0.0.0:5173` while `http://localhost:5173` resolves to `::1` and serves the **wrong app**. Never
share 5173 with it: pass `--port 5174 --strictPort` (and `--host 127.0.0.1`) as shown above. Note
that SentinelGate is not always running, so 5173 may *appear* free — 5174 stays the safe choice
regardless.
- Backend API: **4000** (from `backend/.env`); it binds `0.0.0.0` + `::`, so `localhost:4000` — the
Vite proxy target — is ours.

The Vite config proxies `/api` to the backend, so the frontend calls `/api/...` and they reach the backend.

### Architecture notes

- Frontend is a React + Vite app in `frontend/` (entry: `frontend/src/main.jsx`).
- Backend is an Express app in `backend/src/index.js`, serving REST under `/api`.
- The frontend builds to `frontend/dist/` via `npm run build`.
- The database is SQLite at `backend/prisma/dev.db`, managed by Prisma.
