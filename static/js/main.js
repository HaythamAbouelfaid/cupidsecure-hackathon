// Load demo conversation
async function loadDemo(convId) {
    try {
        const response = await fetch(`/api/demo-conversation/${convId}`);
        const data = await response.json();

        // Clear existing messages
        document.getElementById('messagesList').innerHTML = '';

        // Add messages from demo
        data.messages.forEach(msg => {
            addMessage(msg.sender, msg.text);
        });

        // Auto-analyze
        setTimeout(() => analyzeConversation(), 500);
    } catch (error) {
        console.error('Error loading demo:', error);
        alert('Failed to load demo conversation');
    }
}

// Add new message row
function addMessage(sender = '', text = '') {
    const messagesList = document.getElementById('messagesList');
    const messageRow = document.createElement('div');
    messageRow.className = 'message-row';
    messageRow.innerHTML = `
        <input type="text" class="sender-input" placeholder="Sender name" value="${sender}">
        <textarea class="message-input" placeholder="Message text" rows="2">${text}</textarea>
        <button class="remove-btn" onclick="removeMessage(this)">×</button>
    `;
    messagesList.appendChild(messageRow);
}

// Remove message row
function removeMessage(button) {
    const messagesList = document.getElementById('messagesList');
    if (messagesList.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('You need at least one message!');
    }
}

// Dashboard Image Upload Logic
const dbDropZone = document.getElementById('dbDropZone');
const dbImageUpload = document.getElementById('dbImageUpload');

if (dbDropZone && dbImageUpload) {
    dbDropZone.addEventListener('click', () => dbImageUpload.click());

    dbDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dbDropZone.style.borderColor = 'var(--primary-color)';
        dbDropZone.style.background = 'rgba(236, 72, 153, 0.1)';
    });

    dbDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dbDropZone.style.borderColor = 'var(--surface-light)';
        dbDropZone.style.background = 'rgba(0,0,0,0.2)';
    });

    dbDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dbDropZone.style.borderColor = 'var(--surface-light)';
        dbDropZone.style.background = 'rgba(0,0,0,0.2)';

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleDbImage(e.dataTransfer.files[0]);
        }
    });

    dbImageUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleDbImage(e.target.files[0]);
        }
    });
}

// Markdown Formatter
function formatMarkdown(text) {
    if (!text) return '';

    // Safety escape
    let safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Bold: **text** -> <strong>text</strong>
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* -> <em>text</em>
    safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Newlines -> <br>
    safeText = safeText.replace(/\n/g, '<br>');

    // Bullet points: - text -> • text (simple)
    safeText = safeText.replace(/<br>- /g, '<br>• ');

    return safeText;
}

function handleDbImage(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('dbPreviewImg').src = e.target.result;
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('financialResults').style.display = 'none';

        // Hide Text/Message Inputs when Image is present
        const messagesList = document.getElementById('messagesList');
        const addMessageBtn = document.querySelector('button[onclick="addMessage(\'Them\', \'\')"]');
        if (messagesList) messagesList.style.display = 'none';
        if (addMessageBtn) addMessageBtn.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    document.getElementById('dbImageUpload').value = '';
    document.getElementById('dbPreviewImg').src = '';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';

    // Show Text/Message Inputs again
    const messagesList = document.getElementById('messagesList');
    const addMessageBtn = document.querySelector('button[onclick="addMessage(\'Them\', \'\')"]');
    if (messagesList) messagesList.style.display = 'block';
    if (addMessageBtn) addMessageBtn.style.display = 'inline-block';
}

// Analyze conversation (Updated to include Image Analysis)
async function analyzeConversation() {
    const messageRows = document.querySelectorAll('.message-row');
    const messages = [];

    // Get text messages
    messageRows.forEach(row => {
        const sender = row.querySelector('.sender-input').value;
        const text = row.querySelector('.message-input').value;
        if (text.trim()) {
            messages.push({ sender, text });
        }
    });

    // Get image if uploaded
    const imgElement = document.getElementById('dbPreviewImg');
    const hasImage = imgElement && imgElement.src && imgElement.src.length > 100;

    if (messages.length === 0 && !hasImage) {
        alert('Please enter at least one message or upload a screenshot!');
        return;
    }

    // Show loading state
    // 1. Trigger Dashboard Animation
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) {
        dashboardGrid.classList.add('active-analysis');
    }

    // 2. Show Results Section and Loading Overlay
    const resultsDiv = document.getElementById('results');
    const loadingOverlay = document.getElementById('resultsLoading');

    resultsDiv.style.display = 'block'; // Make sure it's visible so animation works
    if (loadingOverlay) loadingOverlay.classList.add('active');

    // Wait a brief moment for animation to start effectively
    // No "scrollIntoView" immediately if we want the animation to be the focus, 
    // but scrolling helps on mobile.

    document.getElementById('riskMessage').textContent = 'ANALYZING RISK...';
    document.getElementById('riskMessage').style.color = 'var(--text-secondary)';

    // 1. Analyze Messages (Text)
    let textResults = null;
    if (messages.length > 0) {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });
            textResults = await response.json();
        } catch (error) {
            console.error('Error analyzing text:', error);
        }
    } else {
        // Dummy results if only image
        textResults = {
            risk_score: 0,
            risk_level: 'low',
            risk_color: '#10b981', // var(--success)
            risk_message: 'IMAGE ANALYSIS ONLY',
            detected_patterns: [],
            detected_flags: [],
            ai_insights: []
        };
    }

    // 2. Analyze Image (if present)
    let imageAnalysisText = "";
    if (hasImage) {
        try {
            document.getElementById('riskMessage').textContent = 'ANALYZING IMAGE...';
            const imgResponse = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imgElement.src })
            });
            const imgData = await imgResponse.json();
            if (!imgData.error) {
                imageAnalysisText = imgData.analysis;
                // Boost risk score if image analysis happened (simple heuristic for now)
                // In a real app, we'd parse the image risk score
                if (imageAnalysisText.toLowerCase().includes('high risk') || imageAnalysisText.toLowerCase().includes('scam')) {
                    textResults.risk_score = Math.max(textResults.risk_score, 85);
                    textResults.risk_level = 'high';
                    textResults.risk_color = '#ef4444';
                    textResults.risk_message = 'CRITICAL RISK (IMAGE)';
                }
            }
        } catch (error) {
            console.error('Error analyzing image:', error);
            // Even on error, hide loading
            const loadingOverlay = document.getElementById('resultsLoading');
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }

    // 3. Combine and Display Results
    if (textResults) {
        // If we have image analysis, add it as a top insight
        if (imageAnalysisText) {
            // Try to parse if it looks like JSON or if we expect it to be JSON from the new backend
            let htmlContent = '';
            try {
                // If it's a string that looks like JSON, parse it
                let analysisData = imageAnalysisText;
                if (typeof analysisData === 'string' && (analysisData.trim().startsWith('{') || analysisData.trim().startsWith('```json'))) {
                    // Clean up markdown code blocks if present
                    const cleanJson = analysisData.replace(/```json/g, '').replace(/```/g, '');
                    analysisData = JSON.parse(cleanJson);
                }

                if (typeof analysisData === 'object') {
                    if (analysisData.timeline) {
                        textResults.timeline = analysisData.timeline;
                    }
                    htmlContent = generateAnalysisHTML(analysisData);
                } else {
                    htmlContent = formatMarkdown(imageAnalysisText);
                }
            } catch (e) {
                console.log("JSON Parse Error, falling back to markdown", e);
                htmlContent = formatMarkdown(imageAnalysisText);
            }

            textResults.ai_insights.unshift({
                type: 'info',
                title: '📸 Screenshot Analysis',
                description: htmlContent // Now contains rich HTML "blocks"
            });
        }

        // Hide loading overlay
        const loadingOverlay = document.getElementById('resultsLoading');
        if (loadingOverlay) loadingOverlay.classList.remove('active');

        displayResults(textResults);

        // --- SUPABASE SAVE LOGIC ---
        if (window.supabaseClient) {
            window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
                if (session) {
                    let textSnippet = 'Screenshot Analysis';
                    let fullText = null;
                    if (messages.length > 0) {
                        textSnippet = messages[0].text.substring(0, 40);
                        fullText = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
                    }
                    
                    let screenshotUrl = null;
                    if (hasImage && imgElement && imgElement.src) {
                        try {
                            const dataUrl = imgElement.src;
                            const arr = dataUrl.split(',');
                            const mime = arr[0].match(/:(.*?);/)[1];
                            const bstr = atob(arr[1]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while(n--){
                                u8arr[n] = bstr.charCodeAt(n);
                            }
                            const ext = mime.split('/')[1] || 'png';
                            const file = new File([u8arr], `screenshot-${Date.now()}.${ext}`, {type:mime});
                            
                            const { data, error } = await window.supabaseClient.storage
                                .from('conversation-screenshots')
                                .upload(`${session.user.id}/${file.name}`, file);
                                
                            if (!error && data) {
                                const { data: urlData } = window.supabaseClient.storage
                                    .from('conversation-screenshots')
                                    .getPublicUrl(data.path);
                                screenshotUrl = urlData.publicUrl;
                            }
                        } catch (e) {
                            console.error("Error uploading screenshot:", e);
                        }
                    }

                    window.supabaseClient.from('conversation_analyses').insert({
                        user_id: session.user.id,
                        text_snippet: textSnippet,
                        conversation_text: fullText,
                        screenshot_url: screenshotUrl,
                        risk_score: textResults.risk_score || 0,
                        detected_tactics: textResults.detected_patterns || [],
                        analysis_result: textResults,
                        analysis_data: textResults
                    }).then(({ error }) => {
                        if (error) console.error("Error saving analysis:", error);
                        else loadConversationHistory(); // Reload sidebar
                    });
                }
            });
        }
        // ---------------------------

        // Auto-pop AI Assistant for simplified explanation
        setTimeout(() => {
            const riskWord = textResults.risk_score > 70 ? "CRITICAL" : (textResults.risk_score > 40 ? "SUSPICIOUS" : "LOW");
            pushAiAssistantMessage(`<strong>Analysis Complete!</strong><br>I've detected a <strong>${riskWord}</strong> risk level (${textResults.risk_score}%). Check the 'Detected Patterns' and 'Safety Response Assistant' for direct advice on how to handle this contact.`);
        }, 1200);
    }
}

// Global chart instance to destroy before re-creating
let riskChartInstance = null;

function renderTimelineAndChart(timeline) {
    const section = document.getElementById('timelineSection');
    const timelineContainer = document.getElementById('textTimeline');
    const canvas = document.getElementById('riskHeatmapChart');

    if (!timeline || timeline.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    timelineContainer.innerHTML = '';

    // Render Text Timeline
    timeline.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';

        let riskBadgeColor = '#10b981'; // green
        if (item.risk_score >= 70) riskBadgeColor = '#ef4444'; // red
        else if (item.risk_score >= 40) riskBadgeColor = '#f59e0b'; // amber

        div.innerHTML = `
            <div class="timeline-time">${item.phase}</div>
            <div class="timeline-title">
                ${item.event}
                <span class="timeline-risk" style="background: ${riskBadgeColor}">Risk: ${item.risk_score}</span>
            </div>
        `;
        timelineContainer.appendChild(div);
    });

    // Render Chart
    if (riskChartInstance) {
        riskChartInstance.destroy();
    }

    const labels = timeline.map(t => t.phase);
    const dataPoints = timeline.map(t => t.risk_score);

    riskChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Risk Score Over Time',
                data: dataPoints,
                borderColor: '#ec4899', // primary color
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#ec4899'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#cbd5e1'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#cbd5e1'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f8fafc'
                    }
                }
            }
        }
    });
}

// Helper: Generate Block HTML for Analysis
function generateAnalysisHTML(data) {
    const riskScore = data.risk_score || 0;
    const isCritical = riskScore >= 70;
    const bannerClass = isCritical ? 'critical' : 'safe';
    const bannerColor = isCritical ? '#ef4444' : '#10b981';

    // Build Flags HTML
    let flagsHtml = '';
    if (data.red_flags && Array.isArray(data.red_flags)) {
        flagsHtml = `<div class="flags-grid">
            ${data.red_flags.map(flag => `
                <div class="flag-card">
                    <h5>${flag.title || 'Flag'}</h5>
                    <p>${flag.description || ''}</p>
                </div>
            `).join('')}
        </div>`;
    }

    return `
        <div class="analysis-summary">
            <div class="score-banner ${bannerClass}">
                <div class="score-label" style="color: ${bannerColor}">
                    ${isCritical ? 'Critical Risk' : 'Low Risk'}<br>
                    <span style="font-size: 0.7rem; opacity: 0.8; color: var(--text-secondary);">DETECTED</span>
                </div>
                <div class="score-value" style="color: ${bannerColor}">${riskScore}</div>
            </div>
            
            ${data.scam_type ? `<div class="scam-type-chip">${data.scam_type}</div>` : ''}
            
            ${flagsHtml}
            
            ${data.verdict ? `
                <div class="verdict-box">
                    <strong>Verdict:</strong> ${data.verdict}
                </div>
            ` : ''}
        </div>
    `;
}

// Display analysis results
function displayResults(results) {
    window.analysisResults = results;
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });

    // Render Timeline & Chart if available
    renderTimelineAndChart(results.timeline);

    // Risk score
    const riskScore = results.risk_score;
    const riskColor = results.risk_color;

    document.getElementById('riskScoreNumber').textContent = riskScore;
    document.getElementById('riskScoreNumber').style.color = riskColor;
    document.getElementById('riskMessage').textContent = results.risk_message;
    document.getElementById('riskMessage').style.color = riskColor;

    const riskMeterFill = document.getElementById('riskMeterFill');
    riskMeterFill.style.width = riskScore + '%';
    riskMeterFill.style.background = riskColor;

    // Classification Card
    const scamCard = document.getElementById('scamTypeCard');
    const scamClass = results.scam_classification;
    console.log("Scam Class Data:", scamClass);

    if (scamClass && scamClass.type && scamClass.type !== 'None/Unknown') {
        scamCard.style.display = 'block';
        document.getElementById('scamTypeName').textContent = scamClass.type;
        document.getElementById('scamTypeDescription').textContent = scamClass.description;
        document.getElementById('scamAvgLoss').textContent = scamClass.avg_loss || 'Unknown';
        document.getElementById('scamProbabilityVal').textContent = scamClass.probability || 'Medium';

        const riskEl = document.getElementById('scamRiskLevel');
        riskEl.textContent = scamClass.probability || 'Medium';
        if (scamClass.probability === 'High') riskEl.style.color = 'var(--danger)';
        else if (scamClass.probability === 'Medium') riskEl.style.color = 'var(--warning)';
        else riskEl.style.color = 'var(--success)';

    } else {
        scamCard.style.display = 'none';
    }

    // Patterns
    const patternsList = document.getElementById('patternsList');
    if (results.detected_patterns.length > 0) {
        patternsList.innerHTML = results.detected_patterns.map(p => `
            <div class="pattern-item">
                <strong>${p.name.replace('_', ' ').toUpperCase()}</strong>
                <p>${p.description} (Weight: ${p.weight})</p>
            </div>
        `).join('');
    } else {
        patternsList.innerHTML = '<p>No specific scam patterns detected in text.</p>';
    }

    // Flags
    const flagsList = document.getElementById('flagsList');
    if (results.detected_flags.length > 0) {
        flagsList.innerHTML = results.detected_flags.map(f => `
            <div class="flag-item">
                <strong>${f.name.replace('_', ' ').toUpperCase()}</strong>
                <p>Severity: ${f.severity} (Weight: ${f.weight})</p>
            </div>
        `).join('');
    } else {
        flagsList.innerHTML = '<p>No financial red flags detected.</p>';
    }

    // Insights (Updated to handle HTML description)
    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = results.ai_insights.map(insight => `
        <div class="insight-card insight-${insight.type}">
            ${insight.title !== '📸 Screenshot Analysis' ? `<h4>${insight.title}</h4>` : ''}
            <div style="white-space: normal;">${insight.description}</div>
        </div>
    `).join('');

    // Actions
    const actionsList = document.getElementById('actionsList');
    let actions = [];

    if (results.risk_level === 'high') {
        actions = [
            '🚫 DO NOT send any money to this person',
            '📱 Block this person immediately on all platforms',
            '🚨 Report to the dating platform and FBI IC3',
            '👮 File a report at ic3.gov if you sent money',
            '🗣️ Warn friends and family about this interaction'
        ];
    } else if (results.risk_level === 'medium') {
        actions = [
            '⚠️ Proceed with extreme caution',
            '📹 Verify identity through video call',
            '🔍 Research this person thoroughly',
            '💬 Never send money without meeting in person',
            '👥 Tell a trusted friend about this relationship'
        ];
    } else {
        actions = [
            '✅ Conversation appears relatively normal',
            '👁️ Still remain cautious and aware',
            '🚫 Never send money to online-only contacts',
            '📹 Always verify identity before deepening relationship',
            '🧠 Trust your instincts - if something feels off, it probably is'
        ];
    }

    actionsList.innerHTML = '<ul>' + actions.map(a => `<li>${a}</li>`).join('') + '</ul>';
}

// Floating Chat (Cupid AI) Functions
function toggleChat() {
    const win = document.getElementById('floatingChatWindow');
    if (win) {
        win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
        if (win.style.display === 'flex') {
            updateSuggestedQuestions(['How to spot a scam?', 'What are the red flags?', 'Is this safe?']);
        }
    }
}

function pushAiAssistantMessage(message) {
    const win = document.getElementById('floatingChatWindow');
    const chatMessages = document.getElementById('floatChatMessages');
    if (!win || !chatMessages) return;

    if (getComputedStyle(win).display === 'none') {
        win.style.display = 'flex';
    }

    chatMessages.innerHTML += `
        <div class="chat-message ai" style="background: var(--surface-light); color: var(--text-primary); padding: 0.75rem; border-radius: 12px; width: fit-content; margin-bottom: 0.5rem; animation: fadeIn 0.3s ease-out;">
            <strong>Cupid AI:</strong><br>${message}
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Draggable Logic
function makeDraggable(el, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        el.classList.add('dragging');
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
        el.style.bottom = 'auto';
        el.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        el.classList.remove('dragging');
    }
}

// Image Support in Chat
async function handleChatImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = async function (e) {
            const base64 = e.target.result;
            const chatMessages = document.getElementById('floatChatMessages');

            // Add user image to chat
            chatMessages.innerHTML += `
                <div class="chat-message user" style="background: var(--primary-color); padding: 0.5rem; border-radius: 12px; align-self: flex-end; margin-left: auto;">
                    <img src="${base64}" style="max-width: 200px; border-radius: 8px; display: block;">
                </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Trigger analysis
            pushAiAssistantMessage("Analyzing this screenshot for you...");
            try {
                const response = await fetch('/api/analyze-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 })
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                pushAiAssistantMessage(formatMarkdown(data.analysis));
                updateSuggestedQuestions(["Tell me more about the risks", "What should I say next?", "Block this person?"]);
            } catch (err) {
                pushAiAssistantMessage("I couldn't analyze that image. Please make sure it's a clear chat screenshot.");
            }
        };
        reader.readAsDataURL(file);
    }
}

// Suggested Questions Logic
function updateSuggestedQuestions(questions) {
    const container = document.getElementById('suggestedQuestions');
    if (!container) return;
    container.innerHTML = questions.map(q => `<div class="question-chip" onclick="sendSuggestedQuestion('${q.replace(/'/g, "\\'")} ')">${q}</div>`).join('');
}

function sendSuggestedQuestion(text) {
    document.getElementById('floatChatInput').value = text;
    sendFloatChat();
}

async function sendFloatChat() {
    const input = document.getElementById('floatChatInput');
    const message = input.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById('floatChatMessages');
    chatMessages.innerHTML += `
        <div class="chat-message user" style="background: var(--primary-color); color: white; align-self: flex-end; width: fit-content; margin-left: auto;">
            <strong>You:</strong><br>${message}
        </div>
    `;
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const loadingId = 'loading-' + Date.now();
    chatMessages.innerHTML += `
        <div class="chat-message ai" id="${loadingId}" style="background: var(--surface-light); color: var(--text-primary); width: fit-content;">
            <strong>Cupid AI:</strong><br>Thinking...
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.error) {
            pushAiAssistantMessage("I'm having trouble connecting. Please try again.");
        } else {
            pushAiAssistantMessage(formatMarkdown(data.response));

            // Context-aware suggestions (simplified heuristic)
            if (message.toLowerCase().includes('money') || message.toLowerCase().includes('gift card')) {
                updateSuggestedQuestions(["Common money scams?", "Why do they ask for cards?", "Safety script?"]);
            } else if (message.toLowerCase().includes('military') || message.toLowerCase().includes('deployed')) {
                updateSuggestedQuestions(["Military scam red flags", "How to verify a soldier?", "Reporting scams"]);
            } else {
                updateSuggestedQuestions(["Next steps?", "More red flags?", "Analyze a new chat"]);
            }
        }
    } catch (error) {
        if (document.getElementById(loadingId)) document.getElementById(loadingId).remove();
    }
}

// Initialize draggability
document.addEventListener('DOMContentLoaded', () => {
    const chatWin = document.getElementById('floatingChatWindow');
    const chatHeader = document.getElementById('floatingChatHeader');
    if (chatWin && chatHeader) {
        makeDraggable(chatWin, chatHeader);
    }
});

// Keep existing Calculate Financial Risk function
async function calculateFinancialRisk() {
    // ... existing implementation ...
    const amount = parseFloat(document.getElementById('calcAmount').value);
    const reason = document.getElementById('calcReason').value;
    const paymentMethod = document.getElementById('calcPayment').value;
    const relationshipDays = parseInt(document.getElementById('calcDays').value);

    // ... (rest of the function stays same, just ensuring we don't break it) ...
    // To be safe, I'm just closing the brackets here as I'm replacing the whole file content effectively?
    // Wait, I should probably copy the existing function content if I'm replacing.
    // The previous tool view showed lines 1-100 and then truncated.
    // I need to make sure I don't lose the rest of the file.
    // The replacement content above *starts* with "Dashboard Image Upload Logic".
    // I need to be careful. The user instruction said "Update to handle...".
    // I will use replace_file_content carefully or just append if possible, but I need to modify analyzeConversation which is in the middle.
    // I'll grab the `calculateFinancialRisk` function from previous view or assuming it's standard and rewrite it to be safe, or just use `replace_file_content` targeting specific functions.
    // Actually, `analyzeConversation` is in the middle.
    // I will use `replace_file_content` to replace `analyzeConversation` and `displayResults`, and then append the new logic.
}

// Calculate financial risk
async function calculateFinancialRisk() {
    const amount = parseFloat(document.getElementById('calcAmount').value);
    const reason = document.getElementById('calcReason').value;
    const paymentMethod = document.getElementById('calcPayment').value;
    const relationshipDays = parseInt(document.getElementById('calcDays').value);

    if (!amount || !reason || !relationshipDays) {
        alert('Please fill in all fields!');
        return;
    }








    try {
        const response = await fetch('/api/calculate-financial-risk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                reason,
                payment_method: paymentMethod,
                relationship_days: relationshipDays
            })
        });

        const results = await response.json();
        displayFinancialResults(results);

        // Auto-pop AI Assistant for simplified explanation
        setTimeout(() => {
            pushAiAssistantMessage(`<strong>Monetary Risk Calculation:</strong><br>The requested amount ($${amount}) combined with the relationship duration (${relationshipDays} days) indicates a <strong>${results.risk_level.toUpperCase()}</strong> risk profile. Scammers often use 'Emergency' or 'Medical' reasons as high-pressure tactics.`);
        }, 1200);
    } catch (error) {
        console.error('Error calculating risk:', error);
        alert('Failed to calculate risk');
    }
}

// Display financial risk results
function displayFinancialResults(results) {
    const resultsDiv = document.getElementById('financialResults');
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });

    const riskScore = results.risk_score;
    let riskColor;

    if (riskScore >= 70) {
        riskColor = '#dc2626';
    } else if (riskScore >= 40) {
        riskColor = '#f59e0b';
    } else {
        riskColor = '#10b981';
    }

    document.getElementById('finRiskScore').textContent = riskScore;
    document.getElementById('finRiskScore').style.color = riskColor;

    const finRiskMeterFill = document.getElementById('finRiskMeterFill');
    finRiskMeterFill.style.width = riskScore + '%';
    finRiskMeterFill.style.background = riskColor;

    const factorsList = document.getElementById('finRiskFactors');
    factorsList.innerHTML = results.risk_factors.map(f => `<li>${f}</li>`).join('');

    document.getElementById('finRecommendation').textContent = results.recommendation;
    document.getElementById('finRecommendation').style.color = riskColor;
    document.getElementById('finAction').textContent = results.action;
}

// Image upload preview
const imageUpload = document.getElementById('imageUpload');
if (imageUpload) {
    imageUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('previewImg').src = e.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

// Analyze screenshot
async function analyzeImage() {
    const imgElement = document.getElementById('previewImg');
    const resultsDiv = document.getElementById('imageAnalysisResults');

    if (!imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    resultsDiv.innerHTML = '<p>🔍 Analyzing screenshot with AI...</p>';
    resultsDiv.style.display = 'block';

    try {
        const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imgElement.src
            })
        });

        const data = await response.json();

        if (data.error) {
            resultsDiv.innerHTML = `<p style="color: var(--danger);">❌ Error: ${data.error}</p>`;
        } else {
            resultsDiv.innerHTML = `
                <h3>🤖 AI Analysis Results</h3>
                <div style="line-height: normal;">
                ${(() => {
                    try {
                        let analysisData = data.analysis;
                        if (typeof analysisData === 'string' && (analysisData.trim().startsWith('{') || analysisData.trim().startsWith('```json'))) {
                            const cleanJson = analysisData.replace(/```json/g, '').replace(/```/g, '');
                            analysisData = JSON.parse(cleanJson);
                        }
                        if (typeof analysisData === 'object') {
                            return generateAnalysisHTML(analysisData);
                        } else {
                            return formatMarkdown(data.analysis);
                        }
                    } catch (e) {
                        return formatMarkdown(data.analysis);
                    }
                })()
                }
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = '<p style="color: var(--danger);">❌ Failed to analyze image. Make sure Gemini API is configured.</p>';
    }
}

// Send chat message
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    const chatMessages = document.getElementById('chatMessages');

    // Add user message
    chatMessages.innerHTML += `
        <div class="chat-message user">
            <strong>You:</strong><br>${message}
        </div>
    `;

    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show loading
    chatMessages.innerHTML += `
        <div class="chat-message ai" id="loadingMsg">
            <strong>CupidSecure AI:</strong><br>Thinking...
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Remove loading message
        const loadingMsg = document.getElementById('loadingMsg');
        if (loadingMsg) loadingMsg.remove();

        if (data.error) {
            chatMessages.innerHTML += `
                <div class="chat-message ai">
                    <strong>CupidSecure AI:</strong><br>
                    ❌ Error: ${data.error}
                </div>
            `;
        } else {
            chatMessages.innerHTML += `
                <div class="chat-message ai">
                    <strong>CupidSecure AI:</strong><br>
                    ${data.response.replace(/\n/g, '<br>')}
                </div>
            `;
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Chat error:', error);
        const loadingMsg = document.getElementById('loadingMsg');
        if (loadingMsg) loadingMsg.remove();
        chatMessages.innerHTML += `
            <div class="chat-message ai">
                <strong>CupidSecure AI:</strong><br>
                ❌ Failed to get response. Make sure Gemini API is configured.
            </div>
        `;
    }
}

// Generate Safe Response Script
async function generateScript(type) {
    const outputDiv = document.getElementById('scriptOutput');
    const loadingDiv = document.getElementById('scriptLoading');
    const listDiv = document.getElementById('scriptList');

    // Show loading
    outputDiv.style.display = 'block';
    loadingDiv.style.display = 'block';
    listDiv.innerHTML = '';

    // Get context from displayed messages
    const messageRows = document.querySelectorAll('.message-row');
    const context = Array.from(messageRows).map(row => {
        const sender = row.querySelector('.sender-input').value;
        const text = row.querySelector('.message-input').value;
        return `${sender}: ${text}`;
    }).join('\n');

    try {
        const response = await fetch('/api/generate-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, context })
        });

        const data = await response.json();
        const scripts = data.scripts || [];

        loadingDiv.style.display = 'none';

        if (scripts.length === 0) {
            listDiv.innerHTML = '<p class="text-sm text-gray-400">Could not generate scripts. Please try again.</p>';
            return;
        }

        listDiv.innerHTML = scripts.map((script, index) => `
            <div class="script-card" style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.5rem; position: relative; border: 1px solid var(--glass-border);">
                <p style="font-size: 0.95rem; margin-bottom: 0.5rem; line-height: 1.5;">"${script}"</p>
                <button onclick="copyToClipboard(this, '${script.replace(/'/g, "\\'")}')" 
                        style="background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error generating script:', error);
        loadingDiv.style.display = 'none';
        listDiv.innerHTML = '<p class="text-sm text-danger">Error generating response.</p>';
    }
}

function copyToClipboard(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'var(--primary-color)';
        btn.style.color = 'white';

        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.style.background = 'transparent';
            btn.style.color = 'var(--primary-color)';
        }, 2000);
    });
}

// Privacy Functions
function toggleRedactedView() {
    const isRedacted = document.getElementById('redactedViewToggle').checked;

    // Toggle class on message inputs
    const inputs = document.querySelectorAll('.message-input');
    const senderInputs = document.querySelectorAll('.sender-input');

    [...inputs, ...senderInputs].forEach(el => {
        if (isRedacted) {
            el.style.filter = 'blur(4px)';
            el.style.transition = 'filter 0.3s';
        } else {
            el.style.filter = 'none';
        }
    });

    // Also blur preview image if exists
    const previewImg = document.getElementById('previewImg');
    const dbPreviewImg = document.getElementById('dbPreviewImg');

    [previewImg, dbPreviewImg].forEach(img => {
        if (img) {
            if (isRedacted) img.style.filter = 'blur(10px)';
            else img.style.filter = 'none';
        }
    });
}

async function downloadReport() {
    if (!analysisResults) {
        alert("Please run an analysis first.");
        return;
    }

    // Create a form to post data to the report endpoint
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/report';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(analysisResults);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
}

// Close mobile menu when a link is clicked
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }
});

// Initialization for Supabase and Sidebar
document.addEventListener('DOMContentLoaded', async () => {
    const isProtectedRoute = window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/enterprise') || window.location.pathname.startsWith('/settings');
    const overlay = document.getElementById('authLoadingOverlay');

    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
        window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (session) {
            const sidebar = document.getElementById('historySidebar');
            if (sidebar) {
                // Determine initial state based on screen size
                if (window.innerWidth <= 768) {
                    sidebar.style.display = 'none';
                    sidebarOpen = false;
                } else {
                    sidebar.style.display = 'flex';
                }
            }
            window.currentUserId = session.user.id;
            loadConversationHistory();
            // Header icon injection for index.html / global layout
            const authContainer = document.getElementById('authHeaderContainer');
            if (authContainer) {
                authContainer.innerHTML = `
                    <div class="auth-dropdown-container">
                        <div class="user-avatar-btn" onclick="toggleAuthDropdown(event)">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="auth-dropdown-menu" id="authDropdownMenu">
                            <a href="/settings"><i class="fas fa-cog"></i> Settings</a>
                            <a href="#" class="danger-text" onclick="window.supabaseClient.auth.signOut().then(() => window.location.reload())"><i class="fas fa-sign-out-alt"></i> Sign Out</a>
                        </div>
                    </div>
                `;
            }
            
            const dashboardBtn = document.getElementById('launchDashboardBtn');
            if (dashboardBtn) {
                dashboardBtn.style.display = 'inline-block';
            }

            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }
        } else {
            // Setup for unauthenticated experience
            const sidebar = document.getElementById('historySidebar');
            const banner = document.getElementById('loggedOutBanner');
            if (sidebar) sidebar.style.display = 'none';
            if (banner) banner.style.display = 'flex';
            
            const dashboardBtn = document.getElementById('launchDashboardBtn');
            if (dashboardBtn) {
                dashboardBtn.style.display = 'inline-block';
            }
            
            if (isProtectedRoute) {
                // If they are on a protected route, redirect!
                window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
            } else {
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 500);
                }
            }
        }
    } else {
         // No Supabase integration configured
         if (isProtectedRoute) {
             window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
         } else {
             if (overlay) overlay.remove();
         }
    }
});

async function loadConversationHistory() {
    if (!window.supabaseClient || !window.currentUserId) return;
    
    const { data, error } = await window.supabaseClient
        .from('conversation_analyses')
        .select('*')
        .eq('user_id', window.currentUserId)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Error loading history:", error);
        return;
    }
    
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    historyList.innerHTML = '';
    
    data.forEach(item => {
        let riskColor = '#10b981'; // green
        if (item.risk_score >= 70) riskColor = '#ef4444'; // red
        else if (item.risk_score >= 30) riskColor = '#f59e0b'; // yellow
        
        // Relative time formatter
        const date = new Date(item.created_at);
        const diffMs = Date.now() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);
        const diffHours = Math.floor(diffMs / 3600000);
        let timeStr = "Today";
        if (diffDays > 0) timeStr = `${diffDays} days ago`;
        else if (diffHours > 0) timeStr = `${diffHours} hrs ago`;

        let textPreview = item.conversation_text || item.text_snippet || "Screenshot Analysis";
        
        let thumbnailHtml = '';
        if (item.screenshot_url) {
            thumbnailHtml = `<img src="${item.screenshot_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--glass-border); flex-shrink: 0;" />`;
        }

        const div = document.createElement('div');
        div.className = 'history-item';
        div.setAttribute('data-search', textPreview);
        div.style.cssText = "padding: 0.75rem; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; transition: all 0.2s; position: relative;";
        div.onmouseover = () => div.style.background = 'rgba(236,72,153,0.1)';
        div.onmouseout = () => div.style.background = 'rgba(0,0,0,0.2)';
        
        // Favorite functionality logic
        const favKey = `cupid_fav_${window.currentUserId}`;
        let favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
        const isFav = favorites.includes(item.id);
        const starColor = isFav ? '#f59e0b' : 'var(--text-secondary)';

        div.innerHTML = `
            <div style="display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.5rem;" onclick="loadPastAnalysisById('${item.id}')">
                ${thumbnailHtml}
                <div style="font-size: 0.85rem; color: #fff; word-break: break-all; flex-grow: 1;">
                    "${textPreview.substring(0, 40)}${textPreview.length >= 40 ? '...' : ''}"
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${riskColor}; color: white; font-weight: bold;">Risk: ${item.risk_score}</span>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.7rem; color: var(--text-secondary);">${timeStr}</span>
                    <button class="fav-btn" onclick="toggleFavorite(event, '${item.id}')" style="background: none; border: none; cursor: pointer; padding: 0;">
                        <i class="fas fa-star" style="color: ${starColor}; font-size: 0.85rem; transition: color 0.2s;"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Store raw item attached to window to avoid inline payload limits
        if (!window.cachedAnalyses) window.cachedAnalyses = {};
        window.cachedAnalyses[item.id] = item;
        
        historyList.appendChild(div);
    });
}

function loadPastAnalysisById(id) {
    if (window.cachedAnalyses && window.cachedAnalyses[id]) {
        loadPastAnalysis(window.cachedAnalyses[id]);
    }
}

function toggleFavorite(e, id) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');
    
    const favKey = `cupid_fav_${window.currentUserId}`;
    let favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        icon.style.color = 'var(--text-secondary)';
    } else {
        favorites.push(id);
        icon.style.color = '#f59e0b';
    }
    
    localStorage.setItem(favKey, JSON.stringify(favorites));
}

let sidebarOpen = true;

function toggleSidebar() {
    const sidebar = document.getElementById('historySidebar');
    const openBtn = document.getElementById('openSidebarBtn');
    
    if (!sidebar) return;

    // For Mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
        return;
    }

    // For Desktop
    sidebarOpen = !sidebarOpen;
    if (sidebarOpen) {
        sidebar.style.marginLeft = '0px';
        if (openBtn) openBtn.style.display = 'none';
    } else {
        sidebar.style.marginLeft = '-280px';
        if (openBtn) openBtn.style.display = 'flex';
    }
}

function filterHistory() {
    const searchInput = document.getElementById('historySearch');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    const items = document.querySelectorAll('.history-item');
    
    items.forEach(item => {
        const text = item.getAttribute('data-search') || '';
        if (text.toLowerCase().includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function loadPastAnalysis(item) {
    if (!item.analysis_data) return;
    
    // Animate dashboard
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) dashboardGrid.classList.add('active-analysis');
    
    // Populate context
    clearImage();
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
        messagesList.style.display = 'block';
        messagesList.innerHTML = '';
        if (item.conversation_text) {
             addMessage('Previous', item.conversation_text);
        } else {
             addMessage('Previous', item.text_snippet + '...');
        }
    }

    if (item.screenshot_url) {
        document.getElementById('dbPreviewImg').src = item.screenshot_url;
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'block';
        
        // Hide Text/Message Inputs when Image is present
        const addMessageBtn = document.querySelector('button[onclick="addMessage(\\\'Them\\\', \\\'\\\')"]');
        if (messagesList) messagesList.style.display = 'none';
        if (addMessageBtn) addMessageBtn.style.display = 'none';
    }

    displayResults(item.analysis_data);
}

function newAnalysis() {
    clearImage();
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
        messagesList.style.display = 'block';
        messagesList.innerHTML = '';
        addMessage('Them', '');
    }
    
    // Clear calculator inputs
    const calcFields = ['calcAmount', 'calcReason', 'calcDays'];
    calcFields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = '';
    });
    
    // Hide results panes
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) resultsDiv.style.display = 'none';
    
    const finResultsDiv = document.getElementById('financialResults');
    if (finResultsDiv) finResultsDiv.style.display = 'none';
    
    // Hide heatmap if present
    const timelineSection = document.getElementById('timelineSection');
    if (timelineSection) timelineSection.style.display = 'none';
    
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) dashboardGrid.classList.remove('active-analysis');
}

// Global V2 Changelog Popup Logic
function showV2ChangelogModal() {
    if (localStorage.getItem("cupidsecure_last_seen_version") === "v2.0") return;

    // Create backdrop overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; padding: 1rem;";

    // Create Modal Card
    const modal = document.createElement('div');
    modal.style.cssText = "background: #1c0816; border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 16px; padding: 2.5rem 2rem; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 0 40px rgba(236,72,153,0.15); transform: translateY(20px); transition: transform 0.3s ease; color: white; display: flex; flex-direction: column; gap: 1.5rem;";

    modal.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 2.5rem; color: #ec4899; margin-bottom: 0.5rem;"><i class="fas fa-heart-crack"></i></div>
            <h2 style="font-size: 1.8rem; margin: 0; background: linear-gradient(135deg, #ec4899, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">What's New in CupidSecure V2.0 🎉</h2>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 1.25rem; font-size: 0.95rem; line-height: 1.5;">
            <div>
                <h3 style="color: #ec4899; margin-bottom: 0.25rem; font-size: 1.1rem;"><i class="fas fa-lock" style="width: 25px;"></i> User Accounts & Authentication</h3>
                <ul style="margin: 0; padding-left: 1.5rem; color: #d1d5db;">
                    <li>Create an account with email or Google sign-in</li>
                    <li>Save and track your conversation analyses over time</li>
                    <li>Access analysis history from any device</li>
                </ul>
            </div>
            
            <div>
                <h3 style="color: #ec4899; margin-bottom: 0.25rem; font-size: 1.1rem;"><i class="fas fa-chart-line" style="width: 25px;"></i> Live Dashboard Data</h3>
                <ul style="margin: 0; padding-left: 1.5rem; color: #d1d5db;">
                    <li>Real-time threat metrics updated every 60 seconds</li>
                    <li>Weekly trend charts showing scam activity patterns</li>
                    <li>Geographic hotspots showing where scammers operate</li>
                </ul>
            </div>
            
            <div>
                <h3 style="color: #ec4899; margin-bottom: 0.25rem; font-size: 1.1rem;"><i class="fas fa-history" style="width: 25px;"></i> Conversation History Sidebar</h3>
                <ul style="margin: 0; padding-left: 1.5rem; color: #d1d5db;">
                    <li>ChatGPT-style sidebar showing all your past analyses</li>
                    <li>Click any analysis to review risk scores and tactics</li>
                    <li>Track patterns across multiple conversations</li>
                </ul>
            </div>

            <div>
                <h3 style="color: #ec4899; margin-bottom: 0.25rem; font-size: 1.1rem;"><i class="fas fa-map-marked-alt" style="width: 25px;"></i> Interactive US Scam Map</h3>
                <ul style="margin: 0; padding-left: 1.5rem; color: #d1d5db;">
                    <li>Visual heatmap showing high-risk states</li>
                    <li>Hover for detailed regional statistics</li>
                    <li>See where romance scammers are most active</li>
                </ul>
            </div>

            <div>
                <h3 style="color: #ec4899; margin-bottom: 0.25rem; font-size: 1.1rem;"><i class="fas fa-cog" style="width: 25px;"></i> AI Preferences</h3>
                <ul style="margin: 0; padding-left: 1.5rem; color: #d1d5db;">
                    <li>Customize how the AI talks to you (tone & style)</li>
                    <li>Settings apply to analyzer and practice mode</li>
                    <li>Tailor the experience to your needs</li>
                </ul>
            </div>
        </div>

        <button id="closeChangelogBtn" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #ec4899, #9333ea); border: none; border-radius: 8px; color: white; font-weight: bold; font-size: 1rem; cursor: pointer; transition: opacity 0.2s; margin-top: 1rem;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            Let's Go!
        </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Trigger animation slightly after DOM insertion
    requestAnimationFrame(() => {
        overlay.style.opacity = "1";
        modal.style.transform = "translateY(0)";
    });

    document.getElementById('closeChangelogBtn').addEventListener('click', () => {
        overlay.style.opacity = "0";
        modal.style.transform = "translateY(20px)";
        
        // Wait for fade-out animation to finish
        setTimeout(() => {
            overlay.remove();
            localStorage.setItem("cupidsecure_last_seen_version", "v2.0");
        }, 300);
    });
}

document.addEventListener('DOMContentLoaded', showV2ChangelogModal);

function toggleAuthDropdown(e) {
    if(e) e.stopPropagation();
    const menu = document.getElementById('authDropdownMenu');
    if(menu) {
        menu.classList.toggle('show');
    }
}

// Close Dropdown on global click
document.addEventListener('click', function(e) {
    const menu = document.getElementById('authDropdownMenu');
    const container = document.querySelector('.auth-dropdown-container');
    if (menu && menu.classList.contains('show')) {
        if (container && !container.contains(e.target)) {
            menu.classList.remove('show');
        }
    }
});
