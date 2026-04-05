# Creator Autopilot AI Website MVP

This repository contains a multi-page website for Creator Autopilot AI with a local Gemini-powered assistant endpoint.

## Pages

- `index.html` - home and product positioning
- `features.html` - feature overview and interactive workspace
- `opportunities.html` - opportunity inbox and outreach review flow
- `workflow.html` - pipeline management and branded AI persona
- `pricing.html` - pricing, trial model, and FAQs

## Run locally

1. Add your `GEMINI_API_KEY`
3. Run `npm start`
4. Open `http://localhost:3000`

## Notes

This is a website and product-structure prototype with a lightweight local Node server.
The Gemini key stays server-side through `server.js` and is not exposed directly in the frontend.
If Gemini quota is unavailable, the assistant falls back to a transparent local response so the UI still works.
