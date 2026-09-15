# Fact Pulse

A claim-checker built for the Nebius × NVIDIA Global AI Hackathon.
Paste a claim → Tavily pulls live sources → an NVIDIA open model
(`nvidia/nemotron-3-super-120b-a12b`) served via **Nebius Token Factory**
weighs the evidence and returns a verdict.

## Why it's two files

- `index.html` — the mobile-friendly frontend (no API keys inside it)
- `api/verify.js` — a serverless function that holds your API keys and
  makes the actual calls to Tavily and Nebius, server-side

This avoids the browser CORS/sandbox restrictions you'd hit calling those
APIs directly from a client-side page, and it keeps your keys off the
public page.

## Deploy this from your phone (no laptop, no terminal)

**1. Put the code on GitHub**
- Open github.com in your phone browser, log in
- Create a new repository (e.g. `fact-pulse`)
- Use "Add file → Upload files" to upload `index.html` and the `api`
  folder (containing `verify.js`) — GitHub's mobile upload preserves
  folder structure if you drag/select the whole `api/verify.js` path,
  or you can create `api/verify.js` directly with "Create new file" and
  paste the contents in
- Commit directly to the `main` branch

**2. Deploy on Vercel**
- Open vercel.com in your phone browser
- Sign up / log in with your GitHub account
- Tap "Add New… → Project", select the `fact-pulse` repo, tap Import
- Before deploying, open **Environment Variables** and add:
  - `TAVILY_API_KEY` = your Tavily key
  - `NEBIUS_API_KEY` = your Nebius Token Factory key
- Tap Deploy

**3. Open your live app**
- Vercel gives you a URL like `fact-pulse-yourname.vercel.app`
- Open it, type a claim, tap Investigate

If you ever change a key, update it in Vercel's Project Settings →
Environment Variables, then redeploy (Vercel will prompt you).
