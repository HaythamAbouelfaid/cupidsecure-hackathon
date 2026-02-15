# 💘 CupidSecure - AI-Powered Romance Scam Detection

**Built at HackFax × PatriotHacks 2026 | George Mason University**

By **Haytham Abouelfaid** & **Aliza Ahmad**

## 🎯 The Problem

Romance scams cost Americans **$1.3 billion** in 2023. The average victim loses **$50,000**. 80% of victims never report due to shame. Existing dating platforms offer **ZERO fraud protection**.

## 💡 Our Solution

CupidSecure is an AI-powered platform that detects romance scams in real-time using:

- **Behavioral Analysis** - Pattern detection engine analyzing conversation dynamics
- **Financial Risk Scoring** - Instant risk assessment for money requests
- **Automated Alerts** - SOAR-style response system with real-time notifications
- **Threat Intelligence** - Powered by FBI IC3 data and real-world scam indicators

## 🚀 Features

### 1. Conversation Analyzer
- Upload or paste conversation transcripts
- AI-powered scam pattern detection
- Risk scoring (0-100 scale)
- Actionable insights and recommendations

### 2. Financial Risk Calculator
- Calculate risk for any money request
- Factors: amount, payment method, relationship duration, reason
- Instant recommendation: send or don't send

### 3. Real-Time Dashboard
- Platform statistics and impact metrics
- Common scam patterns library
- Educational resources

## 🛠️ Tech Stack

**Backend:**
- Python 3.8+
- Flask web framework
- JSON-based pattern matching

**Frontend:**
- HTML5/CSS3
- Vanilla JavaScript
- Responsive design

**Detection Engine:**
- Custom scam pattern algorithm
- 6 behavioral indicators
- 4 financial red flags
- Weighted risk scoring system

## 📊 Detection Patterns

**Behavioral Indicators:**
1. Quick relationship escalation ("soulmate", "love you" within days)
2. Direct financial requests (money, help, emergency)
3. Crisis scenarios (accident, hospital, customs)
4. Location mismatches (overseas, military, oil rig)
5. Avoidance behavior (can't video call, camera broken)
6. Investment schemes (crypto, trading, "guaranteed" returns)

**Financial Red Flags:**
1. Cryptocurrency requests (HIGH)
2. Gift card requests (CRITICAL)
3. Wire transfers (HIGH)
4. Emergency scenarios (HIGH)

## 🏃 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/cupidsecure.git
cd cupidsecure

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
