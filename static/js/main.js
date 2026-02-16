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
}

// Close mobile menu when a link is clicked
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
});
