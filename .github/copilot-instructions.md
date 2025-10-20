<!-- .github/copilot-instructions.md
   Purpose: short, actionable guidance to help AI coding agents be immediately productive in this repo.
   Keep this file small (20-50 lines) and focused on discoverable, repo-specific patterns.
-->

# Repo primer for AI agents

- Project type: React (v19) single-page app scaffolded with Vite. Entry: `src/main.jsx` -> `src/App.jsx`.
- Build / dev commands: `npm run dev` (vite dev server), `npm run build` (production build), `npm run preview` (serve built assets). See `package.json`.

- Auth & routing: client-side routing with `react-router-dom` (v7). Protected routes use `src/components/PrivateRoute.jsx` which checks a `user` object from `localStorage` and compares `user.role` against `allowedRoles`.

- Data layer: Supabase (JS client). The project centralizes the client in `src/supabaseClient.js` and some admin scripts (`createAuthUsers.js`, `updateAuthUsers.js`) contain service keys — treat these as sensitive when editing. Use the exported `supabase` instance for DB queries and auth calls.

- Conventions & patterns to follow:
  - All pages/components are under `src/` with `/admin` and `/client` subtrees. Keep UI and routes consistent with `App.jsx`.
  - Database queries use Supabase table joins and column selection strings (see `src/admin/AdminEvents.jsx` for examples). Preserve `.select(...)` shape when editing queries to avoid breaking expected data structure.
  - Local user session is stored as JSON in `localStorage` under key `user`. Components read `user?.role` for access control.
  - CSS is colocated in `styles/` siblings, e.g., `src/admin/styles/AdminEvents.css` and imported at top of components.

- Files that exemplify key behavior (reference these when changing patterns):
  - Routing & role-based access: `src/App.jsx`, `src/components/PrivateRoute.jsx`
  - Supabase client & scripts: `src/supabaseClient.js`, `createAuthUsers.js`
  - Admin UI & data loading: `src/admin/AdminEvents.jsx`, `src/admin/AdminLayout.jsx`
  - Document generation utilities: `src/admin/utils/eventNotices.js` (uses jsPDF, docx, file-saver)

- Quick coding rules for agents:
  1. Do not commit Supabase service keys or rotate them without human confirmation — these files exist and are likely for local/dev use only.
  2. Prefer using the shared `supabase` import instead of creating new clients.
  3. Match existing date/locale formatting (`bg-BG`) when editing event text or export utilities.
  4. When changing routes, update `App.jsx` and check `AdminLayout` / `UserLayout` links.

- Debugging & testing tips:
  - Run `npm run dev` to start the app locally (Vite with HMR). On Windows PowerShell use: `npm run dev`.
  - Inspect network/console for Supabase errors; most DB calls surface `error` objects which are logged to console in current code.

If anything here is unclear or you want more detail (tests, linting rules, or environment setup), tell me which area to expand.
