# 虾算账 (dsh-axia-cachebilling)

[中文](./README.md)

> **Token billing & cache monitoring** — a live bill pinned inside DSH's context popover.

A DSH web plugin (host half + browser half) that attaches itself to **DSH's own context-usage popover**: no extra pages, nothing covering the chat.

## What you see in the popover

| Section | Contents |
|---|---|
| **Session statistics** | Three tiers — **current step / current turn / session total** — each with a total plus **cache hit / miss / output** breakdown, and a model pill (`provider/model · valley/peak · currency`) |
| **Context statistics** | Eight counters taken from **real session-log events**: turns, steps, tool calls, images, prunes, injections, compactions (+ estimated cost). Counted, never estimated |
| **Token statistics** | **Total tokens** plus cache-read / uncached-input / output rows with percentages and absolute amounts |

Money handling:

- **Automatic currency unification** — CNY and USD are converted into the **billing currency of the current entry** using a live rate (`open.er-api.com`, cached locally, graceful fallback; if no rate is available it falls back to listing both instead of guessing);
- **Peak / valley pricing** per provider;
- Third-party relays are billed too, matched through the price catalog.

## Settings page

- Pick provider / model from **DSH's own configured list**; fetch a provider's model list with one click;
- **Price catalog** covering Open Code / Command Code / GLM / Kimi / MiniMax / MiMo: new entries or edited models auto-fill prices, and you can refresh on demand;
- Custom entries (flat or peak/valley, CNY or USD) applied **immediately, no restart**;
- Popover font-scale tiers (standard / large / extra / huge) — they affect the popover only; the settings page stays at standard size.

## Install

```bash
dsh plugin --profile web add github:Animal2404/dsh-axia-cachebilling
```

Restart DSH, then open any session's **context-usage popover**.

## For maintainers

- **Builds run on GitHub Actions only**: `.github/workflows/build.yml` runs `npm install` + `npm run build` (esbuild) on pushes to `main`, commits the `lib/` artifacts back and uploads them as an artifact. Locally you only `git pull`.
- Sources: `src/index.ts` (host projection: pricing + event counters), `src/client.ts` (popover UI), `src/settings.ts` (settings UI), `src/prices.ts` (catalog fetch/match);
- Catalog: `price-catalog.json` at the repo root, fetched and cached by the client.

## Credits

Evolved from MIT-licensed projects in the same ecosystem:

- the original `dsh-cache-billing` by **Phant0Meow** — the three-tier billing idea and its first implementation;
- a major rewrite by **better-er** — three tiers, relay support, cache-invalidation stats.

Their copyright notices are preserved in [`LICENSE`](./LICENSE) as required by the MIT license.

## License

MIT — see [`LICENSE`](./LICENSE).
