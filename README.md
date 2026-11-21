# Recall — DSA flashcards

Decks of flashcards (problem on the front; thoughts, code, diagrams and sketches on the back) with
spaced-repetition scheduling (2-3-5-7 day method, then longer gaps) and a review calendar.
Everything is stored on your device (IndexedDB). It is an installable PWA.

## Run locally
```
npm install
npm run dev
```

## Put it on your phone (free)
A PWA needs an https address to install. Pick one:

**Easiest — Netlify Drop (no account setup, no git):**
1. `npm run build`
2. Drag the `dist` folder onto https://app.netlify.com/drop
3. Open the link it gives you on your phone.

**GitHub Pages (auto-deploys on every push):**
1. Create a GitHub repo, push this folder to the `main` branch.
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and publishes it.

**Cloudflare Pages:** connect the repo, build command `npm run build`, output directory `dist`.

## Install
- **Android (Chrome):** menu → *Install app* / *Add to Home screen*.
- **iPhone (Safari):** Share → *Add to Home Screen*.

## Moving data between devices
Settings → Export backup on one device, Import backup on the other. Data is not synced automatically.
Each address (your laptop's localhost, your deployed site) keeps its own separate data.

## Reminders
- Settings → *Download calendar (.ics)* adds every upcoming review, with an alert, to Google/Apple Calendar.
  This works while the app is closed. Re-download after reviewing, since dates move.
- In-app notification: once a day, when you open the app with decks due. A web app cannot wake the
  phone by itself without a push server.

## Icons
`node scripts/make-icons.mjs` regenerates the PNG icons in `public/`.
