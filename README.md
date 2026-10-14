# Fact Pulse

**Paste a claim. Get it checked against live sources — grounded, not guessed.**

Built for the Nebius × NVIDIA Global AI Hackathon (track: Best Apps and Agents).

**Live demo:** https://fact-pulse-iota.vercel.app/

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

Instead of asking an LLM to answer from memory (which can hallucinate),
every verdict is grounded in evidence fetched at the moment of the query.

## How it uses NVIDIA and Nebius

| Requirement | How Fact Pulse satisfies it |
|---|---|
| Runs on Nebius Token Factory or Nebius AI Cloud | `api/verify.js` calls `https://api.tokenfactory.nebius.com/v1/chat/completions` for all model inference |
| Uses an NVIDIA open-source model | `nvidia/nemotron-3-super-120b-a12b`, used out of the box with a strict JSON-output system prompt |
| Tavily | `api/verify.js` makes a live call to the Tavily Search API on every request |

**Why Nemotron 3 Super:** the task is weighing several, sometimes
conflicting, web sources to reach a nuanced verdict, so we chose the larger
reasoning-oriented variant over a smaller one.

**Where Token Factory helped:** it is a fully managed, OpenAI-compatible
endpoint, so we called an NVIDIA open model with standard chat-completions
requests and no GPU provisioning or model hosting on our side. The code also
reads both `content` and `reasoning_content` from the response, since
Nemotron's reasoning variants can return text in either field.

## Architecture

```
┌─────────────┐      POST /api/verify      ┌──────────────────┐
│  index.html │ ──────────────────────────▶│ verify.js        │
│ (frontend)  │                            │ (Vercel function)│
└─────────────┘                            └──────────────────┘
                                                  │        │
                                       1. search  │        │ 2. reason over
                                          claim   ▼        ▼    sources
                                     ┌──────────┐    ┌──────────────────┐
                                     │  Tavily  │    │ Nebius Token     │
                                     │  Search  │    │ Factory          │
                                     │  API     │    │ (NVIDIA Nemotron)│
                                     └──────────┘    └──────────────────┘
```

API keys live server-side as Vercel environment variables and are never
exposed to the browser.

## Run your own copy

1. Fork or clone this repo
2. Import it into Vercel (auto-detects `index.html` + `api/verify.js`)
3. Add two Environment Variables:
   - `TAVILY_API_KEY` — from https://app.tavily.com
   - `NEBIUS_API_KEY` — from the Nebius Token Factory console
4. Deploy, open the URL, and paste a claim

No build step is needed.

## Stack

- Tavily Search API — real-time evidence retrieval
- NVIDIA Nemotron 3 Super via Nebius Token Factory — reasoning over evidence
- Vercel serverless function — orchestration and key security
- Vanilla HTML/CSS/JS frontend — mobile-first

## License

MIT — see [LICENSE](LICENSE).
