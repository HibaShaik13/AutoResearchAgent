import json
import os

import streamlit as st

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from main import run_pipeline
from agents.chatbot_service import chatbot_response

st.set_page_config(
    page_title="AutoResearch Agent",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ══════════════════════════════════════════════
#  GLOBAL CSS — Deep Space + Neon Theme
# ══════════════════════════════════════════════
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap');

:root {
    --bg-deep:     #020818;
    --bg-card:     #0a1628;
    --bg-glass:    rgba(10, 22, 40, 0.85);
    --neon-cyan:   #00f5ff;
    --neon-purple: #bf5fff;
    --neon-pink:   #ff2d8d;
    --neon-green:  #00ff9d;
    --neon-gold:   #ffd700;
    --text-main:   #e8f4fd;
    --text-white:  white;
    --border:      rgba(0,245,255,0.2);
}

/* ── Base ── */
html, body, [class*="css"] {
    font-family: 'Exo 2', sans-serif;
    background-color: var(--bg-deep) !important;
    color: var(--text-main) !important;
}

.stApp {
    background:
        radial-gradient(ellipse at 20% 20%, rgba(0,245,255,0.06) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 80%, rgba(191,95,255,0.06) 0%, transparent 60%),
        radial-gradient(ellipse at 50% 50%, rgba(255,45,141,0.03) 0%, transparent 70%),
        #020818;
}

/* ── Hero Header ── */
.hero-header {
    text-align: center;
    padding: 60px 20px 40px;
    position: relative;
}

.hero-title {
    font-family: 'Orbitron', monospace;
    font-weight: 900;
    font-size: clamp(2.2rem, 5vw, 4rem);
    background: linear-gradient(135deg, #00f5ff 0%, #bf5fff 50%, #ff2d8d 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 3px;
    margin-bottom: 8px;
    text-shadow: none;
    animation: titlePulse 3s ease-in-out infinite;
}

@keyframes titlePulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
}

.hero-subtitle {
    font-family: 'Exo 2', sans-serif;
    font-size: 1.1rem;
    color: var(--text-dim);
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-bottom: 20px;
}

.hero-badge {
    display: inline-block;
    background: linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,95,255,0.1));
    border: 1px solid var(--neon-cyan);
    border-radius: 30px;
    padding: 8px 24px;
    font-size: 0.85rem;
    color: var(--neon-cyan);
    letter-spacing: 2px;
    margin: 4px;
}

/* ── Divider ── */
.neon-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-purple), var(--neon-pink), transparent);
    margin: 30px 0;
    opacity: 0.6;
}

/* ── Cards ── */
.glass-card {
    background: var(--bg-glass);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.glass-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--neon-cyan), var(--neon-purple), var(--neon-pink));
}

.glass-card:hover {
    border-color: rgba(0,245,255,0.4);
    box-shadow: 0 0 30px rgba(0,245,255,0.08);
}

.card-cyan::before   { background: linear-gradient(90deg, #00f5ff, #0080ff); }
.card-purple::before { background: linear-gradient(90deg, #bf5fff, #ff2d8d); }
.card-green::before  { background: linear-gradient(90deg, #00ff9d, #00f5ff); }
.card-gold::before   { background: linear-gradient(90deg, #ffd700, #ff8c00); }
.card-red::before    { background: linear-gradient(90deg, #ff4444, #ff2d8d); }
.card-orange::before { background: linear-gradient(90deg, #ff8c00, #ffd700); }

/* ── Section Titles ── */
.section-title {
    font-family: 'Orbitron', monospace;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.title-cyan   { color: var(--neon-cyan); }
.title-purple { color: var(--neon-purple); }
.title-green  { color: var(--neon-green); }
.title-gold   { color: var(--neon-gold); }
.title-pink   { color: var(--neon-pink); }
.title-red    { color: #ff4444; }
.title-orange { color: #ff8c00; }

/* ── Input Box ── */
.stTextInput > div > div > input {
    background: #0a1628 !important;
    border: 1px solid #00f5ff !important;
    border-radius: 12px !important;
    color: #ffffff !important;
    font-family: 'Exo 2', sans-serif !important;
    font-size: 1rem !important;
    padding: 14px 20px !important;
    transition: border-color 0.3s, box-shadow 0.3s !important;
}

.stTextInput > div > div > input:focus {
    border-color: #00f5ff !important;
    box-shadow: 0 0 20px rgba(0,245,255,0.3) !important;
}

.stTextInput > div > div > input::placeholder {
    color: #7a9bbf !important;
}

/* ── Button ── */
.stButton > button {
    width: 100% !important;
    padding: 16px 32px !important;
    font-family: 'Orbitron', monospace !important;
    font-size: 0.9rem !important;
    font-weight: 700 !important;
    letter-spacing: 3px !important;
    color: #020818 !important;
    background: linear-gradient(135deg, #00f5ff, #bf5fff) !important;
    border: none !important;
    border-radius: 12px !important;
    cursor: pointer !important;
    transition: all 0.3s !important;
    text-transform: uppercase !important;
}

.stButton > button:hover {
    background: linear-gradient(135deg, #bf5fff, #ff2d8d) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 30px rgba(0,245,255,0.3) !important;
}

/* ── Paper Cards ── */
.paper-card {
    background: rgba(0,245,255,0.03);
    border: 1px solid rgba(0,245,255,0.12);
    border-left: 3px solid var(--neon-cyan);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 16px;
    transition: all 0.3s;
}

.paper-card:hover {
    background: rgba(0,245,255,0.06);
    border-left-color: var(--neon-purple);
    transform: translateX(4px);
}

.paper-title {
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: var(--neon-cyan);
    margin-bottom: 8px;
}

.paper-abstract {
    color: var(--text-dim);
    font-size: 0.88rem;
    line-height: 1.6;
    margin-bottom: 10px;
}

.paper-link {
    color: var(--neon-purple);
    font-size: 0.82rem;
    text-decoration: none;
    letter-spacing: 1px;
}

.paper-source {
    display: inline-block;
    font-size: 0.72rem;
    padding: 3px 10px;
    border-radius: 20px;
    margin-right: 8px;
    font-weight: 600;
    letter-spacing: 1px;
}

.source-arxiv    { background: rgba(0,245,255,0.15); color: var(--neon-cyan); }
.source-semantic { background: rgba(191,95,255,0.15); color: var(--neon-purple); }

/* ── Stats Row ── */
.stat-box {
    background: rgba(0,245,255,0.05);
    border: 1px solid rgba(0,245,255,0.2);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
}

.stat-number {
    font-family: 'Orbitron', monospace;
    font-size: 2.5rem;
    font-weight: 900;
    background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-label {
    color: var(--text-dim);
    font-size: 0.8rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 6px;
}

/* ── Download Button ── */
.stDownloadButton > button {
    background: linear-gradient(135deg, rgba(0,255,157,0.15), rgba(0,245,255,0.15)) !important;
    border: 1px solid var(--neon-green) !important;
    color: var(--neon-green) !important;
    font-family: 'Orbitron', monospace !important;
    font-size: 0.8rem !important;
    letter-spacing: 2px !important;
    border-radius: 10px !important;
    padding: 12px 24px !important;
    width: 100% !important;
    transition: all 0.3s !important;
}

.stDownloadButton > button:hover {
    background: linear-gradient(135deg, rgba(0,255,157,0.3), rgba(0,245,255,0.3)) !important;
    box-shadow: 0 0 20px rgba(0,255,157,0.2) !important;
}

/* ── Spinner ── */
.stSpinner > div {
    border-color: var(--neon-cyan) transparent transparent transparent !important;
}

/* ── Success/Error ── */
.stSuccess {
    background: rgba(0,255,157,0.1) !important;
    border: 1px solid var(--neon-green) !important;
    border-radius: 10px !important;
    color: var(--neon-green) !important;
}

.stAlert {
    border-radius: 10px !important;
}

/* ── Pipeline Steps ── */
.pipeline-step {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    background: rgba(0,245,255,0.04);
    border: 1px solid rgba(0,245,255,0.1);
    border-radius: 12px;
    margin-bottom: 10px;
}

.step-icon {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
}

.step-text {
    font-family: 'Exo 2', sans-serif;
    font-size: 0.9rem;
    color: #ffffff !important;
    letter-spacing: 1px;
}

.step-active { border-color: rgba(0,245,255,0.4); color: var(--neon-cyan); }

/* ── Chat Styling ── */
.chat-message {
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 12px;
    word-wrap: break-word;
}

.chat-user {
    background: rgba(0,245,255,0.15);
    border-left: 3px solid #00f5ff;
    color: #ffffff;
}

.chat-assistant {
    background: rgba(191,95,255,0.15);
    border-left: 3px solid #bf5fff;
    color: #ffffff;
}

/* ── Hypothesis Card ── */
.hypothesis-card {
    background: rgba(255,45,141,0.05);
    border: 1px solid rgba(255,45,141,0.2);
    border-left: 3px solid #ff2d8d;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
}

.hypothesis-score {
    display: inline-block;
    background: rgba(0,245,255,0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    color: #00f5ff;
    font-weight: 600;
}

/* ── Contradiction Card ── */
.contradiction-card {
    background: rgba(255,68,68,0.05);
    border: 1px solid rgba(255,68,68,0.2);
    border-left: 3px solid #ff4444;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
}

.contradiction-vs {
    text-align: center;
    color: #ff4444;
    font-weight: 700;
    margin: 12px 0;
    font-size: 1.2rem;
}

/* ── Trend Card ── */
.trend-card {
    background: rgba(255,140,0,0.05);
    border: 1px solid rgba(255,140,0,0.2);
    border-left: 3px solid #ff8c00;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
}

/* ── Footer ── */
.footer {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-dim);
    font-size: 0.8rem;
    letter-spacing: 2px;
}

.footer span {
    color: var(--neon-pink);
}

/* Hide streamlit defaults */
#MainMenu, footer, header { visibility: hidden; }
.block-container { padding-top: 0 !important; max-width: 1200px; }

/* ── FORCE ALL GENERATED TEXT TO WHITE ── */
.review-content,
.gap-content,
.paper-abstract,
.stat-label,
p, span, li, div {
    color: #ffffff !important;
}
</style>
""", unsafe_allow_html=True)


# ══════════════════════════════════════════════
#  CHART HELPERS
# ══════════════════════════════════════════════
def make_bar_chart(gap_text):
    keywords = {
        "Data": gap_text.lower().count("data"),
        "Models": gap_text.lower().count("model"),
        "Efficiency": gap_text.lower().count("effici"),
        "Scalability": gap_text.lower().count("scal"),
        "Language": gap_text.lower().count("language"),
        "Bias": gap_text.lower().count("bias"),
    }
    keywords = {k: max(v, 1) for k, v in keywords.items()}

    colors = ['#00f5ff','#bf5fff','#ff2d8d','#ffd700','#00ff9d','#ff8c00']
    fig, ax = plt.subplots(figsize=(7, 4))
    fig.patch.set_facecolor('#0a1628')
    ax.set_facecolor('#0a1628')

    bars = ax.bar(keywords.keys(), keywords.values(), color=colors, width=0.6, zorder=3)

    for bar, color in zip(bars, colors):
        ax.bar(bar.get_x() + bar.get_width()/2, bar.get_height(),
               width=bar.get_width(), color=color, alpha=0.15, zorder=2)

    ax.set_title("Research Gap Frequency Analysis", color='#00f5ff',
                 fontsize=12, fontweight='bold', pad=15)
    ax.set_ylabel("Frequency", color='#7a9bbf', fontsize=10)
    ax.tick_params(colors='#7a9bbf', labelsize=9)
    ax.spines[['top','right','left','bottom']].set_color('#1a2a3a')
    ax.yaxis.grid(True, color='#1a2a3a', linewidth=0.8, zorder=1)
    ax.set_axisbelow(True)
    plt.xticks(rotation=20)
    plt.tight_layout()
    return fig


def make_pie_chart(gap_text):
    keywords = {
        "Data": gap_text.lower().count("data"),
        "Models": gap_text.lower().count("model"),
        "Efficiency": gap_text.lower().count("effici"),
        "Time": gap_text.lower().count("time"),
        "Language": gap_text.lower().count("language"),
    }
    keywords = {k: max(v, 1) for k, v in keywords.items()}

    colors = ['#00f5ff','#bf5fff','#ff2d8d','#ffd700','#00ff9d']
    fig, ax = plt.subplots(figsize=(6, 5))
    fig.patch.set_facecolor('#0a1628')
    ax.set_facecolor('#0a1628')

    wedges, texts, autotexts = ax.pie(
        keywords.values(),
        labels=keywords.keys(),
        autopct='%1.1f%%',
        colors=colors,
        startangle=140,
        pctdistance=0.75,
        wedgeprops=dict(width=0.6, edgecolor='#020818', linewidth=2)
    )

    for text in texts:
        text.set_color('#7a9bbf')
        text.set_fontsize(9)
    for autotext in autotexts:
        autotext.set_color('#020818')
        autotext.set_fontsize(8)
        autotext.set_fontweight('bold')

    ax.set_title("Gap Distribution", color='#bf5fff',
                 fontsize=12, fontweight='bold', pad=15)
    plt.tight_layout()
    return fig


# ══════════════════════════════════════════════
#  PAGE ROUTING (SIDEBAR NAVIGATION)
# ══════════════════════════════════════════════

# Initialise page in session_state so navigation persists across reruns
if "current_page" not in st.session_state:
    st.session_state["current_page"] = "🏠 Home"

# If a programmatic redirect was requested, apply it before rendering the radio
if "_nav_page" in st.session_state:
    st.session_state["current_page"] = st.session_state.pop("_nav_page")

_pages = ["🏠 Home", "🔬 New Research", "📄 Report", "💬 Chatbot"]

# Add custom CSS for sidebar styling
st.markdown("""
<style>
.stSidebar {
    background: var(--bg-card);
    color: var(--text-main);
    padding: 20px;
    border-right: 1px solid var(--border);
}
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("""
    <div style="text-align: center; padding: 20px 0;">
        <div style="font-family: 'Orbitron', monospace; font-size: 1.3rem; 
                    background: linear-gradient(135deg, #00f5ff, #bf5fff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 2px; margin-bottom: 20px;">
            🔬 AUTORESEARCH
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    _default_idx = _pages.index(st.session_state["current_page"]) if st.session_state["current_page"] in _pages else 0

    page = st.radio(
        "Navigate",
        _pages,
        index=_default_idx,
        label_visibility="collapsed",
        key="sidebar_nav"
    )
    # Keep session_state in sync with whatever the user clicks in the sidebar
    st.session_state["current_page"] = page


# ══════════════════════════════════════════════
#  PAGE 1: HOME
# ══════════════════════════════════════════════
if page == "🏠 Home":
    st.markdown("""
    <div class="hero-header">
        <div class="hero-title">⚡ AUTORESEARCH AGENT</div>
        <div class="hero-subtitle">Autonomous Literature Intelligence System</div>
        <div>
            <span class="hero-badge">🤖 GROQ AI</span>
            <span class="hero-badge">📡 ARXIV</span>
            <span class="hero-badge">🔬 SEMANTIC SCHOLAR</span>
            <span class="hero-badge">🧠 LLAMA 3</span>
        </div>
    </div>
    <div class="neon-divider"></div>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns([3, 2])

    with col1:
        st.markdown("""
        <div class="glass-card card-cyan">
            <div class="section-title title-cyan">🔍 Research Intelligence Pipeline</div>
            <div class="pipeline-step">
                <div class="step-icon">🔍</div>
                <div>
                    <div style="color:#00f5ff; font-weight:600; font-size:0.9rem;">AGENT 1 — Search Agent</div>
                    <div class="step-text">Scans ArXiv + Semantic Scholar simultaneously</div>
                </div>
            </div>
            <div class="pipeline-step">
                <div class="step-icon">📄</div>
                <div>
                    <div style="color:#bf5fff; font-weight:600; font-size:0.9rem;">AGENT 2 — Extraction Agent</div>
                    <div class="step-text">Extracts key findings using LLaMA 3 AI</div>
                </div>
            </div>
            <div class="pipeline-step">
                <div class="step-icon">🧠</div>
                <div>
                    <div style="color:#ff2d8d; font-weight:600; font-size:0.9rem;">AGENT 3 — Gap Analysis Agent</div>
                    <div class="step-text">Identifies research gaps & contradictions</div>
                </div>
            </div>
            <div class="pipeline-step">
                <div class="step-icon">📝</div>
                <div>
                    <div style="color:#ffd700; font-weight:600; font-size:0.9rem;">AGENT 4 — Review Generator</div>
                    <div class="step-text">Generates complete literature review</div>
                </div>
            </div>
            <div class="pipeline-step">
                <div class="step-icon">💡</div>
                <div>
                    <div style="color:#ff2d8d; font-weight:600; font-size:0.9rem;">AGENT 5 — Hypothesis Generator</div>
                    <div class="step-text">Creates novel research hypotheses</div>
                </div>
            </div>
            <div class="pipeline-step">
                <div class="step-icon">⚠️</div>
                <div>
                    <div style="color:#ff4444; font-weight:600; font-size:0.9rem;">AGENT 6 — Contradiction Detector</div>
                    <div class="step-text">Finds conflicting statements in papers</div>
                </div>
            </div>
            <div class="pipeline-step">
                <div class="step-icon">📈</div>
                <div>
                    <div style="color:#ff8c00; font-weight:600; font-size:0.9rem;">AGENT 7 — Trend Predictor</div>
                    <div class="step-text">Analyzes research trends & predictions</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="glass-card card-purple">
            <div class="section-title title-purple">⚡ Capabilities</div>
            <div style="color:#7a9bbf; font-size:0.88rem; line-height:2.2;">
                ✦ &nbsp; Multi-source paper discovery<br>
                ✦ &nbsp; AI-powered key finding extraction<br>
                ✦ &nbsp; Deep research gap analysis<br>
                ✦ &nbsp; Novel hypothesis generation<br>
                ✦ &nbsp; Contradiction detection<br>
                ✦ &nbsp; Research trend prediction<br>
                ✦ &nbsp; Professional literature review<br>
                ✦ &nbsp; Interactive chatbot Q&A<br>
                ✦ &nbsp; Visual analytics & charts<br>
                ✦ &nbsp; One-click report download
            </div>
        </div>
        """, unsafe_allow_html=True)

    # ── START BUTTON on Home page ──
    st.markdown('<div class="neon-divider"></div>', unsafe_allow_html=True)

    st.markdown("""
    <div style="text-align:center; padding: 20px 0 10px;">
        <div style="font-family:'Exo 2',sans-serif; color:#7a9bbf; font-size:0.95rem; letter-spacing:2px; margin-bottom:24px;">
            READY TO EXPLORE THE FRONTIERS OF RESEARCH?
        </div>
    </div>
    """, unsafe_allow_html=True)

    col_left, col_center, col_right = st.columns([1, 2, 1])
    with col_center:
        if st.button("🚀  START RESEARCH NOW", key="home_start_btn"):
            st.session_state["_nav_page"] = "🔬 New Research"
            st.rerun()

    st.markdown('<div class="neon-divider"></div>', unsafe_allow_html=True)


# ══════════════════════════════════════════════
#  PAGE 2: NEW RESEARCH
# ══════════════════════════════════════════════
elif page == "🔬 New Research":
    st.markdown("""
    <div class="glass-card">
        <div class="section-title title-cyan">🚀 Launch Research Pipeline</div>
    """, unsafe_allow_html=True)

    # Persist the topic across reruns so the input doesn't clear
    if "research_topic_input" not in st.session_state:
        st.session_state["research_topic_input"] = ""

    topic = st.text_input(
    "Research Topic",
    placeholder="e.g. Agentic AI Systems, Large Language Models, RAG pipelines...",
    label_visibility="collapsed",
    key="research_topic_input"
)

    run_btn = st.button("⚡  INITIATE RESEARCH PIPELINE")

    st.markdown("</div>", unsafe_allow_html=True)

    if run_btn:
        if not topic.strip():
            st.error("❌ Please enter a research topic to proceed!!")
        else:
            with st.spinner("🤖 AI Agents running... Please wait 1-2 minutes ⏳"):
                result = run_pipeline(topic)

            if not result:
                st.error("❌ Pipeline failed!! Please try again.")
            else:
                st.success("✅ Research Pipeline Completed Successfully!!")
                st.markdown('<div class="neon-divider"></div>', unsafe_allow_html=True)

                # Store in session state for chatbot
                st.session_state.current_result = result
                st.session_state.current_topic = topic


                # Save chat history (empty at start of new research)
                st.session_state.chat_history = []

                # ── STATS ──
                st.markdown("""
                <div class="section-title title-green" style="justify-content:center; font-size:1rem;">
                    📊 PIPELINE RESULTS
                </div>
                """, unsafe_allow_html=True)

                c1, c2, c3, c4, c5, c6, c7 = st.columns(7)
                with c1:
                    st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-number">{len(result['papers'])}</div>
                        <div class="stat-label">Papers</div>
                    </div>""", unsafe_allow_html=True)
                with c2:
                    st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-number">{len(result['gap_analysis'].split('**Gap'))}</div>
                        <div class="stat-label">Gaps</div>
                    </div>""", unsafe_allow_html=True)
                with c3:
                    st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-number">{len(result.get('hypotheses', []))}</div>
                        <div class="stat-label">Hypotheses</div>
                    </div>""", unsafe_allow_html=True)
                with c4:
                    st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-number">{len(result.get('contradictions', []))}</div>
                        <div class="stat-label">Contradictions</div>
                    </div>""", unsafe_allow_html=True)
                with c5:
                    st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-number">7</div>
                        <div class="stat-label">AI Agents</div>
                    </div>""", unsafe_allow_html=True)
                with c6:
                    word_count = len(result['review'].split())
                    st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-number">{word_count}</div>
                        <div class="stat-label">Words</div>
                    </div>""", unsafe_allow_html=True)
                with c7:
                    st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-number">✅</div>
                        <div class="stat-label">Complete</div>
                    </div>""", unsafe_allow_html=True)

                st.markdown('<div class="neon-divider"></div>', unsafe_allow_html=True)

                # ── TABS FOR RESULTS ──
                tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(
                    ["📚 Papers", "🧠 Gaps", "💡 Hypotheses", "⚠️ Contradictions", "📈 Trends", "📄 Review"]
                )

                # TAB 1: PAPERS
                with tab1:
                    st.markdown("""
                    <div class="glass-card card-cyan">
                        <div class="section-title title-cyan">📚 Discovered Papers</div>
                    """, unsafe_allow_html=True)
                    
                    for i, paper in enumerate(result["papers"]):
                        source = paper.get("source", "arxiv")
                        source_class = "source-arxiv" if source == "arxiv" else "source-semantic"
                        source_label = "ArXiv" if source == "arxiv" else "Semantic Scholar"
                        
                        st.markdown(f"""
                        <div class="paper-card">
                            <div class="paper-title">{paper.get('title', 'Unknown')}</div>
                            <div style="color:#7a9bbf; font-size:0.85rem; margin-bottom:8px;">
                                <span class="paper-source {source_class}">{source_label}</span>
                                <span style="color:#00f5ff;">📅 {paper.get('year', 'N/A')}</span>
                            </div>
                            <div class="paper-abstract">{paper.get('abstract', 'No abstract available')[:300]}...</div>
                            <a href="{paper.get('url', '#')}" target="_blank" class="paper-link">🔗 Read Full Paper</a>
                        </div>
                        """, unsafe_allow_html=True)
                    
                    st.markdown('</div>', unsafe_allow_html=True)

                # TAB 2: GAPS
                with tab2:
                    st.markdown("""
                    <div class="glass-card card-purple">
                        <div class="section-title title-purple">🧠 Research Gaps</div>
                    """, unsafe_allow_html=True)
                    
                    gap_text = result["gap_analysis"].strip()
                    if gap_text.startswith("**"):
                        gap_text = gap_text.lstrip("*").strip()
                    
                    st.markdown(f'<div class="gap-content" style="overflow: visible; white-space: normal;">', unsafe_allow_html=True)
                    st.markdown(gap_text)
                    st.markdown('</div></div>', unsafe_allow_html=True)

                    # Charts
                    col_bar, col_pie = st.columns(2)
                    with col_bar:
                        fig1 = make_bar_chart(result["gap_analysis"])
                        st.pyplot(fig1)
                        plt.close()
                    with col_pie:
                        fig2 = make_pie_chart(result["gap_analysis"])
                        st.pyplot(fig2)
                        plt.close()

                # TAB 3: HYPOTHESES
                with tab3:
                    st.markdown("""
                    <div class="glass-card card-pink">
                        <div class="section-title" style="color:#ff2d8d;">💡 Generated Hypotheses</div>
                    """, unsafe_allow_html=True)
                    
                    hypotheses = result.get('hypotheses', [])
                    
                    if hypotheses:
                        for i, hyp in enumerate(hypotheses[:10], 1):
                            st.markdown(f"""
                            <div class="hypothesis-card">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="color:#ff2d8d; font-weight:700; font-size:1rem;">
                                        💡 Hypothesis #{i}
                                    </div>
                                    <span class="hypothesis-score">{hyp.get('overall_score', 0):.1f}/10</span>
                                </div>
                                <div style="color:#ffffff; font-weight:600; margin:12px 0; font-size:0.95rem;">
                                    {hyp.get('title', 'N/A')}
                                </div>
                                <div style="color:#e8f4fd; margin-bottom:12px; font-size:0.9rem;">
                                    {hyp.get('description', 'N/A')}
                                </div>
                                <div style="display: flex; gap:20px; margin:12px 0;">
                                    <div>
                                        <div style="color:#00f5ff; font-size:0.85rem;">Feasibility</div>
                                        <div style="color:#ffffff; font-weight:700;">{hyp.get('feasibility_score', 0)}/10</div>
                                    </div>
                                    <div>
                                        <div style="color:#00f5ff; font-size:0.85rem;">Impact</div>
                                        <div style="color:#ffffff; font-weight:700;">{hyp.get('impact_score', 0)}/10</div>
                                    </div>
                                    <div>
                                        <div style="color:#00f5ff; font-size:0.85rem;">Novelty</div>
                                        <div style="color:#ffffff; font-weight:700;">{hyp.get('novelty_score', 0)}/10</div>
                                    </div>
                                </div>
                                <div style="color:#7a9bbf; margin-top:12px; font-size:0.9rem;">
                                    <strong>Why it matters:</strong> {hyp.get('why_matters', 'N/A')[:200]}...
                                </div>
                                <div style="color:#7a9bbf; margin-top:8px; font-size:0.9rem;">
                                    <strong>How to test:</strong> {hyp.get('how_to_test', 'N/A')[:200]}...
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                    else:
                        st.info("No hypotheses generated yet.")
                    
                    st.markdown('</div>', unsafe_allow_html=True)

                # TAB 4: CONTRADICTIONS
                with tab4:
                    st.markdown("""
                    <div class="glass-card card-red">
                        <div class="section-title title-red">⚠️ Contradictions Found</div>
                    """, unsafe_allow_html=True)
                    
                    contradictions = result.get('contradictions', [])
                    
                    if contradictions:
                        for i, contra in enumerate(contradictions, 1):
                            st.markdown(f"""
                            <div class="contradiction-card">
                                <div style="color:#ff4444; font-weight:700; font-size:1.1rem; margin-bottom:12px;">
                                    ⚠️ Contradiction #{i}
                                </div>
                                <div style="background: rgba(0,245,255,0.1); padding:12px; border-radius:8px; margin-bottom:12px;">
                                    <div style="color:#00f5ff; font-weight:600; font-size:0.9rem;">Statement 1:</div>
                                    <div style="color:#ffffff;">{contra.get('statement_1', 'N/A')}</div>
                                    <div style="color:#7a9bbf; font-size:0.85rem; margin-top:6px;">
                                        📄 {contra.get('paper_1', 'Unknown')} ({contra.get('year_1', 'N/A')})
                                    </div>
                                </div>
                                <div class="contradiction-vs">VS</div>
                                <div style="background: rgba(191,95,255,0.1); padding:12px; border-radius:8px;">
                                    <div style="color:#bf5fff; font-weight:600; font-size:0.9rem;">Statement 2:</div>
                                    <div style="color:#ffffff;">{contra.get('statement_2', 'N/A')}</div>
                                    <div style="color:#7a9bbf; font-size:0.85rem; margin-top:6px;">
                                        📄 {contra.get('paper_2', 'Unknown')} ({contra.get('year_2', 'N/A')})
                                    </div>
                                </div>
                                <div style="color:#e8f4fd; margin-top:12px; font-size:0.9rem;">
                                    <strong>Analysis:</strong> {contra.get('analysis', 'N/A')[:200]}...
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                    else:
                        st.info("No contradictions found. Papers are consistent!")
                    
                    st.markdown('</div>', unsafe_allow_html=True)

                # TAB 5: TRENDS
                with tab5:
                    st.markdown("""
                    <div class="glass-card card-orange">
                        <div class="section-title title-orange">📈 Research Trends</div>
                    """, unsafe_allow_html=True)
                    
                    trends = result.get('trends', {})
                    
                    if trends:
                        col_t1, col_t2, col_t3 = st.columns(3)
                        
                        with col_t1:
                            st.markdown(f"""
                            <div class="trend-card" style="text-align:center;">
                                <div style="color:#ff8c00; font-weight:700; font-size:1.1rem;">Momentum</div>
                                <div style="color:#ffffff; font-size:0.95rem; margin-top:8px;">
                                    {trends.get('momentum', 'N/A')}
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                        
                        with col_t2:
                            st.markdown(f"""
                            <div class="trend-card" style="text-align:center;">
                                <div style="color:#ff8c00; font-weight:700; font-size:1.1rem;">Growth Rate</div>
                                <div style="color:#ffffff; font-size:0.95rem; margin-top:8px;">
                                    {trends.get('growth_rate', 'N/A')}
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                        
                        with col_t3:
                            st.markdown(f"""
                            <div class="trend-card" style="text-align:center;">
                                <div style="color:#ff8c00; font-weight:700; font-size:1.1rem;">Confidence</div>
                                <div style="color:#ffffff; font-size:0.95rem; margin-top:8px;">
                                    {trends.get('prediction_confidence', 'N/A')}
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                        
                        st.markdown(f"""
                        <div style="background: rgba(255,140,0,0.1); padding:16px; border-radius:12px; margin-top:16px;">
                            <div style="color:#ff8c00; font-weight:700; margin-bottom:8px;">Current State</div>
                            <div style="color:#ffffff;">{trends.get('current_trend', 'N/A')}</div>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        if trends.get('emerging_topics'):
                            st.markdown("""
                            <div style="margin-top:16px;">
                                <div style="color:#ff8c00; font-weight:700; margin-bottom:8px;">Emerging Topics</div>
                            </div>
                            """, unsafe_allow_html=True)
                            for topic_item in trends.get('emerging_topics', []):
                                st.markdown(f"• **{topic_item}**")
                        
                        col_pred1, col_pred2 = st.columns(2)
                        with col_pred1:
                            st.markdown(f"""
                            <div style="background: rgba(0,245,255,0.1); padding:16px; border-radius:12px;">
                                <div style="color:#00f5ff; font-weight:700; margin-bottom:8px;">2025 Prediction</div>
                                <div style="color:#ffffff;">{trends.get('prediction_2025', 'N/A')}</div>
                            </div>
                            """, unsafe_allow_html=True)
                        with col_pred2:
                            st.markdown(f"""
                            <div style="background: rgba(191,95,255,0.1); padding:16px; border-radius:12px;">
                                <div style="color:#bf5fff; font-weight:700; margin-bottom:8px;">2026 Prediction</div>
                                <div style="color:#ffffff;">{trends.get('prediction_2026', 'N/A')}</div>
                            </div>
                            """, unsafe_allow_html=True)
                    else:
                        st.info("No trend analysis available.")
                    
                    st.markdown('</div>', unsafe_allow_html=True)

                # TAB 6: LITERATURE REVIEW
                with tab6:
                    st.markdown("""
                    <div class="glass-card card-cyan">
                        <div class="section-title title-cyan">📄 Literature Review</div>
                    """, unsafe_allow_html=True)
                    
                    st.markdown(f'<div class="review-content">', unsafe_allow_html=True)
                    st.markdown(result["review"])
                    st.markdown('</div></div>', unsafe_allow_html=True)

                st.markdown('<div class="neon-divider"></div>', unsafe_allow_html=True)

                # ── BUILD FULL REPORT FROM ALL AGENT OUTPUTS ──
                papers_section = ""
                for i, paper in enumerate(result.get("papers", []), 1):
                    papers_section += f"### {i}. {paper.get('title', 'Unknown')}\n"
                    papers_section += f"- **Source:** {paper.get('source', 'N/A')}  \n"
                    papers_section += f"- **Year:** {paper.get('year', 'N/A')}  \n"
                    papers_section += f"- **URL:** {paper.get('url', 'N/A')}  \n"
                    papers_section += f"- **Abstract:** {paper.get('abstract', 'No abstract available')[:500]}  \n\n"

                hypotheses_section = ""
                for i, hyp in enumerate(result.get("hypotheses", []), 1):
                    if isinstance(hyp, dict):
                        hypotheses_section += f"### Hypothesis {i}\n"
                        hypotheses_section += f"- **Statement:** {hyp.get('hypothesis', hyp.get('statement', str(hyp)))}  \n"
                        hypotheses_section += f"- **Rationale:** {hyp.get('rationale', 'N/A')}  \n\n"
                    else:
                        hypotheses_section += f"### Hypothesis {i}\n{hyp}\n\n"

                contradictions_section = ""
                for i, con in enumerate(result.get("contradictions", []), 1):
                    if isinstance(con, dict):
                        contradictions_section += f"### Contradiction {i}\n"
                        contradictions_section += f"- **Description:** {con.get('description', con.get('contradiction', str(con)))}  \n"
                        contradictions_section += f"- **Papers:** {con.get('papers', 'N/A')}  \n\n"
                    else:
                        contradictions_section += f"### Contradiction {i}\n{con}\n\n"

                trends = result.get("trends", {})
                trends_section = ""
                if trends:
                    trends_section += f"- **Momentum:** {trends.get('momentum', 'N/A')}  \n"
                    trends_section += f"- **Growth Rate:** {trends.get('growth_rate', 'N/A')}  \n"
                    trends_section += f"- **Current Trend:** {trends.get('current_trend', 'N/A')}  \n"
                    trends_section += f"- **Prediction Confidence:** {trends.get('prediction_confidence', 'N/A')}  \n"
                    if trends.get('emerging_topics'):
                        trends_section += "- **Emerging Topics:**  \n"
                        for t in trends.get('emerging_topics', []):
                            trends_section += f"  - {t}  \n"
                    trends_section += f"- **2025 Prediction:** {trends.get('prediction_2025', 'N/A')}  \n"
                    trends_section += f"- **2026 Prediction:** {trends.get('prediction_2026', 'N/A')}  \n"
                else:
                    trends_section = "No trend analysis available.\n"

                full_report = f"""# 🔬 AutoResearch — Full Research Report
## Topic: {topic}

---

## 📚 1. Discovered Papers ({len(result.get('papers', []))})

{papers_section}

---

## 🧠 2. Research Gap Analysis

{result.get('gap_analysis', 'No gap analysis available.')}

---

## 💡 3. Generated Hypotheses ({len(result.get('hypotheses', []))})

{hypotheses_section if hypotheses_section else 'No hypotheses generated.'}

---

## ⚠️ 4. Contradictions Detected ({len(result.get('contradictions', []))})

{contradictions_section if contradictions_section else 'No contradictions found — papers are consistent.'}

---

## 📈 5. Trend Analysis & Predictions

{trends_section}

---

## 📄 6. Literature Review

{result.get('review', 'No review available.')}

---

*Report generated by AutoResearch AI Pipeline — Powered by Groq API + ArXiv + Semantic Scholar*
"""

                # Store full report in session state
                st.session_state['full_report'] = full_report
                st.session_state['current_topic'] = topic

                # Notify user the report is ready
                st.info("📄 Full consolidated report is ready! Navigate to the **📄 Report** page to view & download it.")


elif page == "📄 Report":
    st.markdown("""
    <div style="text-align:center; margin-bottom:30px;">
        <div style="font-size:2.5rem; font-weight:800; background: linear-gradient(135deg, #00f5ff, #bf5fff, #ff2d95);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom:8px;">
            📄 Full Research Report
        </div>
        <div style="color:#7a9bbf; font-size:1rem;">Consolidated output from all 7 AI agents</div>
    </div>
    """, unsafe_allow_html=True)

    if "full_report" in st.session_state:
        # Show topic badge
        report_topic = st.session_state.get('current_topic', 'Research')
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,95,255,0.15));
                    border: 1px solid rgba(0,245,255,0.3); border-radius:16px; padding:20px 28px;
                    margin-bottom:24px; text-align:center;">
            <span style="color:#00f5ff; font-size:0.85rem; text-transform:uppercase; letter-spacing:2px;">Research Topic</span>
            <div style="color:#ffffff; font-size:1.4rem; font-weight:700; margin-top:6px;">{report_topic}</div>
        </div>
        """, unsafe_allow_html=True)

        # Render the full markdown report inside a styled container
        st.markdown("""
        <div style="background: rgba(10,10,30,0.6); border: 1px solid rgba(0,245,255,0.15);
                    border-radius:16px; padding:32px 36px; margin-bottom:24px;
                    box-shadow: 0 0 30px rgba(0,245,255,0.05);">
        """, unsafe_allow_html=True)
        st.markdown(st.session_state["full_report"])
        st.markdown("</div>", unsafe_allow_html=True)

        # Download buttons
        st.markdown('<div class="neon-divider"></div>', unsafe_allow_html=True)
        col_dl1, col_dl2, col_dl3 = st.columns([1, 2, 1])
        with col_dl2:
            st.download_button(
                label="📥 DOWNLOAD FULL RESEARCH REPORT (.md)",
                data=st.session_state["full_report"],
                file_name=f"{report_topic.replace(' ', '_')}_Full_Report.md",
                mime="text/markdown",
                use_container_width=True
            )
    else:
        st.markdown("""
        <div style="text-align:center; padding:80px 20px;">
            <div style="font-size:4rem; margin-bottom:16px;">📭</div>
            <div style="color:#7a9bbf; font-size:1.2rem; margin-bottom:8px;">No report generated yet</div>
            <div style="color:#4a6a8f; font-size:0.95rem;">Run a research pipeline from the <b>🔬 Research</b> page first.</div>
        </div>
        """, unsafe_allow_html=True)

# ══════════════════════════════════════════════
#  PAGE 3: CHATBOT
# ══════════════════════════════════════════════
elif page == "💬 Chatbot":
    st.markdown("""
    <div class="glass-card card-purple">
        <div class="section-title title-purple">💬 Research Assistant Chatbot</div>
    """, unsafe_allow_html=True)
    
    st.write("Ask questions about your research analysis:")
    st.markdown('</div>', unsafe_allow_html=True)
    
    CHAT_HISTORY_FILE = "chat_history.json"
    
    def load_chat_history():
        if os.path.exists(CHAT_HISTORY_FILE):
            try:
                with open(CHAT_HISTORY_FILE, 'r') as f:
                    return json.load(f)
            except:
                return []
        return []
    
    def save_chat_history(history):
        try:
            with open(CHAT_HISTORY_FILE, 'w') as f:
                json.dump(history, f, indent=2)
        except:
            pass
    
    # Initialize chat history
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = load_chat_history()

    # Save chat history after each interaction (handled later)
    # Ensure chat history is saved when a new message is added
    # (See later in the chat handling code for save call)
    
    # Check if research has been run
    if 'current_result' not in st.session_state:
        st.warning("⚠️ Please run a research analysis first in the 'New Research' tab!")
    else:
        # Display chat history
        chat_container = st.container()
        with chat_container:
            for i, message in enumerate(st.session_state.chat_history):
                if message["role"] == "user":
                    st.markdown(f"""
                    <div class="chat-message chat-user">
                        <strong>You:</strong> {message['content']}
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div class="chat-message chat-assistant">
                        <strong>Assistant:</strong> {message['content']}
                    </div>
                    """, unsafe_allow_html=True)
        
        st.divider()
        
        # Input area
        user_input = st.text_input(
            "Your question:",
            placeholder="e.g., What is Gap #3? How do I test Hypothesis #5? Which papers are most important?"
        )
        
        if st.button("Send Message"):
            if user_input:
                # Get research context
                research_context = {
                    'topic': st.session_state.get('current_topic', 'Unknown'),
                    'papers': st.session_state.get('current_result', {}).get('papers', []),
                    'gaps': st.session_state.get('current_result', {}).get('gap_analysis', ''),
                    'hypotheses': st.session_state.get('current_result', {}).get('hypotheses', []),
                    'contradictions': st.session_state.get('current_result', {}).get('contradictions', []),
                    'trends': st.session_state.get('current_result', {}).get('trends', {}),
                }
                
                # Get response
                with st.spinner("💭 Thinking..."):
                    response = chatbot_response(user_input, research_context)
                
                # Store in history
                st.session_state.chat_history.append({"role": "user", "content": user_input})
                st.session_state.chat_history.append({"role": "assistant", "content": response})
                save_chat_history(st.session_state.chat_history)  # ADD THIS LINE
                
                st.rerun()

st.markdown("""
<div class="footer">
    </span> 
</div>
""", unsafe_allow_html=True)