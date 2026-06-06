import requests
params = {
    "query": "Quantum Computing",
    "limit": 10,
    "fields": "title,authors,abstract,year,url,externalIds"
}
urls = [
    "https://bgpt.pro/graph/v1/paper/search",
    "https://api.bgpt.pro/graph/v1/paper/search",
    "https://api.semanticscholar.org/graph/v1/paper/search"
]
for url in urls:
    try:
        r = requests.get(url, params=params, timeout=5)
        print(f"{url} -> Status {r.status_code}")
        if r.status_code == 200:
            print("  Success!")
    except Exception as e:
        print(f"{url} -> Error {e}")
