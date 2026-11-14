# YAAD backend
Proxies activity generation to an AI provider so the key never reaches the browser. Works with Google Gemini (free tier), a local Ollama model (no key), or Claude. Set one of `GEMINI_API_KEY`, `OLLAMA_MODEL`, `ANTHROPIC_API_KEY`. Check the model names against each provider's current docs.

**Local:** copy `.env.example` to `.env`, add one provider, run `node server.js`, open http://localhost:3000.
**Netlify:** deploy this folder, set your provider variable in Site settings > Environment variables (Ollama only works locally).
If the call fails, the app silently falls back to its built-in template activity.

## Cross-device sync
`sync.js` stores each family's data on the server (`data.json`, or `DATA_FILE`). A caregiver taps **Sync > Create a family code**, then enters that code on the elder's device. Run `node server.js` on any Node host (Render, Railway, Fly, a laptop on the same Wi-Fi). Netlify static hosting cannot run it. Use https for the app and the server together, because browsers block an https page calling an http server. On free hosts, attach a persistent disk or the data resets on restart. There are no accounts: anyone with the code can read the data, so treat it as demo-grade.
