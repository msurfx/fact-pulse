# Fact Pulse

**Paste a claim. Get it checked against live sources — grounded, not guessed.**

Built for the Nebius × NVIDIA Global AI Hackathon.

## What it does

Fact Pulse takes any claim — a headline, a rumor, something from a group
chat — and returns a sourced verdict in seconds:

1. **Tavily** searches the live web for relevant, current sources
2. **NVIDIA Nemotron 3 Super**, served via **Nebius Token Factory**,
   reads the claim alongside those sources and returns a verdict
   (verified / false / mixed), a confidence level, and an explanation
   that cites specific sources
3. The result is shown with links to every source, so you can verify
   the verdict yourself

The point: instead of asking an LLM to answer from memory (which can
hallucinate), every verdict here is forced to be grounded in evidence
fetched at the moment of the query.

## How it meets the hackathon requirements

| Requirement | How Fact Pulse satisfies it |
|---|---|
| Runs on Nebius Token Factory or Nebius AI Cloud | `api/verify.js` calls `https://api.tokenfactory.nebius.com/v1/chat/completions` for all model inference |
| Uses at least one NVIDIA open-source model | Model used is `nvidia/nemotron-3-super-120b-a12b` |
| Track | Best Apps and Agents |

## Architecture

```
┌─────────────┐      POST /api/verify      ┌──────────────────┐
│  index.html │ ───────────────────────────▶│ verify.js         │
│ (frontend)  │                              │ (Vercel function)│
└─────────────┘                              └──────────────────┘
                                                     │        │
                                          1. search  │        │ 2. reason over
                                             claim    ▼        ▼    sources
                                        ┌──────────┐    ┌──────────────────┐
                                        │  Tavily   │    │ Nebius Token      │
                                        │  Search   │    │ Factory           │
                                        │  API      │    │ (NVIDIA Nemotron) │
                                        └──────────┘    └──────────────────┘
```

API keys (`TAVILY_API_KEY`, `NEBIUS_API_KEY`) live server-side as Vercel
environment variables — never exposed to the browser.

## Try it

Live: `https://fact-pulse-msurfx.vercel.app` *(replace with your actual URL)*

Or run locally:
1. Clone this repo
2. Deploy to Vercel (auto-detects `index.html` + `api/verify.js`)
3. Set `TAVILY_API_KEY` and `NEBIUS_API_KEY` in Vercel's Environment
   Variables
4. Deploy

## Stack

- Tavily Search API — real-time evidence retrieval
- NVIDIA Nemotron 3 Super via Nebius Token Factory — reasoning over evidence
- Vercel serverless function — orchestration + key security
- Vanilla HTML/CSS/JS frontend — no build step, mobile-first
