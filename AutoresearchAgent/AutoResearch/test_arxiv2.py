import arxiv

topics = ["brain-computer interfaces", "smart agriculture using ai", "agentic ai"]

for topic in topics:
    # 1. Original
    search1 = arxiv.Search(query=topic, max_results=2)
    results1 = list(arxiv.Client().results(search1))
    
    # 2. Cleaned
    stop_words = ["using", "with", "in", "for", "and", "the", "of", "on"]
    clean_topic = " ".join([w for w in topic.replace('-', ' ').split() if w.lower() not in stop_words])
    search2 = arxiv.Search(query=clean_topic, max_results=2)
    results2 = list(arxiv.Client().results(search2))
    
    print(f"Topic '{topic}':")
    print(f"  Original query ('{topic}'): {len(results1)} results")
    print(f"  Cleaned query ('{clean_topic}'): {len(results2)} results")
