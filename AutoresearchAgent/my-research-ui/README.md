# AutoResearch Agent — React Frontend

Professional research UI that connects to your Python backend APIs (port **5000**).

## Run

**Terminal 1 — Backend** (Flask API on port 5000):

```bash
cd AutoResearch
pip install flask flask-cors
python api_server.py
```

Health check: http://localhost:5000/api/health

**Terminal 2 — Frontend:**

```bash
cd my-research-ui
npm install
npm run dev
```

Open **http://localhost:3000**. API calls are proxied to `http://localhost:5000` via Vite.

## Features

- Home search + recent topics
- Results tabs: Papers, Gaps, Hypotheses, Contradictions, Trends, Review
- **Graph Visualization** (D3 force graph, zoom/pan/drag)
- **Report Generator** (PDF via backend or client-side jsPDF)
- **Paper Comparison** (side-by-side table, contradictions in red)
- **Publish Roadmap** (timeline + progress)
- Floating **Chatbot** widget

## Env (optional)

Create `.env`:

```
VITE_API_BASE=http://localhost:5000
```

Leave empty to use the Vite proxy (`/api` → port 5000).

## Build

```bash
npm run build
npm run preview
```
