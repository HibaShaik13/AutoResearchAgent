"""
Thin Flask REST API for the React frontend.
Wraps run_pipeline() from main.py — does not change agent logic.
"""
import glob
import os
import re
import traceback

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

from main import run_pipeline
from agents.chatbot_service import chatbot_response

app = Flask(__name__)
CORS(app)

current_results = None
current_topic = None


def _paper_year(paper: dict) -> str:
    return str(paper.get("year") or paper.get("published") or "—")


def _enrich_papers(papers: list, extracted: list) -> list:
    """Merge extraction summaries into paper objects for the UI."""
    by_title = {}
    for item in extracted or []:
        if isinstance(item, dict) and item.get("title"):
            by_title[item["title"].lower().strip()] = item

    enriched = []
    for i, paper in enumerate(papers or []):
        if not isinstance(paper, dict):
            continue
        key = paper.get("title", "").lower().strip()
        ext = by_title.get(key, {})
        summary = ext.get("summary", "")
        enriched.append(
            {
                "id": f"paper-{i}",
                "title": paper.get("title", "Untitled"),
                "abstract": paper.get("abstract", ""),
                "url": paper.get("url", ""),
                "year": _paper_year(paper),
                "published": paper.get("published"),
                "source": paper.get("source", "unknown"),
                "authors": paper.get("authors", []),
                "citations": paper.get("citations", 0),
                "summary": summary,
            }
        )
    return enriched


def _parse_gaps(gap_text) -> list:
    """Turn gap agent markdown/text into structured gap objects."""
    if not gap_text:
        return []
    if isinstance(gap_text, list):
        return gap_text

    text = str(gap_text)
    gaps = []
    for line in text.split("\n"):
        line = line.strip()
        if len(line) < 12:
            continue
        if re.match(r"^[\*\-\•]", line) or re.match(r"^\d+[\.\)]", line):
            clean_line = re.sub(r"^[\*\-\•\d\.\)\s]+", "", line).strip()
            
            match = re.search(r"\*\*(.*?)\*\*\s*[:\-]?\s*(.*)", clean_line)
            if match:
                title = match.group(1).strip()
                description = match.group(2).strip()
            else:
                parts = re.split(r"[:\.]\s+", clean_line, 1)
                if len(parts) == 2 and len(parts[0]) < 100:
                    title = parts[0].strip()
                    description = parts[1].strip()
                else:
                    title = "Research Gap"
                    description = clean_line
            
            if not description:
                description = clean_line
                
            if title:
                gaps.append(
                    {
                        "id": f"gap-{len(gaps)}",
                        "title": title,
                        "description": description,
                        "type": "general",
                    }
                )
    if not gaps and text.strip():
        gaps.append(
            {
                "id": "gap-0",
                "title": "Identified research gaps",
                "description": text[:2000],
                "type": "general",
            }
        )
    return gaps[:12]


def _format_trends(trends: dict, papers: list) -> dict:
    if not isinstance(trends, dict):
        trends = {}

    year_dist = trends.get("year_distribution") or {}
    if not year_dist and papers:
        from collections import Counter

        years = []
        for p in papers:
            y = _paper_year(p)
            if y and y != "—":
                years.append(y[:4])
        year_dist = dict(sorted(Counter(years).items()))

    yearly_counts = [
        {"year": str(y), "count": c} for y, c in year_dist.items()
    ]

    predictions = []
    for key in ("prediction_2025", "prediction_2026"):
        if trends.get(key):
            predictions.append(trends[key])
    for topic in trends.get("emerging_topics") or []:
        predictions.append(f"Emerging: {topic}")

    return {
        "current_trend": trends.get("current_trend", ""),
        "predictions": predictions,
        "yearly_counts": yearly_counts,
        "momentum": trends.get("momentum"),
        "growth_rate": trends.get("growth_rate"),
    }


def _load_review_from_disk(topic: str) -> str:
    """Load saved review markdown if in-memory review is missing (API wiring only)."""
    if not topic:
        return ""
    safe = re.sub(r"[^\w\-]", "_", topic.replace(" ", "_"))
    pattern = os.path.join("outputs", "reviews", f"{safe}_*.md")
    files = sorted(glob.glob(pattern), reverse=True)
    if not files:
        pattern2 = os.path.join("outputs", "reviews", "*.md")
        files = sorted(glob.glob(pattern2), reverse=True)
    for path in files:
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
            if len(text.strip()) > 100:
                return text
        except OSError:
            continue
    return ""


def _review_text(results: dict) -> str:
    review = results.get("review") or ""
    if isinstance(review, str) and len(review.strip()) > 100:
        return review
    path = results.get("filename")
    if path and os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                return f.read()
        except OSError:
            pass
    topic = results.get("topic") or current_topic
    return _load_review_from_disk(topic or "")


def _build_graph(papers: list, gaps: list) -> dict:
    nodes = []
    edges = []

    for i, paper in enumerate((papers or [])[:10]):
        nodes.append(
            {
                "id": f"paper-{i}",
                "label": (paper.get("title") or f"Paper {i + 1}")[:50],
                "type": "paper",
                "importance": min(10, 3 + (paper.get("citations") or 0) / 50),
            }
        )

    gap_list = gaps if isinstance(gaps, list) else _parse_gaps(gaps)
    for i, gap in enumerate(gap_list[:8]):
        gid = gap.get("id") or f"gap-{i}"
        nodes.append(
            {
                "id": gid,
                "label": (gap.get("title") or f"Gap {i + 1}")[:50],
                "type": "gap",
                "importance": 8,
            }
        )
        if i < len(papers):
            edges.append({"source": f"paper-{i}", "target": gid})

    return {"graph_nodes": nodes, "graph_edges": edges}


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "message": "Backend running on port 5000",
            "has_results": current_results is not None,
            "topic": current_topic,
        }
    )


@app.route("/api/analyze", methods=["GET"])
def analyze():
    global current_results, current_topic

    try:
        topic = request.args.get("topic", "").strip()
        if not topic:
            return jsonify({"error": "Topic required"}), 400

        print(f"\n[*] API analyze: {topic}")
        result = run_pipeline(topic)

        if not result:
            return jsonify({"error": "Pipeline returned no results. Try another topic."}), 500

        current_topic = topic
        current_results = {**result, "topic": topic}

        papers = result.get("papers") or []
        hypotheses = result.get("hypotheses") or []
        contradictions = result.get("contradictions") or []
        gaps = _parse_gaps(result.get("gap_analysis"))

        return jsonify(
            {
                "status": "success",
                "topic": topic,
                "papers_count": len(papers),
                "gaps_count": len(gaps),
                "hypotheses_count": len(hypotheses),
                "contradictions_count": len(contradictions),
            }
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/results", methods=["GET"])
def get_results():
    try:
        if current_results is None:
            return jsonify({"error": "No analysis results. Run /api/analyze first."}), 400

        papers = _enrich_papers(
            current_results.get("papers", []),
            current_results.get("extracted", []),
        )
        gaps = _parse_gaps(current_results.get("gap_analysis"))
        trends = _format_trends(
            current_results.get("trends", {}),
            current_results.get("papers", []),
        )
        graph = _build_graph(papers, gaps)

        review_body = _review_text({**current_results, "topic": current_topic})

        return jsonify(
            {
                "topic": current_topic or current_results.get("topic", ""),
                "papers": papers,
                "gaps": gaps,
                "hypotheses": current_results.get("hypotheses", []),
                "contradictions": current_results.get("contradictions", []),
                "trends": trends,
                "literature_review": review_body,
                "review": review_body,
                "graph_nodes": graph["graph_nodes"],
                "graph_edges": graph["graph_edges"],
            }
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/graph-data", methods=["GET"])
def get_graph_data():
    try:
        if current_results is None:
            return jsonify({"error": "No results yet", "graph_nodes": [], "graph_edges": []}), 400

        papers = _enrich_papers(
            current_results.get("papers", []),
            current_results.get("extracted", []),
        )
        gaps = _parse_gaps(current_results.get("gap_analysis"))
        return jsonify(_build_graph(papers, gaps))
    except Exception as e:
        return jsonify({"graph_nodes": [], "graph_edges": [], "error": str(e)}), 500


@app.route("/api/generate-report", methods=["POST"])
def generate_report():
    """Returns report payload; frontend builds PDF with jsPDF."""
    try:
        if current_results is None:
            return jsonify({"error": "No results to report"}), 400

        papers = _enrich_papers(
            current_results.get("papers", []),
            current_results.get("extracted", []),
        )
        gaps = _parse_gaps(current_results.get("gap_analysis"))

        return jsonify(
            {
                "status": "success",
                "topic": current_topic,
                "papers": papers,
                "gaps": gaps,
                "hypotheses": current_results.get("hypotheses", []),
                "contradictions": current_results.get("contradictions", []),
                "trends": _format_trends(
                    current_results.get("trends", {}),
                    current_results.get("papers", []),
                ),
                "review": current_results.get("review", ""),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/chatbot", methods=["POST"])
def chatbot():
    try:
        data = request.get_json(silent=True) or {}
        message = (data.get("message") or "").strip()

        if not message:
            return jsonify({"error": "Message required"}), 400

        if current_results is None:
            return jsonify(
                {
                    "response": "No research analysis yet. Run an analysis from the home page first.",
                    "reply": "No research analysis yet. Run an analysis from the home page first.",
                }
            )

        context = {
            "topic": current_topic or current_results.get("topic", ""),
            "papers": current_results.get("papers", []),
            "gaps": current_results.get("gap_analysis", ""),
            "hypotheses": current_results.get("hypotheses", []),
            "contradictions": current_results.get("contradictions", []),
            "trends": current_results.get("trends", {}),
        }

        reply = chatbot_response(message, context)
        return jsonify({"response": reply, "reply": reply})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("  AutoResearch API Server")
    print("  http://localhost:5000")
    print("  Health: http://localhost:5000/api/health")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)
