# Glow Circle — Frontend Prototype

This is the interactive frontend prototype for Glow Circle, a beauty-services marketplace app for the Nigerian market (hair, nails, makeup, lashes, spa).

It's a React + Vite single-page app covering three views, switchable at the top of the screen:
- **Customer** — home, discovery feed by category, salon profiles, full booking flow, my bookings, account
- **Salon owner** — today's schedule, availability calendar, earnings & payouts (Naira, Paystack-fee-aware)
- **Admin** — payments ledger, salon verification & payout freeze controls, commission/fee settings

This is a **frontend-only prototype**: all data (salons, bookings, availability) lives in React state and resets on page reload. It's meant to demo UX and business logic (booking/availability conflict prevention, commission math, refund policy) before wiring up the real backend.

## Run it locally

```bash
npm install
npm run dev
```
Then open the local URL Vite prints (usually `http://localhost:5173`).

## Deploy to GitHub Pages (get a public URL)

1. Push this folder to a new GitHub repository.
2. In the repo, go to **Settings → Pages**, and under "Build and deployment," set **Source** to **GitHub Actions**.
3. Push (or re-push) to the `main` branch. The included workflow at `.github/workflows/deploy.yml` builds and deploys automatically.
4. After the workflow finishes (check the **Actions** tab), your site will be live at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

No manual build step is required — the GitHub Action handles `npm install` and `npm run build` on every push to `main`.

## Project structure

```
glow-circle-frontend/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx       — React entry point
│   ├── App.jsx         — the entire app (all screens, mock data, state)
│   └── index.css       — base styles
└── .github/workflows/deploy.yml   — auto-deploy to GitHub Pages
```

## Connecting the real backend

Right now `src/App.jsx` uses hardcoded arrays (`SALONS`, mock bookings in React state) instead of API calls. To connect it to your backend:
- Replace the `SALONS` constant with a `fetch`/`axios` call to your `/salons` endpoint on mount.
- Replace `confirmBooking` with a POST to your `/bookings` endpoint, and handle the response instead of just updating local state.
- Replace the Paystack payment step in `BookingFlow` with a real `transaction/initialize` call to your backend (which then talks to Paystack server-side — never call Paystack directly from the frontend with your secret key).
- The Admin and Salon dashboards will need their own authenticated routes once real accounts exist — this prototype has no auth.
