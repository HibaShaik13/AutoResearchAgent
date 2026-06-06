import arxiv
try:
    search = arxiv.Search(query="brain-computer interfaces", max_results=5)
    client = arxiv.Client()
    results = list(client.results(search))
    print(f"Found {len(results)} results")
except Exception as e:
    print(f"Error: {e}")
