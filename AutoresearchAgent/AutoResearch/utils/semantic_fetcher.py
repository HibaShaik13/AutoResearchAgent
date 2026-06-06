import requests
import time
import os
from dotenv import load_dotenv
from utils.rate_limiter import rate_limiter

load_dotenv()

def fetch_semantic_papers(topic: str, max_results: int = 8) -> list:
    """
    Fetch research papers from Semantic Scholar based on a topic
    """
    print(f"[*] Searching Semantic Scholar for: {topic}")
    
    try:
        # Semantic Scholar API endpoint
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        
        params = {
            "query": topic,
            "limit": max_results,
            "fields": "title,authors,abstract,year,url,externalIds"
        }
        
        headers = {
            "Accept": "application/json"
        }
        
        api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        if api_key:
            headers["x-api-key"] = api_key
        
        # Enforce 1‑second global rate limit
        rate_limiter.wait()
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        papers = []
        
        for paper in data.get("data", []):
            # Skip papers without abstract
            if not paper.get("abstract"):
                continue
                
            paper_info = {
                "title": paper.get("title", "Unknown Title"),
                "authors": [
                    author["name"] 
                    for author in paper.get("authors", [])[:3]
                ],
                "abstract": paper.get("abstract", "")[:500],
                "published": str(paper.get("year", "Unknown")),
                "url": paper.get("url", ""),
                "source": "semantic_scholar"
            }
            papers.append(paper_info)
            time.sleep(0.1)
        
        print(f"[+] Found {len(papers)} papers from Semantic Scholar")
        return papers
    
    except Exception as e:
        print(f"[!] Semantic Scholar Error: {e}")
        return []


def remove_duplicates(arxiv_papers: list, semantic_papers: list) -> list:
    """
    Combine both lists and remove duplicate papers by title
    """
    all_papers = arxiv_papers + semantic_papers
    
    seen_titles = set()
    unique_papers = []
    
    for paper in all_papers:
        # Clean title for comparison
        clean_title = paper["title"].lower().strip()
        
        if clean_title not in seen_titles:
            seen_titles.add(clean_title)
            unique_papers.append(paper)
    
    removed = len(all_papers) - len(unique_papers)
    print(f"[+] Combined results: {len(unique_papers)} unique papers ({removed} duplicates removed)")
    
    return unique_papers