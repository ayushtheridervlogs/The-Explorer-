# The Explorer

Interactive analytics dashboard for India's food businesses: cafés, restaurants and street food, with zone-wise insights, an animated roadmap, a map-linked findings view, and an AI assistant. Demo data.

## About

The Explorer

The Explorer is a multi-city food discovery and analytics dashboard covering cafés, restaurants and street-food vendors across India, starting with the Mumbai Western Railway corridor.

The dashboard turns raw listings and reviews into an eight-chapter journey: headline KPIs, business distribution, ratings and reviews, price analysis, monthly growth, zone intelligence, auto-generated findings, and a paginated record ledger. Every chart and insight is calculated from the data, and each finding links to its location on the map.

Features

- Filter by city (all of India), zone, category and time period
- Interactive charts with animated transitions
- Price statistics (mean, median, standard deviation, price–rating correlation)
- CSV export of filtered results
- English, Hindi and Marathi interface
- "Ask Atlas" AI assistant that answers from the dashboard figures or general knowledge, using a provider API key

Running locally

Open `index.html` in a browser. No build step is needed.

To use the AI assistant, expand **AI settings** in the chat panel, choose a provider, and paste your API key. Keys are kept only in that browser tab.

Server route (optional)

`server/chat-route.ts` is a Next.js route that reads the key from the `CHAT_API_KEY` environment variable, so keys stay off the browser. Never commit `.env` or `.env.local`.

## Data

All business names, ratings and reviews are fictional demo data for testing. No live or verified information is shown.
