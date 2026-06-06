from utils.arxiv_fetcher import fetch_arxiv_papers
from utils.semantic_fetcher import fetch_semantic_papers, remove_duplicates

def run_search_agent(topic: str, max_results: int = 8) -> list:
    """
    Search Agent — searches ArXiv + Semantic Scholar
    and returns combined unique papers
    """
    print("\n" + "="*50)
    print("[*] SEARCH AGENT ACTIVATED")
    print("="*50)
    print(f"[*] Topic: {topic}")
    print("="*50)
    
    # Fetch from both sources simultaneously
    arxiv_papers = fetch_arxiv_papers(topic, max_results)
    semantic_papers = fetch_semantic_papers(topic, max_results)
    
    # Combine and remove duplicates
    unique_papers = remove_duplicates(arxiv_papers, semantic_papers)
    
    if not unique_papers:
        print("[!] No papers found!! Try a different topic.")
        return []
    
    print(f"\n[+] Search Agent Complete!!")
    print(f"[+] Total unique papers found: {len(unique_papers)}")
    
    return unique_papers