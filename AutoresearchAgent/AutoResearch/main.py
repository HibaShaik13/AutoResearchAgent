import sys
import io

from agents.search_agent import run_search_agent
from agents.extraction_agent import run_extraction_agent
from agents.gap_agent import run_gap_agent
from agents.review_agent import run_review_agent, save_review
from agents.hypothesis_agent import hypothesis_agent
from agents.contradiction_agent import contradiction_agent
from agents.trend_agent import trend_agent
import time

def run_pipeline(topic: str):
    """
    Main pipeline — connects all 7 agents together
    """
    print("\n" + "="*50)
    print("   AUTORESEARCH AGENT -- PIPELINE STARTED")
    print("="*50)
    print(f"\n[*] Research Topic: {topic}\n")
    
    start_time = time.time()

    # -- AGENT 1 -- SEARCH --
    print("[1/7] Running Search Agent...")
    papers = run_search_agent(topic, max_results=10)
    
    if not papers:
        print("[!] No papers found!! Please try a different topic.")
        return
    
    print(f"[+] Found {len(papers)} papers\n")
    
    # -- AGENT 2 -- EXTRACTION --
    print("[2/7] Running Extraction Agent...")
    extracted_papers = run_extraction_agent(papers)
    
    if not extracted_papers:
        print("[!] Extraction failed!!")
        return
    
    print(f"[+] Extracted insights from {len(extracted_papers)} papers\n")
    
    # -- AGENT 3 -- GAP ANALYSIS --
    print("[3/7] Running Gap Analysis Agent...")
    gap_analysis = run_gap_agent(extracted_papers, topic)
    
    if not gap_analysis:
        print("[!] Gap analysis failed!!")
        return
    
    print(f"[+] Identified {len(gap_analysis)} research gaps\n")
    
    # -- AGENT 4 -- REVIEW GENERATOR --
    print("[4/7] Running Review Generator Agent...")
    review = run_review_agent(extracted_papers, gap_analysis, topic)
    
    if not review:
        print("[!] Review generation failed!!")
        return
    
    print("[+] Generated literature review\n")
    
    # -- AGENT 5 -- HYPOTHESIS GENERATOR --
    print("[5/7] Running Hypothesis Generation Agent...")
    hypotheses = hypothesis_agent(papers, gap_analysis, topic)
    
    if not hypotheses:
        print("[!] Hypothesis generation had issues, continuing...\n")
        hypotheses = []
    else:
        print(f"[+] Generated {len(hypotheses)} hypotheses\n")
    
    # -- AGENT 6 -- CONTRADICTION DETECTION --
    print("[6/7] Running Contradiction Detection Agent...")
    contradictions = contradiction_agent(papers, topic)
    
    if not contradictions:
        print("[+] No contradictions found (papers are consistent!)\n")
        contradictions = []
    else:
        print(f"[+] Found {len(contradictions)} contradictions\n")
    
    # -- AGENT 7 -- TREND PREDICTION --
    print("[7/7] Running Trend Prediction Agent...")
    trends = trend_agent(papers, topic)
    
    if not trends:
        print("[!] Trend analysis had issues, continuing...\n")
        trends = {}
    else:
        print("[+] Analyzed research trends\n")
    
    # -- SAVE REVIEW --
    filename = save_review(review, topic)
    
    end_time = time.time()
    total_time = round(end_time - start_time, 2)

    print("\n" + "="*50)
    print("   PIPELINE COMPLETED SUCCESSFULLY!!")
    print("="*50)
    print(f"\n[*] Summary:")
    print(f"   Papers found:           {len(papers)}")
    print(f"   Papers analyzed:        {len(extracted_papers)}")
    print(f"   Research gaps:          {len(gap_analysis)}")
    print(f"   Hypotheses generated:   {len(hypotheses)}")
    print(f"   Contradictions found:   {len(contradictions)}")
    print(f"   Trend analysis:         Done")
    print(f"   Review saved to:        {filename}")
    print(f"   Total time:             {total_time} seconds")
    print(f"\n[+] Your research analysis is ready!!")
    print("="*50 + "\n")
    
    return {
        "papers": papers,
        "extracted": extracted_papers,
        "gap_analysis": gap_analysis,
        "hypotheses": hypotheses,
        "contradictions": contradictions,
        "trends": trends,
        "review": review,
        "filename": filename
    }


if __name__ == "__main__":
    print("\n" + "="*50)
    print("   AUTORESEARCH AGENT")
    print("   Built by: Shaik Arfa Anjum")
    print("   Powered by: Groq API + ArXiv + Semantic Scholar")
    print("="*50)
    
    # Get topic from user
    topic = input("\n[?] Enter your research topic: ")
    
    if topic.strip():
        result = run_pipeline(topic)
    else:
        print("[!] Please enter a valid topic!!")