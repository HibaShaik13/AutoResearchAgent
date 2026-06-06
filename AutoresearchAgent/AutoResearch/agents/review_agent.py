from groq import Groq
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def run_review_agent(papers: list, gap_analysis: str, topic: str) -> str:
    print("\n" + "="*50)
    print("[*] REVIEW GENERATOR AGENT ACTIVATED")
    print("="*50)

    try:
        print(f"[*] Generating literature review for: {topic}")

        combined_text = "\n\n".join([p.get("summary", "") for p in papers[:10]])
        
        prompt = f"""
        Write a detailed literature review on '{topic}'.

        Structure:
        - Introduction
        - Summary of Existing Work
        - Research Gaps
        - Conclusion

        Papers:
        {combined_text}

        Gap Analysis:
        {gap_analysis}
        """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        print("[+] Review Generated Successfully!")

        return response.choices[0].message.content

    except Exception as e:
        print(f"[!] Review Generation Error: {e}")
        return "Review generation failed"


def save_review(content: str, topic: str):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"outputs/reviews/{topic.replace(' ', '_')}_{timestamp}.md"

    os.makedirs("outputs/reviews", exist_ok=True)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[+] Review saved to: {filename}")