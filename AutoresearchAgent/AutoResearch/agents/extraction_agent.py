from groq import Groq
import os
from dotenv import load_dotenv
import time

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_paper_info(paper: dict) -> dict:
    try:
        prompt = f"""
        Analyze this research paper:

        Title: {paper['title']}
        Abstract: {paper['abstract']}

        Provide:
        1. Key Contribution
        2. Methodology Used
        3. Main Findings
        """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "title": paper["title"],
            "authors": paper.get("authors", []),
            "summary": response.choices[0].message.content,
            "url": paper["url"]
        }

    except Exception as e:
        print(f"[!] Extraction Error for {paper['title'][:40]}: {e}")
        return paper


def run_extraction_agent(papers: list) -> list:
    print("\n" + "="*50)
    print("[*] EXTRACTION AGENT ACTIVATED")
    print("="*50)

    extracted = []

    for i, paper in enumerate(papers):
        print(f"[*] Extracting paper {i+1}/{len(papers)}: {paper['title'][:50]}...")
        result = extract_paper_info(paper)
        extracted.append(result)
        time.sleep(0.5)

    print("\n[+] Extraction Agent Complete!!")
    print(f"[+] Successfully extracted: {len(extracted)} papers")

    return extracted