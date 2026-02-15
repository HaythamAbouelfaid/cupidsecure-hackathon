from flask import Flask, render_template, request, jsonify
from config import Config
import json
import os
import requests
import base64
from datetime import datetime
from dotenv import load_dotenv
from typing import List, Dict, Any, Union, Optional

# Load environment variables explicitly
load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Using Gemini 2.0 Flash via OpenRouter
MODEL_NAME = "google/gemini-2.0-flash-001"

print(f"Server starting...")
print(f"OpenRouter API Key present: {bool(OPENROUTER_API_KEY)}")
if OPENROUTER_API_KEY:
    print(f"Key preview: {str(OPENROUTER_API_KEY)[:10]}...")

def call_openrouter(messages, model=MODEL_NAME):
    """Helper function to call OpenRouter API"""
    if not OPENROUTER_API_KEY:
        print("Error: OPENROUTER_API_KEY not found in environment variables")
        return None

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:5000", # Optional
        "X-Title": "CupidSecure", # Optional
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages
    }
    
    try:
        print(f"Sending request to OpenRouter ({model})...")
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"OpenRouter Error Status: {response.status_code}")
            print(f"OpenRouter Error Body: {response.text}")
            return None
            
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        print(f"OpenRouter Exception: {e}")
        return None

# Load scam patterns
def load_patterns():
    patterns_path = os.path.join(app.root_path, 'data', 'scam_patterns.json')
    try:
        with open(patterns_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

SCAM_PATTERNS = load_patterns()

def get_fallback_insights(patterns, flags):
    """Fallback rule-based insights"""
    insights = []
    
    if any(p['name'] == 'financial_request' for p in patterns):
        insights.append({
            'type': 'warning',
            'title': 'Direct Financial Request Detected',
            'description': 'The conversation contains explicit requests for money. This is a major red flag in online relationships.'
        })
    
    if any(p['name'] == 'quick_relationship' for p in patterns):
        insights.append({
            'type': 'warning',
            'title': 'Rapid Emotional Escalation',
            'description': 'The person is moving very quickly emotionally. Scammers often use "love bombing" to create quick emotional attachment.'
        })
    
    if any(f['name'] == 'cryptocurrency' for f in flags):
        insights.append({
            'type': 'danger',
            'title': 'Cryptocurrency Investment Mentioned',
            'description': 'Romance scammers increasingly use crypto investment schemes. These are extremely difficult to recover funds from.'
        })
    
    if any(f['name'] == 'gift_cards' for f in flags):
        insights.append({
            'type': 'danger',
            'title': 'Gift Card Request - MAJOR RED FLAG',
            'description': 'Legitimate romantic partners never ask for gift cards. This is the #1 payment method for scammers because they are untraceable.'
        })
    
    if len(insights) == 0:
        insights.append({
            'type': 'info',
            'title': 'Conversation Appears Normal',
            'description': 'No major red flags detected. Continue to be cautious and never send money to someone you haven\'t met in person.'
        })
    
    return insights

def generate_insights(patterns, flags, text):
    """Generate AI-powered insights and timeline using OpenRouter (Gemini)"""
    
    prompt = f"""
You are a romance scam detection expert. Analyze this conversation for scam indicators.

Detected Patterns: {[p['name'] for p in patterns]}
Detected Financial Flags: {[f['name'] for f in flags]}

Conversation excerpt: {text[:2000]}

Provide a structured analysis in valid JSON format. Do not use Markdown code blocks.
Structure:
{{
    "insights": [
        {{
            "type": "warning/danger/info",
            "title": "Short Title",
            "description": "2 sentences max explanation"
        }}
    ],
    "timeline": [
        {{
            "phase": "Day/Week [X]", 
            "event": "Event Description", 
            "risk_score": [0-100 estimate]
        }}
    ],
    "scam_classification": {{
        "type": "One of: Military Romance, Crypto Investment / Pig Butchering, Medical Emergency, Oil Rig / Engineer, Inheritance Scam, None/Unknown",
        "description": "1 sentence explanation of this specific variant.",
        "avg_loss": "$[Amount based on FTC data for this type, e.g. $50,000 for Crypto, $2,500 for general romance]",
        "probability": "[Low/Medium/High]"
    }}
}}
If the text is short or no timeline can be inferred, provide a best-guess timeline or a single 'Current State' entry.
"""

    ai_text = call_openrouter([{"role": "user", "content": prompt}])
    
    result = {
        "insights": [],
        "timeline": [],
        "scam_classification": {}
    }

    if ai_text:
        try:
            # Clean up potential markdown formatting
            clean_text = ai_text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text.replace('```json', '', 1)
            if clean_text.endswith('```'):
                clean_text = clean_text.rsplit('```', 1)[0]
            
            data = json.loads(clean_text)
            result["insights"] = data.get("insights", [])
            result["timeline"] = data.get("timeline", [])
            result["scam_classification"] = data.get("scam_classification", {})
        except json.JSONDecodeError:
            print(f"JSON Parse Error: {ai_text}")
            pass
            
    if not result["insights"]:
        result["insights"] = get_fallback_insights(patterns, flags)
    
    return result

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/analyze')
def analyze_page():
    return render_template('analyze.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_conversation():
    data = request.get_json()
    messages = data.get('messages', [])
    
    if not messages:
        return jsonify({'error': 'No messages provided'}), 400

    # Analysis Logic
    # Analysis Logic
    risk_score: int = 0
    detected_patterns: List[Dict[str, Any]] = []
    detected_flags: List[Dict[str, Any]] = []

    full_text = " ".join([m.get('text', '').lower() for m in messages])

    # 1. Check Keywords/Patterns
    for pattern in SCAM_PATTERNS:
        matches = [p for p in pattern['patterns'] if p in full_text]
        if matches:
            risk_score += int(pattern.get('weight', 0))
            detected_patterns.append({
                'name': pattern['name'],
                'description': pattern['description'],
                'weight': pattern['weight'],
                'matches': matches
            })

    # 2. Check for Financial Flags
    financial_keywords = ['money', 'bank', 'transfer', 'card', 'account', 'fund', 'wallet']
    financial_matches = [w for w in financial_keywords if w in full_text]
    if len(financial_matches) > 0:
        detected_flags.append({
            'name': 'financial_discussion',
            'severity': 'medium' if len(financial_matches) < 3 else 'high',
            'weight': 10 * len(set(financial_matches))
        })
        risk_score += int(10 * len(set(financial_matches)))

    # Normalize Risk Score
    risk_score = min(risk_score, 100)
    
    # Risk Level & Color
    if risk_score >= 70:
        risk_level = 'high'
        risk_color = '#ef4444' # Red
        risk_message = "CRITICAL RISK DETECTED"
    elif risk_score >= 40:
        risk_level = 'medium'
        risk_color = '#f59e0b' # Amber
        risk_message = "CAUTION ADVISED"
    else:
        risk_level = 'low'
        risk_color = '#10b981' # Green
        risk_message = "LOW RISK DETECTED"

    # Generate AI Insights & Timeline
    ai_result = generate_insights(detected_patterns, detected_flags, full_text)
    
    return jsonify({
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_color': risk_color,
        'risk_message': risk_message,
        'detected_patterns': detected_patterns,
        'detected_flags': detected_flags,
        'ai_insights': ai_result.get('insights', []),
        'timeline': ai_result.get('timeline', []),
        'scam_classification': ai_result.get('scam_classification', {})
    })

@app.route('/api/analyze-image', methods=['POST'])
def api_analyze_image():
    """Analyze screenshot of conversation using OpenRouter Vision"""
    try:
        data = request.json
        image_data = data.get('image') # This is full data:image/png;base64,... string
        
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        # OpenRouter/OpenAI compatible vision request
        prompt = """
        ACT AS A CYBERSECURITY EXPERT SPECIALIZING IN SOCIAL ENGINEERING AND ROMANCE SCAMS.

        YOUR TASK: 
        Perform a deep forensic analysis of the attached conversation screenshot. Do not just summarize; investigate the text for psychological manipulation and fraud indicators.

        STEP 1: TEXT EXTRACTION & CONTEXT
        - Read every message in the image.
        - Identify the relationship phase (Introduction, Grooming, or Extraction).
        - Note the time gaps between messages if visible.

        STEP 2: DETAILED PATTERN MATCHING
        Look for these specific, subtle indicators:
        - Love Bombing: Excessive compliments ("Queen", "My soulmate") used too early to manufacture intimacy.
        - The "Setup": A wealthy/noble profession (Civil Engineer, Doctor, Military, Pilot) combined with a remote location (Malaysia, Oil rig, Peacekeeping mission, Overseas project).
        - The "Crisis": A sudden, urgent problem that only money can fix (Frozen account, Hospital bill, Customs fee, Lost wallet).
        - Payment Methods: Specific requests for Bitcoin, Gift Cards (Steam, Apple, Google), Zelle, or CashApp.
        - Grammar/Tone Mismatch: Does the language match the claimed persona? (e.g., A "US General" using poor grammar).

        STEP 3: ANALYSIS OUTPUT
        You MUST respond in valid JSON format. Do not use Markdown code blocks. 
        Structure:
        {
            "risk_score": [0-100],
            "scam_type": "[Type or 'None']",
            "red_flags": [
                {"title": "[Short Title]", "description": "[Short explanation < 15 words]"},
                {"title": "[Short Title]", "description": "[Short explanation < 15 words]"}
            ],
            "timeline": [
                {"phase": "Day/Week [X]", "event": "[Key Event Description]", "risk_score": [0-100]},
                {"phase": "Day/Week [Y]", "event": "[Escalation]", "risk_score": [0-100]}
            ],
            "verdict": "[1 sentence summary]"
        }
        """

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data 
                        }
                    }
                ]
            }
        ]
        
        print("Sending image to OpenRouter (Gemini)...")
        ai_response = call_openrouter(messages)
        print(f"AI Response: {ai_response}")
        
        if not ai_response:
             return jsonify({'error': 'Failed to get analysis from AI'}), 500

        return jsonify({
            'analysis': ai_response,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-response', methods=['POST'])
def generate_response_script():
    """Generate safe response scripts based on type and context"""
    try:
        data = request.get_json()
        script_type = data.get('type')
        context = data.get('context', '')
        
        prompts = {
            'decline_money': "Generate 3 polite but strict scripts to decline a request for money in a romance scam context. Do not be accusatory, just say no clearly. Keep them short (under 20 words).",
            'verify_identity': "Generate 3 scripts to ask for a video call or specific photo verification to prove identity. Be casual but insistent. Keep them short.",
            'break_contact': "Generate 3 scripts to safely end contact with a potential scammer without escalating the situation. Be boring and firm. Keep them short."
        }
        
        base_prompt = prompts.get(script_type, prompts['break_contact'])
        
        full_prompt = f"""
        Context of conversation: "{context[:500]}..."
        
        Task: {base_prompt}
        
        Response Format:
        Return ONLY a valid JSON array of strings. Example: ["Script 1", "Script 2", "Script 3"]
        """
        
        
        ai_text = call_openrouter([{"role": "user", "content": full_prompt}])
        scripts: List[str] = []
        
        if ai_text:
            # Clean up potential markdown
            clean_text = ai_text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text.replace('```json', '', 1)
            if clean_text.endswith('```'):
                clean_text = clean_text.rsplit('```', 1)[0]
            
            try:
                scripts = json.loads(clean_text)
            except:
                # Fallback if AI returns unstructured text
                scripts = [s.strip() for s in clean_text.split('\n') if s.strip() and not s.strip().startswith('[')]

        if not scripts:
             scripts = [
                "I'm not comfortable with this request.",
                "I prefer to keep things professional.",
                "I think we should stop talking."
            ]

        return jsonify({'scripts': list(scripts)[:3]}) # Limit to 3
            
    except Exception as e:
        print(f"Error generating scripts: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def api_chat():
    """General AI chatbot for romance scam questions via OpenRouter"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        system_context = """
You are slightly skeptical but helpful cybersecurity expert called CupidSecure AI.

Your Goal: Help users quickly identify if they are being scammed.
Tone: Direct, Professional, Empathetic but Concise.

FORMATTING RULES:
1. USE SHORT PARAGRAPHS (Max 2 sentences).
2. USE BULLET POINTS for lists.
3. USE **BOLD** for key terms or warnings.
4. Add empty lines between paragraphs for readability.
5. Keep total response under 150 words unless asked for a detailed explanation.

Never shame victims. Be practical.
"""
        messages = [
            {"role": "system", "content": system_context},
            {"role": "user", "content": user_message}
        ]
        
        response_text = call_openrouter(messages)
        
        if not response_text:
             return jsonify({'error': 'Failed to get response from AI'}), 500

        return jsonify({
            'response': response_text,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculate-financial-risk', methods=['POST'])
def calculate_financial_risk():
    data = request.get_json()
    amount = float(data.get('amount', 0))
    reason = data.get('reason', '').lower()
    payment_method = data.get('payment_method', '').lower()
    relationship_days = int(data.get('relationship_days', 0))

    relationship_days = int(data.get('relationship_days', 0))

    risk_score: int = 0
    risk_factors: List[str] = []

    # 1. Amount Risk
    if amount > 1000:
        risk_score += 30
        risk_factors.append("Large amount requested relative to relationship duration.")
    elif amount > 200:
         risk_score += 10

    # 2. Relationship Duration Risk
    if relationship_days < 14:
        risk_score += 40
        risk_factors.append("Request made very early in the relationship (< 2 weeks).")
    elif relationship_days < 30:
        risk_score += 20
        risk_factors.append("Request made early in the relationship (< 1 month).")

    # 3. Payment Method Risk
    high_risk_methods = ['crypto', 'bitcoin', 'gift card', 'wire', 'western union', 'zelle', 'cash app']
    if any(m in payment_method for m in high_risk_methods):
        risk_score += 30
        risk_factors.append(f"High-risk payment method requested: {payment_method}")

    # 4. Reason Risk
    high_risk_reasons = ['emergency', 'hospital', 'ticket', 'flight', 'investment', 'profit']
    if any(r in reason for r in high_risk_reasons):
        risk_score += 20
        risk_factors.append("Reason for request is a common scam trope.")

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        recommendation = "DO NOT PROCEED. This is highly likely a scam."
        action = "Block User"
    elif risk_score >= 40:
        recommendation = "Proceed with extreme caution. Verify independently."
        action = "Ask for Proof"
    else:
        recommendation = "Low financial risk detected, but stay alert."
        action = "Monitor"

    return jsonify({
        'risk_score': risk_score,
        'risk_factors': risk_factors,
        'recommendation': recommendation,
        'action': action
    })

@app.route('/api/demo-conversation/<id>')
def demo_conversation(id):
    # Mock data for demo
    if id == '1':
        return jsonify({
            'messages': [
                {'sender': 'Stranger', 'text': 'Hello beautiful, I feel like I have known you forever.'},
                {'sender': 'Me', 'text': 'Hi, we just met.'},
                {'sender': 'Stranger', 'text': 'I am currently overseas on a peacekeeping mission but I will come see you soon.'},
                {'sender': 'Stranger', 'text': 'My daughter is in the hospital and I need $500 for her surgery immediately via gift cards.'}
            ]
        })
    elif id == '2': # Crypto
         return jsonify({
            'messages': [
                {'sender': 'Mentor', 'text': 'Have you heard of the new crypto investment platform using AI?'},
                {'sender': 'Me', 'text': 'No, tell me more.'},
                {'sender': 'Mentor', 'text': 'I made $10,000 in one week. I can guide you. Just download Trust Wallet.'},
                {'sender': 'Mentor', 'text': 'We need to move to WhatsApp for better security.'}
            ]
        })
    return jsonify({'messages': []})



@app.route('/simulator')
def simulator():
    return render_template('simulator.html')

@app.route('/api/simulator/chat', methods=['POST'])
def simulator_chat():
    data = request.json
    user_message = data.get('message', '')
    history = data.get('history', []) # list of {role: 'user/assistant', content: '...'}
    turn_count = data.get('count', 0)
    scam_type = data.get('scam_type', 'random') # military, crypto, etc.
    
    # Threshold for revealing tactics
    MAX_TURNS = 10 
    
    if turn_count >= MAX_TURNS:
        # Generate Reveal / Analysis
        analysis_prompt = f"""
        Analyze the following conversation where you acted as a a romance scammer ({scam_type}).
        
        Conversation History:
        {json.dumps(history)}
        
        Task:
        1. Reveal the specific manipulation tactics used (e.g., love bombing, urgency, isolation).
        2. Explain WHY these are red flags.
        3. Provide tips on what the user should have spotted earlier.
        
        Format: Use Markdown for clarity (bullet points, bold text). Start with "Simulation Complete. Here is your analysis:".
        """
        
        system_message = {"role": "system", "content": analysis_prompt}
        # tailored call_openrouter which accepts messages
        response_text = call_openrouter([system_message])
        
        return jsonify({
            'response': response_text,
            'status': 'revealed',
            'count': turn_count + 1
        })

    # Normal Scammer Persona Turn
    scammer_prompts = {
        'military': "You are a US soldier deployed overseas on a peacekeeping mission. You are lonely, looking for love, but cannot access your bank account. Use love bombing tactics. Eventually ask for gift cards for 'data' or 'leave'.",
        'crypto': "You are successful crypto investor. You want to share your 'method' with the user so they can attain financial freedom. Be patient but persistent about getting them to invest. Use 'pig butchering' tactics.",
        'emergency': "You are a doctor or engineer working on an oil rig. You are charming but suddenly face a crisis (equipment broke, medical emergency). You need money urgently.",
        'random': "You are a skilled romance scammer. Choose a persona (Soldier, Crypto Investor, or Oil Rig Engineer) and stick to it. Use love bombing and mirror the user's interests."
    }
    
    system_instruction = scammer_prompts.get(scam_type, scammer_prompts['random'])
    system_instruction += "\nContext: This is a training simulation. The user is practicing spotting scams. Be realistic but slightly flawed so astute users can catch on. Keep responses under 2-3 sentences."
    
    messages = [{"role": "system", "content": system_instruction}] + history + [{"role": "user", "content": user_message}]
    
    response_text = call_openrouter(messages)
    
    return jsonify({
        'response': response_text,
        'status': 'active',
        'count': turn_count + 1
    })



@app.route('/privacy')
def privacy_page():
    return render_template('privacy.html')

@app.route('/report', methods=['POST'])
def generate_report():
    try:
        data_json = request.form.get('data')
        if not data_json:
            return "No data provided", 400
        
        analysis_data = json.loads(data_json)
        return render_template('report.html', data=analysis_data, date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    except Exception as e:
        return f"Error generating report: {str(e)}", 500

# Enterprise / Threat Intel Routes
@app.route('/enterprise-dashboard')
def enterprise_dashboard():
    return render_template('enterprise_dashboard.html')

@app.route('/api/intel-stats')
def intel_stats():
    # Mock aggregated stats (pretend this comes from a database of thousands of scans)
    import random
    
    # 1. High Risk Conversations (Last 7 Days)
    # Generate a trend for the chart
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    daily_risks = [random.randint(15, 45) for _ in range(7)]
    
    # 2. Total Estimated Losses Prevented
    # Sum of money requests flagged
    total_prevented = random.randint(150000, 500000)
    
    # 3. Scam Type Breakdown
    scam_types = {
        'Crypto / Pig Butchering': 45,
        'Military / Peacekeeping': 25,
        'Oil Rig / Emergency': 15,
        'Sugar Baby / Sugar Daddy': 10,
        'Other': 5
    }
    
    # 4. Geographic Heatmap (US States most affected)
    # Top 5 states + counts
    geo_data = {
        'California': random.randint(300, 500),
        'Texas': random.randint(200, 350),
        'Florida': random.randint(150, 300),
        'New York': random.randint(100, 250),
        'Ohio': random.randint(50, 150)
    }
    
    return jsonify({
        'weekly_trend': {'labels': days, 'data': daily_risks},
        'total_prevented': total_prevented,
        'scam_types': scam_types,
        'geo_data': geo_data,
        'active_monitored_users': random.randint(1200, 2000),
        'avg_risk_score': random.randint(60, 85)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
