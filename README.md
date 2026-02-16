# 💘 CupidSecure - AI-Powered Romance Scam Detection

**Built at HackFax × PatriotHacks 2026 | George Mason University**

### 👥 The Team
- **Haytham Abouelfaid** - Full Stack Developer
- **Aliza Ahmed** - Frontend & UI/UX Designer
- **Hiba Basharat** - Data Analyst & Scam Research

---

## 🎯 The Problem
Romance scams are a devastating form of fraud that cost victims over **$1.3 billion** in reported losses in 2023 alone. Beyond the financial impact, these scams cause deep emotional trauma, with many victims never reporting the crime due to shame and social stigma. Current dating platforms often lack proactive, real-time tools to help users identify deceptive patterns before it's too late.

## 💡 Our Solution
CupidSecure serves as an **AI Copilot for Romantic Safety**, designed to detect fraud and manipulative tactics before any financial loss occur. By leveraging advanced Large Language Models, CupidSecure analyzes conversation dynamics, flags high-risk financial requests, and provides a safe "Practice Mode" to train users on identifying red flags in a simulated environment.

## 🚀 Features

### 🔍 Conversation Analyzer
- **Text & Screenshot Support:** Paste chat logs or upload screenshots of your conversations for immediate analysis.
- **Sentiment & Pattern Recognition:** Detects "love bombing," rapid escalation, and inconsistent or rehearsed scripts.
- **Risk Scoring:** Generates a comprehensive risk report with a 0-100 severity score.

### 💰 Financial Request Check
- **Money Request Analysis:** Evaluates requests for money, gift cards, or crypto investments.
- **Evidence-Based Verdicts:** Provides a clear "Safe" or "Dangerous" verdict based on relationship duration and payment methods.
- **Protect Your Assets:** specifically flags untraceable payment methods like Western Union or gift cards.

### 🎮 Practice Mode (Scammer Simulator)
- **Interactive Scenarios:** Chat with a simulated scammer (Military Sgt, Oil Rig Engineer, Overseas Student) in a safe sandbox.
- **Red Flag Identification:** Real-time feedback helps you spot manipulative tactics as they happen.
- **Educational Guidance:** Learn the psychology behind romance scams through immersive roleplay.

### � Risk Dashboard
- **Threat Intelligence:** Stay updated with global scam trends, high-risk hotspots, and common scam vectors.
- **Financial Impact Tracking:** Visualize the scale of romance scams across different demographics.
- **Enterprise Insights:** A high-level overview of fraudulent activity types (Crypto, Romance, Phishing).

### 🤖 Cupid AI (Embedded Assistant)
- **Always Available:** A floating, draggable AI assistant present on every page to answer safety questions.
- **Image Analysis:** Drag and drop screenshots directly into the chat for instant feedback.
- **Context-Aware Suggestions:** Provides smart follow-up questions based on your current conversation or dashboard view.

## �️ Tech Stack

- **Backend:** Python, Flask, Jinja2
- **Frontend:** HTML5, CSS3 (Vanilla + Modern Design Tokens), JavaScript (Modern ES6+)
- **AI & ML:** Gemini 2.0 Flash (via OpenRouter API), Sentiment Analysis, Image Analysis (Multimodal AI)
- **Data Visualization:** Chart.js, FontAwesome, Google Fonts
- **Other:** GitHub for version control, Dotenv for secure configuration

## 📊 Detection Approach
CupidSecure moves beyond simple keyword matching by combining:
- **LLM-Based Semantics:** Powered by **Gemini 2.0 Flash** to understand the nuance, tone, and manipulative intent behind messages.
- **Financial Heuristics:** Real-time calculation of risk based on amount, relationship maturity, and payment method traceability.
- **Categorization of Tactics:** Mapping behaviors to known scam categories like "The Military Hero," "The Emergency Accident," or "The Crypto Expert."

## 🏃 Quick Start

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/HaythamAbouelfaid/cupidsecure-hackathon.git
cd cupidsecure-hackathon

# 2. Set up environment variables
# Create a .env file and add your OpenRouter API Key
echo "OPENROUTER_API_KEY=your_key_here" > .env

# 3. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Launch the platform
python app.py
```

Open your browser to `http://localhost:5000` to start exploring!

## 📸 Screenshots
*(Coming Soon - Screenshots of the following views)*

- **Homepage Hero:** Modern, sleek landing page showcasing our mission.
- **Conversation Analyzer:** The multimodal upload and analysis interface.
- **Practice Mode:** Interactive chat with the Scammer Simulator.
- **Risk Dashboard:** Global threat intelligence and trend tracking.

---
Built with ❤️ by the CupidSecure Team at **HackFax × PatriotHacks 2026**.
