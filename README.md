# 🛒 Grocery Sales PWA

A mobile-first Progressive Web App (built for iPhone / Safari standalone) that turns
your **2026 Sales Master** spreadsheet into an interactive app, syncing two-way with
Google Sheets. Month tabs (`Jan…Dec`) mirror your workbook; data entry, dashboards,
and offline capture all live on your Home Screen.

```
┌──────────── iPhone (PWA) ────────────┐        ┌──── Google ────┐
│ React + Tailwind  ·  IndexedDB outbox │  ⇄    │  Apps Script    │  ⇄   Google Sheet
│ (offline-first, sync queue)           │ https │  Web App (auth) │      (Jan…Dec tabs)
└───────────────────────────────────────┘        └────────────────┘
```

The React bundle holds **no Google credentials**. All Sheet access goes through a
Google Apps Script Web App that runs on Google's servers under *your* account.

---

## What's inside

| Feature | Where |
| --- | --- |
| **Dashboard** — KPI cards, payment-split donut, daily bar chart, best/worst day | `src/pages/Dashboard.jsx` |
| **Quick Entry** — single-hand form, prefilled today, live `Total / Salon / Net` | `src/pages/Entry.jsx` |
| **Monthly Log** — per-day list, tap-to-edit bottom sheet, delete | `src/pages/MonthLog.jsx` |
| **Month tabs** — swipeable `Jan…Dec` selector | `src/components/MonthTabs.jsx` |
| **Sync pill** — Synced / Syncing… / Offline · saved / Retry pending | `src/components/SyncPill.jsx` |
| **Offline queue** — IndexedDB outbox, auto-replay on reconnect | `src/db/idb.js`, `src/sync/syncEngine.js` |
| **iOS install tutorial** — Share ▸ Add to Home Screen modal | `src/components/InstallPrompt.jsx` |
| **Business logic** — Total / Salon Total / Net Profit (shared client+server) | `src/lib/calc.js`, `apps-script/Code.gs` |
| **Google Sign-In gate** — locked to one email, verified server-side | `src/auth/googleAuth.js`, `src/components/SignInGate.jsx` |
| **Secure backend** | `apps-script/Code.gs` |

### Business rules (identical client & server)
```
TOTAL SALES = Cash + Online/UPI + Card Machine
Salon Total = Salon Cash + Salon Online
NET PROFIT  = TOTAL SALES + Salon Total − Expenses − To Suppliers
```

---

## Setup

### 1 · Put the workbook in Google Sheets
Upload `2026_Sales_Master.xlsx` to Google Drive and open it as a Google Sheet
(File ▸ Save as Google Sheets). Keep the tab names exactly: `📊 Summary`, `Jan`…`Dec`.

### 2 · Create a Google Sign-In client (locks the app to your account)
1. Go to **Google Cloud Console ▸ APIs & Services ▸ Credentials**.
2. (First time) configure the **OAuth consent screen** → *External* → add your
   email as a **Test user** (no verification/publishing needed for personal use).
3. **Create Credentials ▸ OAuth client ID ▸ Web application**.
4. Under **Authorized JavaScript origins** add every origin the app runs on:
   - `http://localhost:5173` (local dev)
   - `https://<you>.github.io` (GitHub Pages — origin only, no path)
5. Copy the **Client ID** (`…apps.googleusercontent.com`).

### 3 · Deploy the backend (Apps Script)
1. In the Sheet: **Extensions ▸ Apps Script**.
2. Replace the default file with `apps-script/Code.gs` from this repo.
3. Set `GOOGLE_CLIENT_ID` (from step 2) and `ALLOWED_EMAIL`
   (`brownlegend0001@gmail.com`).
4. **Deploy ▸ New deployment ▸ Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**  ← access is enforced by Sign-In, not this setting
5. Copy the **/exec URL**. (Quick test: open `<url>?action=ping` → `{"ok":true,...}`.
   Other actions return `Sign-in required` without a token — that's correct.)

### 4 · Configure & run the app locally
```bash
npm install
cp .env.example .env       # paste /exec URL, client id, and your email
npm run icons              # generate PNG app icons from the SVG
npm run dev                # open the printed localhost URL, sign in with Google
```

### 5 · Deploy to GitHub Pages
1. Create a GitHub repo and push this folder.
2. **Settings ▸ Pages ▸ Build and deployment ▸ Source: GitHub Actions.**
3. **Settings ▸ Secrets and variables ▸ Actions**:
   - **Secret** `VITE_SHEETS_API` = your `/exec` URL
   - **Secret** `VITE_GOOGLE_CLIENT_ID` = your OAuth client id
   - **Variable** `VITE_ALLOWED_EMAIL` = `brownlegend0001@gmail.com`
   - (optional **variable**) `VITE_YEAR` = `2026`
4. Push to `main`. The workflow builds and publishes to
   `https://<you>.github.io/<repo>/`.
5. Open that URL in **Safari on iPhone** → sign in with Google →
   tap **Share ▸ Add to Home Screen**.

> **Authentication model:** every request carries a signed Google ID token.
> `Code.gs` verifies it on Google's servers and rejects anything that isn't
> `ALLOWED_EMAIL`. The endpoint can be "Anyone" yet only you can read or write —
> and the spreadsheet itself stays private to your account.

---

## How offline sync works
- Every edit is applied **optimistically** to local state + IndexedDB cache, then
  pushed into an **outbox** keyed by `op:month:day` (re-editing the same day
  before sync collapses into one write — no duplicates).
- When online (or on reconnect / tab focus / every 30 s), the sync engine replays
  the outbox in order through the Apps Script Web App.
- The Apps Script recomputes `Total / Salon Total / Net Profit` and writes them,
  so the Sheet stays correct even if a tab lost its formulas.
- The pill reflects state: **Synced**, **Syncing…**, **Offline · saved (n)**,
  **Retry pending**.

## Security notes
- **Google Sign-In gate.** The app is locked to a single account
  (`ALLOWED_EMAIL`). Every API call sends a signed Google ID token; `Code.gs`
  verifies it via Google's tokeninfo endpoint (signature, audience, issuer,
  expiry, verified email) and refuses anyone else — even if they find the URL.
- No service-account JSON or OAuth *secret* is in the client bundle; the client
  id is public by design.
- The Apps Script runs as you, so it — and only it — can read/write the Sheet;
  the spreadsheet stays private to your account.
- Offline: a returning user sees cached data and can queue edits, but those
  edits only reach the Sheet once back online with a fresh, verified token.

## Project structure
```
.
├── apps-script/Code.gs          # secure Google Sheets backend (deploy separately)
├── public/                      # manifest, favicon, generated icons, SW (via plugin)
├── scripts/generate-icons.mjs   # SVG → PNG icons
├── src/
│   ├── api/sheets.js            # fetch wrapper → Apps Script (attaches ID token)
│   ├── auth/googleAuth.js       # Google Sign-In (GIS), token issue/refresh
│   ├── components/              # AppShell, MonthTabs, BottomNav, SyncPill, charts, InstallPrompt, SignInGate
│   ├── context/AppContext.jsx   # app state: months, summary, sync, optimistic writes
│   ├── db/idb.js                # IndexedDB cache + outbox
│   ├── hooks/                   # useOnline, useStandalone, useAuth
│   ├── lib/                     # calc (business logic), format (₹/dates), constants
│   ├── pages/                   # Dashboard, Entry, MonthLog
│   ├── sync/syncEngine.js       # outbox replay + status
│   ├── App.jsx, main.jsx, index.css, config.js
├── .github/workflows/deploy.yml # GitHub Pages CI
├── index.html                   # iOS meta tags + viewport-fit=cover
└── vite.config.js               # PWA plugin + base path
```
