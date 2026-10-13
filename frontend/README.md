# AskUtkarsh — frontend

An interactive portfolio front end that talks to your existing FastAPI
`/chat` backend. Built with React + Vite, a small React Three Fiber scene,
and lucide-react icons.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on **http://localhost:5174** (fixed in `vite.config.js`
to match the backend's CORS config). Your FastAPI backend should already be
running on `http://127.0.0.1:8000`.

If your backend runs somewhere else, copy `.env.example` to `.env` and set
`VITE_API_URL`.

## Before you show this to anyone

- Drop your real resume PDF at `public/resume.pdf` (see
  `public/PUT_RESUME_HERE.txt`) — the "Download Resume" button links to
  `/resume.pdf`.
- Check `src/config.js` — that's the one file with anything specific to you
  (site name/tagline, the GitHub link shown in the header, and the four
  quick-action prompts). Everything else the chat says comes straight from
  your FastAPI backend.

## Project structure

```
src/
├── App.jsx              # landing ⇄ conversation state, wires everything up
├── App.css
├── config.js             # site copy, quick actions, resume path, API URL
├── api/
│   └── chat.js           # POST /chat, typed errors (network/http/invalid)
└── components/
    ├── Header.jsx
    ├── ChatWindow.jsx      # message list, auto-scroll, loading/error states
    ├── MessageBubble.jsx
    ├── ChatInput.jsx       # auto-growing textarea, Enter / Shift+Enter
    └── QuickActions.jsx    # 4 preset prompts + resume download
```

## Design notes

- One accent color (copper/amber) on a graphite background — no gradients,
  no glow, no glass. `src/index.css` holds all the color/type tokens as CSS
  variables if you want to retune the palette.
- The background is a plain CSS treatment: two soft, low-opacity color
  fields (the accent copper, plus a muted slate-teal) placed off-center,
  with a faint grain texture over the top so it reads as designed rather
  than a flat gradient. It fades further into the background once a
  conversation starts, so it doesn't compete with the chat. No 3D, no JS
  animation loop.
- Respects `prefers-reduced-motion` (freezes the 3D drift and cuts all CSS
  transitions to near-instant) and reduces 3D pixel ratio on small screens.

## Build

```bash
npm run build
npm run preview
```
