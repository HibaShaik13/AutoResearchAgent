from groq import Groq
import os
import json
import re
from collections import Counter

def trend_agent(papers, topic):
    """
    Analyzes research trends and predicts future trends.
    
    Input:
    - papers: List of paper objects
    - topic: Research topic
    
    Output:
    - Trend analysis with predictions
    """
    
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    # Extract years and count
    years = [p.get('year', 2024) for p in papers if p.get('year')]
    year_counts = dict(sorted(Counter(years).items()))
    
    # Prepare trend text
    papers_summary = "\n".join([
        f"- {p.get('title', 'Unknown')} ({p.get('year', 'Unknown')})"
        for p in papers[:10]
    ])
    
    prompt = f"""Analyze the research trends on "{topic}" based on these papers.

PUBLICATION YEARS: {year_counts}

PAPERS:
{papers_summary}

Analyze:
1. Historical trend (2015-2024)
2. Current momentum
3. Emerging subtopics
4. 2025-2026 predictions

Return as JSON. IMPORTANT: Return ONLY valid JSON, nothing else.

Format:
{{
    "current_trend": "description of current state",
    "growth_rate": "percentage growth",
    "momentum": "increasing/decreasing/stable",
    "emerging_topics": ["topic1", "topic2"],
    "prediction_2025": "what will trend in 2025",
    "prediction_2026": "what will trend in 2026",
    "prediction_confidence": "high/medium/low",
    "key_drivers": ["driver1", "driver2"],
    "year_distribution": {year_counts}
}}

Return only JSON, no other text."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            max_tokens=1000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.choices[0].message.content
        
        # Strip markdown code fences if present
        json_match = re.search(r'\[.*\]|\{.*\}', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)
            
        trends = json.loads(content)
        
        # Add year distribution
        trends['year_distribution'] = year_counts
        
        return trends
        
    except json.JSONDecodeError:
        print("Failed to parse trends JSON")
        return {"current_trend": "Unable to analyze", "prediction_2025": "N/A"}
    except Exception as e:
        print(f"Trend agent error: {e}")
        return {"current_trend": "Error analyzing trends"}