import arxiv

stop_words = {"using", "with", "in", "for", "and", "the", "of", "on", "a", "an", "to", "by", "from"}
topic = "Quantum Computing"
words = topic.replace('-', ' ').split()
clean_words = [w for w in words if w.lower() not in stop_words]
if len(clean_words) > 5:
    clean_words = clean_words[:5]
clean_topic = " ".join(clean_words)

print(f"Clean topic: {clean_topic}")
search = arxiv.Search(query=clean_topic, max_results=10)
results = list(arxiv.Client().results(search))
print(f"Found {len(results)} results")
