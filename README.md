# Office Time Tracker

A production-ready Progressive Web App for tracking office attendance, WFH blocks, and work hours. Built with React, TypeScript, Tailwind CSS, and IndexedDB — fully offline, no backend required.

## Features

- **Dashboard** — Today's status, hours breakdown, monthly attendance
- **Daily Entry** — Punch in/out with automatic WFH block calculation
- **History** — Filterable monthly attendance table
- **Analytics** — Averages, attendance %, trend charts
- **Settings** — Configurable targets, office days, gaps, official start time
- **Export** — CSV and JSON export, JSON import
- **PWA** — Installable, offline-first, iPhone Safari optimized
- **Themes** — Light and dark mode

## Business Rules

| Rule | Default |
|------|---------|
| Target work duration | 9h 15m |
| Official workday start | 9:00 AM |
| WFH1 start | Official start (9:00 AM) |
| WFH1 end | 30 min before Punch In |
| WFH2 start | 30 min after Punch Out |
| WFH2 duration | Auto-adjusted so total = target hours |

**Formulas:**

- `Office Hours` = Punch Out − Punch In
- `WFH1 Hours` = WFH1 End − WFH1 Start
- `WFH2 Hours` = Target − Office Hours − WFH1 Hours

## Folder Structure

```
office-time-tracker/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── scripts/
│   └── generate-icons.mjs     # Icon generator
├── src/
│   ├── components/
│   │   ├── charts/            # Recharts visualizations
│   │   ├── ui/                # Card, StatCard
│   │   ├── InstallPrompt.tsx  # iOS + Chrome install UI
│   │   └── Layout.tsx
│   ├── db/
│   │   └── index.ts           # Dexie / IndexedDB
│   ├── hooks/
│   ├── pages/                 # Dashboard, Entry, History, etc.
│   ├── types/
│   ├── utils/                 # calculations, time, export
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── vercel.json
└── package.json
```

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (includes npm)

### Setup

```bash
cd office-time-tracker
npm install
node scripts/generate-icons.mjs
npm run dev
```

Open **http://localhost:5173** in your browser.

### Build for production

```bash
npm run build
npm run preview
```

Output is in the `dist/` folder.

## Install as PWA

### iPhone (Safari)

1. Open the app URL in Safari
2. Tap **Share** → **Add to Home Screen**
3. The install banner in the app also shows these instructions

### Android / Desktop (Chrome, Edge)

1. Open the app in Chrome
2. Tap **Install App** when prompted, or use the browser menu → **Install app**

## Deployment on Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
cd office-time-tracker
npm run build
vercel
```

Follow the prompts. Vercel auto-detects Vite.

### Option B: GitHub integration

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your repository
4. Vercel reads `vercel.json` automatically:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Framework:** Vite
5. Click **Deploy**

### SPA routing

`vercel.json` includes a rewrite so all routes serve `index.html` for client-side routing.

### Post-deploy checklist

- [ ] Visit the live URL and confirm the service worker registers
- [ ] Test offline mode (DevTools → Network → Offline)
- [ ] On iPhone, add to Home Screen and verify standalone mode
- [ ] Log a test entry and confirm IndexedDB persistence after reload

## Database Schema

**AttendanceRecord** (IndexedDB table: `records`)

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID |
| date | string | YYYY-MM-DD |
| wfh1Start | string | HH:mm |
| wfh1End | string | HH:mm |
| punchIn | string | HH:mm |
| punchOut | string | HH:mm |
| wfh2Start | string | HH:mm |
| wfh2End | string | HH:mm |
| officeHours | number | Decimal hours |
| wfhHours | number | Decimal hours |
| totalHours | number | Decimal hours |
| status | string | complete \| partial \| draft |

**AppSettings** (table: `settings`, single row `id: 'settings'`)

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 3
- Dexie (IndexedDB)
- Recharts
- vite-plugin-pwa (Workbox service worker)
- React Router 7

## License

MIT
