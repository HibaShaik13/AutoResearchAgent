import arxiv
import time

def fetch_arxiv_papers(topic: str, max_results: int = 8) -> list:
    """
    Fetch research papers from ArXiv based on a topic
    """
    print(f"[*] Searching ArXiv for: {topic}")
    
    try:
        # Create a more robust search query by removing hyphens and stop words
        stop_words = {"using", "with", "in", "for", "and", "the", "of", "on", "a", "an", "to", "by", "from"}
        words = topic.replace('-', ' ').split()
        clean_words = [w for w in words if w.lower() not in stop_words]
        
        # If the user typed a very long sentence, keep it concise for ArXiv
        if len(clean_words) > 5:
            clean_words = clean_words[:5]
            
        clean_topic = " ".join(clean_words)
        
        # Create search query
        search = arxiv.Search(
            query=clean_topic,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance
        )
        
        papers = []
        # Execute search with a highly resilient client
        client = arxiv.Client(page_size=max_results, delay_seconds=5, num_retries=5)
        
        for result in client.results(search):
            paper = {
                "title": result.title,
                "authors": [author.name for author in result.authors[:3]],
                "abstract": result.summary[:500],
                "published": str(result.published.year),
                "url": result.entry_id,
                "source": "arxiv"
            }
            papers.append(paper)
            time.sleep(0.1)
        
        print(f"[+] Found {len(papers)} papers from ArXiv")
        return papers
    
    except Exception as e:
        print(f"[!] ArXiv Error: {e}")
        return []