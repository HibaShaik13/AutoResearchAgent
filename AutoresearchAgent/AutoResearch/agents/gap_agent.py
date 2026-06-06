from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def run_gap_agent(papers: list, topic: str) -> str:
    print("\n" + "="*50)
    print("[*] GAP ANALYSIS AGENT ACTIVATED")
    print("="*50)

    try:
        print(f"[*] Analyzing {len(papers[:10])} papers for gaps...")

        combined_text = "\n\n".join([p.get("summary", "") for p in papers[:10]])

        prompt = f"""
        Based on the following research summaries on '{topic}', identify:

        1. Research gaps
        2. Limitations in existing work
        3. Future research directions

        Summaries:
        {combined_text}
        """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        print("[+] Gap Analysis Completed!")

        return response.choices[0].message.content

    except Exception as e:
        print(f"[!] Gap Analysis Error: {e}")
        return "Gap analysis failed"