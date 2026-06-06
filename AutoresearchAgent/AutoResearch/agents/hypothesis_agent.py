from groq import Groq
import os
import json
import re

def hypothesis_agent(papers, gaps, topic):
    """
    Generates novel research hypotheses based on papers and gaps.

    Input:
    - papers: List of paper objects
    - gaps: List of identified gaps
    - topic: Research topic

    Output:
    - List of 10 hypotheses with scores
    """

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Prepare context
    papers_summary = "\n".join([
        f"- {p.get('title', 'Unknown')}: {p.get('abstract', '')[:200]}"
        for p in papers[:10]
    ])

    # gaps can be a string (from gap agent) or list
    if isinstance(gaps, list):
        gaps_summary = "\n".join([
            f"- {g.get('title', 'Unknown')}: {g.get('description', '')}"
            for g in gaps[:5]
        ])
    else:
        gaps_summary = str(gaps)[:800]

    prompt = f"""Based on these research papers and identified gaps, generate 10 NOVEL research hypotheses.

TOPIC: {topic}

PAPERS:
{papers_summary}

IDENTIFIED GAPS:
{gaps_summary}

Generate hypotheses as JSON array. IMPORTANT: Return ONLY valid JSON, nothing else.

Each hypothesis must have:
- title: hypothesis title (string)
- description: full hypothesis statement (string)
- feasibility_score: 1-10 (integer)
- impact_score: 1-10 (integer)
- novelty_score: 1-10 (integer)
- why_matters: why this matters (string)
- how_to_test: testing methodology (string)
- expected_outcome: expected discovery (string)

Example format:
[
    {{
        "title": "AI-Optimized Solar Farms Affecting Microclimate",
        "description": "Hypothesis that AI-controlled solar panel orientation could influence local atmospheric conditions",
        "feasibility_score": 7,
        "impact_score": 8,
        "novelty_score": 9,
        "why_matters": "Could revolutionize renewable energy implementation",
        "how_to_test": "Controlled study comparing AI vs static panel farms",
        "expected_outcome": "Discovery of microclimate effects"
    }}
]

Return only JSON, no other text."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        content = response.choices[0].message.content

        # Strip markdown code fences if present
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)

        hypotheses = json.loads(content)

        # Calculate overall scores and sort
        for i, h in enumerate(hypotheses):
            feas = h.get('feasibility_score', 5)
            impact = h.get('impact_score', 5)
            novelty = h.get('novelty_score', 5)
            
            # Ensure scores vary (not all same)
            if feas == impact == novelty:
                feas = min(10, max(1, feas + (i % 3)))
                impact = min(10, max(1, impact + ((i+1) % 3)))
                novelty = min(10, max(1, novelty + ((i+2) % 3)))
            
            h['feasibility_score'] = int(feas)
            h['impact_score'] = int(impact)
            h['novelty_score'] = int(novelty)
            h['overall_score'] = (feas + impact + novelty) / 3

        # Sort by overall score
        hypotheses = sorted(hypotheses, key=lambda x: x['overall_score'], reverse=True)

        return hypotheses[:10]  # Return top 10

    except json.JSONDecodeError as e:
        print(f"[!] Failed to parse hypothesis JSON: {e}")
        return []
    except Exception as e:
        print(f"[!] Hypothesis agent error: {e}")
        return []