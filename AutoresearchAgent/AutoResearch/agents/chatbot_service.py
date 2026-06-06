from groq import Groq
import os


def chatbot_response(user_message: str, research_context: dict) -> str:
    """
    Generate a thorough chatbot response grounded in the research context.

    Input:
    - user_message: User's question
    - research_context: Dict with topic, papers, gaps, hypotheses, contradictions, trends

    Output:
    - Response string
    """

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return (
            "⚠️ Groq API key not configured. "
            "Please set the GROQ_API_KEY environment variable."
        )

    client = Groq(api_key=api_key)

    # ── Papers ──────────────────────────────────────────────────────────────
    papers = research_context.get("papers") or []
    papers_lines = []
    for i, p in enumerate(papers[:10]):
        if isinstance(p, dict):
            title = (p.get("title") or "Untitled")[:80]
            year = p.get("year") or p.get("published") or "—"
            authors = p.get("authors", "")
            if isinstance(authors, list):
                authors = ", ".join(authors[:3])
            abstract = (p.get("abstract") or p.get("summary") or "")[:200]
            papers_lines.append(
                f"  [{i+1}] {title} ({year}) — {authors}\n      {abstract}"
            )
        else:
            papers_lines.append(f"  [{i+1}] {str(p)[:80]}")
    papers_block = "\n".join(papers_lines) if papers_lines else "  None retrieved."

    # ── Gaps ─────────────────────────────────────────────────────────────────
    gaps = research_context.get("gaps") or []
    if isinstance(gaps, str):
        gaps_block = gaps[:1500]
        gaps_count = gaps_block.count("\n") + 1
    elif isinstance(gaps, list):
        gaps_count = len(gaps)
        gap_lines = []
        for i, g in enumerate(gaps[:8]):
            if isinstance(g, dict):
                title = g.get("title") or g.get("name") or f"Gap {i+1}"
                desc = (g.get("description") or "")[:150]
                gap_lines.append(f"  {i+1}. {title}: {desc}")
            else:
                gap_lines.append(f"  {i+1}. {str(g)[:120]}")
        gaps_block = "\n".join(gap_lines) if gap_lines else "  None identified."
    else:
        gaps_block = str(gaps)[:500]
        gaps_count = 0

    # ── Hypotheses ────────────────────────────────────────────────────────────
    hypotheses = research_context.get("hypotheses") or []
    hyp_lines = []
    for i, h in enumerate(hypotheses[:5]):
        if isinstance(h, dict):
            title = h.get("title") or h.get("hypothesis") or h.get("statement") or f"H{i+1}"
            desc = (h.get("description") or h.get("rationale") or "")[:200]
            scores = h.get("scores") or {}
            score_str = ""
            if scores:
                score_str = (
                    f" | Novelty {scores.get('novelty','?')}/10"
                    f" · Feasibility {scores.get('feasibility','?')}/10"
                    f" · Impact {scores.get('impact','?')}/10"
                )
            hyp_lines.append(f"  {i+1}. {title}{score_str}\n     {desc}")
        else:
            hyp_lines.append(f"  {i+1}. {str(h)[:120]}")
    hyp_block = "\n".join(hyp_lines) if hyp_lines else "  None generated."

    # ── Contradictions ────────────────────────────────────────────────────────
    contradictions = research_context.get("contradictions") or []
    con_lines = []
    for i, c in enumerate(contradictions[:5]):
        if isinstance(c, dict):
            s1 = (c.get("statement1") or c.get("statement_1") or "")[:120]
            s2 = (c.get("statement2") or c.get("statement_2") or "")[:120]
            analysis = (c.get("analysis") or c.get("implication") or "")[:200]
            con_lines.append(
                f"  {i+1}. Conflict:\n"
                f"     A: {s1}\n"
                f"     B: {s2}\n"
                f"     Analysis: {analysis}"
            )
        else:
            con_lines.append(f"  {i+1}. {str(c)[:150]}")
    con_block = "\n".join(con_lines) if con_lines else "  None found."

    # ── Trends ────────────────────────────────────────────────────────────────
    trends = research_context.get("trends") or {}
    if isinstance(trends, dict):
        current_trend = (trends.get("current_trend") or "N/A")[:300]
        predictions = trends.get("predictions") or []
        if isinstance(predictions, list):
            pred_str = "; ".join(str(p)[:100] for p in predictions[:3]) or "N/A"
        else:
            pred_str = str(predictions)[:200]
    else:
        current_trend = str(trends)[:200]
        pred_str = "N/A"

    # ── Build system prompt ───────────────────────────────────────────────────
    topic = research_context.get("topic") or "the research topic"

    context_block = f"""
RESEARCH TOPIC: {topic}

━━━ PAPERS FOUND ({len(papers)} total) ━━━
{papers_block}

━━━ RESEARCH GAPS IDENTIFIED ({gaps_count}) ━━━
{gaps_block}

━━━ HYPOTHESES GENERATED ({len(hypotheses) if isinstance(hypotheses, list) else 0}) ━━━
{hyp_block}

━━━ CONTRADICTIONS FOUND ({len(contradictions) if isinstance(contradictions, list) else 0}) ━━━
{con_block}

━━━ TRENDS ━━━
Current: {current_trend}
Predictions: {pred_str}
""".strip()

    system_prompt = f"""You are an expert AI research assistant specialising in academic literature analysis.
You have just completed a deep analysis of research on "{topic}".
Below is the full structured output from your multi-agent pipeline.

{context_block}

YOUR BEHAVIOUR RULES:
1. Answer the user's question thoroughly using the data above — cite specific papers, gaps, or hypotheses by number or title.
2. If asked to summarise, give a structured, paragraph-form answer — not one-liners.
3. If the user asks for recommendations or next steps, give concrete, actionable suggestions grounded in the gaps and hypotheses found.
4. If something is not in the research data, say so honestly and still try to help from general knowledge.
5. Use clear formatting (numbered lists, bold, etc.) where it improves readability.
6. Be direct and confident — avoid filler phrases like "I think" or "it seems".
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",   # Much stronger model
            max_tokens=1024,                    # Enough for detailed answers
            temperature=0.5,                    # Slightly more focused
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"[Chatbot error] {e}")
        # Fallback to smaller model if the big one fails (quota, etc.)
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                max_tokens=800,
                temperature=0.5,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
            return response.choices[0].message.content
        except Exception as e2:
            print(f"[Chatbot fallback error] {e2}")
            return f"⚠️ Sorry, I had trouble responding ({e2}). Please try again in a moment."