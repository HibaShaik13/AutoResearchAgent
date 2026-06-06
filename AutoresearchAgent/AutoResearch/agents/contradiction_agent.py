from groq import Groq
import os
import json
import re

def contradiction_agent(papers, topic):
    """
    Finds contradictions between papers.
    
    Input:
    - papers: List of paper objects
    - topic: Research topic
    
    Output:
    - List of contradictions found
    """
    
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    # Prepare paper summaries
    papers_text = "\n".join([
        f"Paper {i+1} ({p.get('year', 'Unknown')}): {p.get('title', 'Unknown')}\n"
        f"Abstract: {p.get('abstract', '')[:300]}\n"
        f"Citations: {p.get('citations', 0)}\n"
        for i, p in enumerate(papers[:15])
    ])
    
    prompt = f"""Analyze these research papers on "{topic}" and identify CONTRADICTIONS between them.

PAPERS:
{papers_text}

Find statements or claims that contradict each other between different papers.

Return as JSON array with contradictions. IMPORTANT: Return ONLY valid JSON, nothing else.

Each contradiction must have:
- statement_1: first claim (string)
- paper_1: paper title (string)
- year_1: year (integer)
- citations_1: citations count (integer)
- statement_2: contradicting claim (string)
- paper_2: paper title (string)
- year_2: year (integer)
- citations_2: citations count (integer)
- analysis: explanation of contradiction (string)
- implication: what this means (string)

Example format:
[
    {{
        "statement_1": "Centralized control is more efficient",
        "paper_1": "Control Systems 2023",
        "year_1": 2023,
        "citations_1": 342,
        "statement_2": "Decentralized systems outperform centralized",
        "paper_2": "Distributed Systems 2024",
        "year_2": 2024,
        "citations_2": 89,
        "analysis": "Both papers present evidence but reach opposite conclusions",
        "implication": "Further research needed to determine which is superior"
    }}
]

Return only JSON, no other text. Find 3-5 contradictions if they exist."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            max_tokens=1500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.choices[0].message.content
        
        # Strip markdown code fences if present
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)
            
        contradictions = json.loads(content)
        
        return contradictions
        
    except json.JSONDecodeError as e:
        print("Failed to parse contradictions JSON")
        return []
    except Exception as e:
        print(f"Contradiction agent error: {e}")
        return []