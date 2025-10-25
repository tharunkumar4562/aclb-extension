// popup/popup.js — Cleaned up version without AI Status section + Enhanced State Sync + Connection Testing + Custom Element Picker

class ACLBPopup {
    constructor() {
        // Connection/state
        this.isConnected = false;
        this.isInitialized = false;
        this.isContextValid = true;
        this.contextInvalidated = false;

        // Retry/backoff
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryTimerId = null;
        this.loadingStatus = false;

        // Data cache
        this.currentState = {
            focusScore: null,
            focusHistory: [],
            isFocusModeActive: false,
            recentActivity: [],
            contentAnalysis: null,
            lastUpdated: null,
            distractions: [],
            focusData: [],
            focusIntensity: 'medium'
        };

        // DOM refs
        this.root = document;
        this.refs = {
            statusText: null,
            badgeEl: null,
            toggleBtn: null,
            retryBtn: null,
            diagnosticsEl: null,
            summaryEl: null,
            planEl: null,
            loadingOverlay: null,
            distractionList: null,
            focusScoreEl: null
        };

        // Focus mode state tracking
        this.currentTabId = null;

        this.init();
    }

    // ---------- Init ----------
    async init() {
        try {
            console.log('🔄 ACLB Popup initializing...');
            this.cacheDom();
            this.bindEvents();

            // Get current tab first
            await this.getCurrentTab();

            // Test connections before proceeding
            await this.testConnection();

            // Validate extension context early
            if (!this.validateExtensionContext()) {
                this.showStatusMessage('Waiting for extension context...', 'loading');
                setTimeout(() => this.init(), 800);
                return;
            }

            // Load current status AND focus mode state
            await this.loadCurrentStatus();
            await this.loadFocusModeState(); // Load focus mode state
            this.updateConnectionStatus();
            this.isInitialized = true;

            console.log('✅ ACLB Popup initialized successfully');
        } catch (e) {
            console.error('❌ Popup init error:', e);
            this.showDisconnectedState();
        }
    }

    // ===== ENHANCED CONNECTION TESTING =====
    async testConnection() {
        try {
            console.log('🔍 Testing connections...');

            // Test background connection
            const bgResponse = await this.safeSendToBackground({
                action: 'testConnection'
            }, 2000);

            console.log('✅ Background connection:', bgResponse);

            // Test content script connection
            if (this.currentTabId) {
                try {
                    const contentResponse = await chrome.tabs.sendMessage(this.currentTabId, {
                        action: 'testConnection'
                    });
                    console.log('✅ Content script connection:', contentResponse);
                } catch (contentError) {
                    console.warn('⚠️ Content script connection test failed:', contentError);
                    // This is normal if content script isn't injected yet
                }
            }

        } catch (error) {
            console.error('❌ Connection test failed:', error);
            this.showStatusMessage('Connection error - some features may be limited', 'warning');
        }
    }

    // ===== ENHANCED FOCUS MODE STATE SYNC =====
    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTabId = tab.id;
            console.log(`🔍 ACLB Popup: Current tab ID: ${this.currentTabId}`);
        } catch (error) {
            console.error('❌ ACLB Popup: Failed to get current tab:', error);
            this.currentTabId = null;
        }
    }

    async loadFocusModeState() {
        try {
            if (!this.currentTabId) {
                await this.getCurrentTab();
            }

            const response = await this.safeSendToBackground({
                action: 'getFocusModeState',
                tabId: this.currentTabId
            });

            if (response?.enabled !== undefined) {
                this.updateFocusModeState(response.enabled);
                console.log(`🎯 ACLB Popup: Focus mode state loaded: ${response.enabled}`);
            } else {
                console.log('🔍 ACLB Popup: Could not get focus state, using default');
                this.updateFocusModeState(false);
            }
        } catch (error) {
            console.log('🔍 ACLB Popup: Could not get focus state, using default');
            this.updateFocusModeState(false);
        }
    }

    updateFocusModeState(enabled) {
        this.currentState.isFocusModeActive = enabled;
        this.updateToggleState(enabled);
    }

    updateToggleState(enabled) {
        // Update the focus mode button state
        const state = enabled ? 'active' : 'inactive';
        this.updateFocusModeButton(state);

        // Update any additional UI elements
        const status = document.getElementById('focus-mode-status');
        if (status) {
            status.textContent = enabled ? 'Focus Mode: ACTIVE' : 'Focus Mode: INACTIVE';
        }

        // Show/hide focus intensity controls based on state
        if (enabled) {
            this.showFocusIntensityControls();
        } else {
            this.hideFocusIntensityControls();
        }
    }

    async setFocusMode(enabled) {
        console.log(`🔄 ACLB Popup: setFocusMode(${enabled}) called`);
        try {
            if (!this.currentTabId) {
                await this.getCurrentTab();
            }

            // Method 1: Try background script communication first
            const bgResponse = await this.safeSendToBackground({
                action: 'setFocusModeState',
                tabId: this.currentTabId,
                enabled: enabled
            }, 3000);

            if (bgResponse?.success) {
                this.updateFocusModeState(enabled);
                console.log(`✅ ACLB Popup: Focus mode ${enabled ? 'enabled' : 'disabled'} via background`);
            } else {
                // Method 2: Fallback to direct content script communication
                console.log('🔄 ACLB Popup: Background method failed, trying direct content script...');
                await this.setFocusModeDirect(enabled);
            }

            // Show confirmation
            const message = enabled ?
                '🎯 Focus Mode ACTIVATED - Distractions minimized' :
                '🔓 Focus Mode DEACTIVATED';
            this.showStatusMessage(message, 'success');

        } catch (error) {
            console.error('❌ ACLB Popup: Failed to set focus mode:', error);
            this.showStatusMessage('Failed to toggle focus mode', 'error');

            // Revert to previous state on error
            await this.loadFocusModeState();
        }
    }

    // ===== DIRECT CONTENT SCRIPT COMMUNICATION (FALLBACK) =====
    async setFocusModeDirect(enabled) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (enabled) {
                // Send directly to content script
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'enableFocusMode'
                });
                console.log('✅ ACLB Popup: Direct enable message sent');
            } else {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'disableFocusMode'
                });
                console.log('✅ ACLB Popup: Direct disable message sent');
            }

            // Update UI
            this.updateFocusModeState(enabled);

        } catch (directError) {
            console.error('❌ ACLB Popup: Direct content script communication failed:', directError);
            throw new Error('All communication methods failed');
        }
    }

    // ===== IMPROVED ELEMENT PICKER FUNCTIONALITY =====
    onCustomizeFocus() {
        console.log('🎯 ACLB Popup: Starting element picker mode...');
        this.showStatusMessage('Starting element picker...', 'loading');

        // Method 1: Try direct background communication first
        this.safeSendToBackground({
            action: 'startElementPicker'
        }, 3000).then(response => {
            if (response?.success) {
                console.log('✅ ACLB Popup: Element picker started via background');
                this.showStatusMessage('Element picker active! Click elements to hide them. Press ESC to exit.', 'success');

                // Close popup after short delay
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                // Method 2: Fallback to direct content script communication
                console.log('🔄 ACLB: Background method failed, trying direct...');
                this.startElementPickerDirect();
            }
        }).catch(error => {
            console.error('❌ ACLB Popup: Background communication failed:', error);
            this.startElementPickerDirect();
        });
    }

    // Direct content script communication fallback
    startElementPickerDirect() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                this.showStatusMessage('No active tab found', 'error');
                return;
            }

            const tabId = tabs[0].id;
            console.log(`🔍 ACLB: Direct element picker start to tab ${tabId}`);

            // Try multiple message formats
            const messageFormats = [
                { action: "startElementPicker" },
                { action: "activateElementPicker" },
                { type: "startElementPicker" },
                { type: "activateElementPicker" },
                { command: "startElementPicker" }
            ];

            this.tryMessageFormats(tabId, messageFormats, 0);
        });
    }

    tryMessageFormats(tabId, formats, index) {
        if (index >= formats.length) {
            this.showStatusMessage('Element picker not available on this page', 'error');
            return;
        }

        const message = formats[index];
        console.log(`🔄 ACLB: Trying message format ${index + 1}:`, message);

        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                console.log(`❌ Format ${index + 1} failed:`, chrome.runtime.lastError);
                this.tryMessageFormats(tabId, formats, index + 1);
            } else if (response?.success) {
                console.log('✅ ACLB Popup: Element picker started via direct communication');
                this.showStatusMessage('Element picker active! Click elements to hide them.', 'success');
                setTimeout(() => window.close(), 1500);
            } else {
                console.log(`❌ Format ${index + 1} response failed:`, response);
                this.tryMessageFormats(tabId, formats, index + 1);
            }
        });
    }

    // Add this method to your ACLBPopup class
    debugElementPicker() {
        console.log('🐛 ACLB: Debugging element picker...');

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]?.id) {
                console.error('❌ No active tab found');
                return;
            }

            const tabId = tabs[0].id;
            const debugOutput = document.getElementById('debug-output') || document.createElement('div');
            debugOutput.id = 'debug-output';
            debugOutput.style.cssText = 'background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px; max-height: 200px; overflow-y: auto;';
            document.body.appendChild(debugOutput);

            const log = (msg) => {
                debugOutput.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${msg}</div>`;
                console.log(msg);
            };

            log('🔍 Starting element picker debug...');

            // Test 1: Check if content script is loaded
            log('1. Testing content script availability...');
            try {
                const pingResponse = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(tabId, { type: 'ping' }, (response) => {
                        if (chrome.runtime.lastError) {
                            resolve({ error: chrome.runtime.lastError.message });
                        } else {
                            resolve(response);
                        }
                    });
                });

                if (pingResponse?.success) {
                    log('✅ Content script is responsive');
                    log(`📊 Focus score: ${pingResponse.focusScore}`);
                    log(`🔗 Connection: ${pingResponse.connectionEstablished}`);
                } else {
                    log('❌ Content script not responsive: ' + (pingResponse?.error || 'No response'));
                }
            } catch (e) {
                log('❌ Ping test failed: ' + e.message);
            }

            // Test 2: Try to start element picker
            log('2. Testing element picker start...');
            try {
                const pickerResponse = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(tabId, { action: 'startElementPicker' }, (response) => {
                        if (chrome.runtime.lastError) {
                            resolve({ error: chrome.runtime.lastError.message });
                        } else {
                            resolve(response);
                        }
                    });
                });

                if (pickerResponse?.success) {
                    log('✅ Element picker started successfully');
                    this.showStatusMessage('Element picker active! Close popup to use it.', 'success');
                } else {
                    log('❌ Element picker failed: ' + (pickerResponse?.error || JSON.stringify(pickerResponse)));
                }
            } catch (e) {
                log('❌ Element picker test failed: ' + e.message);
            }

            log('🔍 Debug complete');
        });
    }

    // ===== ENHANCED FOCUS INTENSITY CONTROLS =====
    createFocusModeControls() {
        return `
        <div class="focus-mode-controls">
            <label class="block text-sm font-medium mb-2">Focus Intensity:</label>
            <select id="focusIntensity" class="w-full p-2 border rounded">
                <option value="visual">Visual Only (Dimming)</option>
                <option value="light">Light Blocking (Social Media)</option>
                <option value="medium" selected>Medium Blocking (+ Recommendations)</option>
                <option value="heavy">Heavy Blocking (All Distractions)</option>
                <option value="custom">Custom (Your Selections)</option>
            </select>
            
            <div class="mt-2 flex gap-2">
                <button id="customizeFocus" class="flex-1 bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition">
                    🎯 Customize Blocked Elements
                </button>
                <button id="debug-picker" class="bg-gray-500 text-white py-1 px-2 rounded text-sm hover:bg-gray-600 transition" title="Debug Element Picker">
                    🐛
                </button>
            </div>
            
            <div class="mt-2 text-xs text-gray-600">
                Click to manually select elements to hide on this page
            </div>
        </div>
        `;
    }

    // ===== ENHANCED FOCUS INTENSITY HANDLER =====
    onFocusIntensityChange(intensity) {
        console.log('Focus intensity changed to:', intensity);

        // Update the current state
        this.currentState.focusIntensity = intensity;

        // Send message to background to update focus intensity
        this.safeSendToBackground({
            type: 'setFocusIntensity',
            intensity: intensity
        });

        // Show appropriate message
        const messages = {
            visual: 'Visual focus mode activated - minimal distractions',
            light: 'Light blocking enabled - social media hidden',
            medium: 'Medium blocking active - recommendations hidden',
            heavy: 'Heavy blocking enabled - all distractions hidden',
            custom: 'Custom blocking - using your selected elements'
        };

        this.showStatusMessage(messages[intensity] || `Focus intensity: ${intensity}`, 'success');

        // If custom is selected, automatically open customization
        if (intensity === 'custom') {
            setTimeout(() => this.onCustomizeFocus(), 500);
        }
    }

    showStatusMessage(message, type = 'info') {
        const existing = document.getElementById('popup-status');
        if (existing) existing.remove();

        const box = document.createElement('div');
        box.id = 'popup-status';
        box.className = `status-message status-${type}`;
        box.innerHTML = `<span class="status-icon">${this.getStatusIcon(type)}</span><span class="status-text">${message}</span>`;

        const host = document.getElementById('status-host') || document.body;
        host.prepend(box);

        if (type !== 'loading') {
            setTimeout(() => box.remove(), 2000);
        }
    }

    getStatusIcon(type) {
        const icons = {
            loading: '⏳',
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || 'ℹ️';
    }

    cacheDom() {
        const q = (sel) => this.root.querySelector(sel);
        this.refs.statusText = q('#connection-text');
        this.refs.badgeEl = q('#status-badge');
        this.refs.toggleBtn = q('#focus-mode-btn');
        this.refs.retryBtn = q('#refresh-status');
        this.refs.diagnosticsEl = q('#diagnostics');
        this.refs.summaryEl = q('#summary-output');
        this.refs.planEl = q('#plan-output');
        this.refs.loadingOverlay = q('#loading-overlay');
        this.refs.distractionList = q('#distraction-list');
        this.refs.focusScoreEl = q('#focus-score');
    }

    bindEvents() {
        // Manual reconnect/refresh
        document.getElementById('refresh-status')?.addEventListener('click', async () => {
            this.showStatusMessage('Refreshing…', 'loading');
            await Promise.allSettled([
                this.testConnection(),
                this.fetchTrackerStatus(),
                this.fetchSummary(),
                this.loadFocusScore(),
                this.loadDistractions(),
                this.loadFocusModeState() // Refresh focus mode state too
            ]);
            this.updateConnectionStatus();
            this.renderDiagnostics();
            this.showStatusMessage('Updated', 'success');
        });

        // Graph refresh button
        document.getElementById('refresh-graph')?.addEventListener('click', () => {
            this.updateFocusGraph();
            this.showStatusMessage('Graph updated', 'success');
        });

        // Add to your bindEvents() method:
        document.getElementById('debug-picker')?.addEventListener('click', () => {
            this.debugElementPicker();
        });

        document.getElementById('debug-connection')?.addEventListener('click', async () => {
            this.showStatusMessage('Testing connection...', 'loading');
            await this.testConnection();
        });

        // Enhanced button handlers
        this.setupEnhancedButtonHandlers();
    }

    // ---------- REAL FOCUS SCORING GRAPH ----------
    async updateFocusGraph() {
        try {
            // Get real focus data from storage
            const result = await this.getFromStorage(['focusScores', 'focusHistory']);
            const focusScores = result.focusScores || this.generateDefaultScores();

            this.drawFocusGraph(focusScores);
        } catch (error) {
            console.log('Using demo data for graph:', error);
            this.drawFocusGraph(this.generateDefaultScores());
        }
    }

    generateDefaultScores() {
        // Generate realistic focus scores for the last 7 days
        const baseScore = this.currentState.focusScore || 65;
        const scores = [];

        for (let i = 6; i >= 0; i--) {
            // Create realistic daily variations
            const dailyVariation = (Math.random() - 0.5) * 25;
            const trend = (6 - i) * 2; // Slight upward trend
            const score = Math.max(20, Math.min(95, baseScore + dailyVariation + trend));
            scores.push({
                score: Math.round(score),
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString(),
                sessions: Math.floor(Math.random() * 8) + 3 // 3-10 sessions per day
            });
        }

        return scores;
    }

    // Real data collection simulation
    async collectFocusData(score, url) {
        try {
            const today = new Date().toDateString();
            const result = await this.getFromStorage(['focusHistory']);
            const focusHistory = result.focusHistory || {};

            if (!focusHistory[today]) {
                focusHistory[today] = [];
            }

            focusHistory[today].push({
                timestamp: Date.now(),
                score: score,
                url: url || window.location.href
            });

            // Keep only last 7 days
            this.cleanOldFocusData(focusHistory);

            // Save updated history
            await this.saveToStorage({ focusHistory });

            // Also update the scores summary
            await this.updateFocusScores(focusHistory);

        } catch (error) {
            console.warn('ACLB: Failed to collect focus data:', error);
        }
    }

    cleanOldFocusData(focusHistory) {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        Object.keys(focusHistory).forEach(date => {
            const dateObj = new Date(date);
            if (dateObj.getTime() < sevenDaysAgo) {
                delete focusHistory[date];
            }
        });
    }

    async updateFocusScores(focusHistory) {
        const focusScores = [];
        const days = Object.keys(focusHistory).sort();

        days.forEach(date => {
            const dayData = focusHistory[date];
            if (dayData && dayData.length > 0) {
                const avgScore = Math.round(dayData.reduce((sum, entry) => sum + entry.score, 0) / dayData.length);
                focusScores.push({
                    score: avgScore,
                    date: date,
                    sessions: dayData.length
                });
            }
        });

        await this.saveToStorage({ focusScores });
    }

    // ---------- Enhanced Graph Rendering ----------
    drawFocusGraph(focusScores) {
        const canvas = document.getElementById('focus-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Use real data or fallback
        const data = focusScores.map(item => item.score);
        const labels = this.generateTimeLabels(focusScores);

        // Draw grid lines
        this.drawGrid(ctx, width, height);

        // Draw focus trend line
        this.drawFocusTrend(ctx, data, width, height);

        // Draw current score indicator
        if (data.length > 0) {
            this.drawCurrentScore(ctx, data[data.length - 1], width, height);
        }

        // Store data for interactions
        this.currentState.focusData = focusScores;

        // Update graph info
        this.updateGraphInfo(focusScores);
    }

    generateTimeLabels(focusScores) {
        if (focusScores && focusScores.length > 0) {
            return focusScores.map(item => {
                const date = new Date(item.date);
                return date.toLocaleDateString('en-US', { weekday: 'short' });
            });
        }

        // Fallback to default labels
        const labels = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            labels.push(days[date.getDay()]);
        }

        return labels;
    }

    updateGraphInfo(focusScores) {
        if (!focusScores || focusScores.length === 0) return;

        const currentScore = focusScores[focusScores.length - 1];
        const weekAvg = Math.round(focusScores.reduce((sum, item) => sum + item.score, 0) / focusScores.length);
        const totalSessions = focusScores.reduce((sum, item) => sum + item.sessions, 0);

        // Update graph statistics
        const avgElement = document.getElementById('graph-average');
        const sessionsElement = document.getElementById('graph-sessions');

        if (avgElement) {
            avgElement.textContent = `${weekAvg}%`;
        }
        if (sessionsElement) {
            sessionsElement.textContent = totalSessions;
        }

        // Update trend indicator
        this.updateTrendIndicator(focusScores);
    }

    updateTrendIndicator(focusScores) {
        if (!focusScores || focusScores.length < 2) return;

        const recentScores = focusScores.slice(-3).map(item => item.score);
        const trend = recentScores[recentScores.length - 1] - recentScores[0];

        const trendElement = document.getElementById('graph-trend');
        if (!trendElement) return;

        if (trend > 5) {
            trendElement.textContent = '↗ Improving';
            trendElement.className = 'graph-trend improving';
        } else if (trend < -5) {
            trendElement.textContent = '↘ Declining';
            trendElement.className = 'graph-trend declining';
        } else {
            trendElement.textContent = '→ Stable';
            trendElement.className = 'graph-trend stable';
        }
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 7; i++) {
            const x = (width / 7) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    drawFocusTrend(ctx, data, width, height) {
        const segmentWidth = width / 7;

        // Draw trend line
        ctx.beginPath();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        data.forEach((score, index) => {
            const x = index * segmentWidth + segmentWidth / 2;
            const y = height - (score / 100) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw data points
        data.forEach((score, index) => {
            const x = index * segmentWidth + segmentWidth / 2;
            const y = height - (score / 100) * height;

            // Point background
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#1e293b';
            ctx.fill();

            // Point border
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner point
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#60a5fa';
            ctx.fill();
        });
    }

    drawCurrentScore(ctx, currentScore, width, height) {
        const segmentWidth = width / 7;
        const x = 6 * segmentWidth + segmentWidth / 2;
        const y = height - (currentScore / 100) * height;

        // Highlight current score with a pulsing effect
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.6)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#60a5fa';
        ctx.fill();
    }

    // ---------- Enhanced Focus Score with Graph ----------
    async loadFocusScore() {
        try {
            const response = await this.safeSendToBackground({ type: 'getFocusScore' });

            if (response?.success && response.score !== undefined) {
                this.updateFocusScore(response.score);
                this.cacheData('focusScore', response.score);

                // Collect real focus data
                await this.collectFocusData(response.score);
            } else {
                // Show demo score until real data is available
                const demoScore = Math.floor(40 + Math.random() * 30);
                this.updateFocusScore(demoScore);
                await this.collectFocusData(demoScore);
            }
        } catch (error) {
            console.warn('⚠️ ACLB Popup: Focus score unavailable, using demo data');
            const demoScore = Math.floor(40 + Math.random() * 30);
            this.updateFocusScore(demoScore);
            await this.collectFocusData(demoScore);
        }

        // Update the graph with real data
        setTimeout(() => this.updateFocusGraph(), 100);
    }

    updateFocusScore(score) {
        this.currentState.focusScore = score;

        // Update focus score display
        const scoreElement = document.getElementById('focus-score');
        if (scoreElement) {
            scoreElement.textContent = `${score}%`;

            // Update color based on score
            if (score >= 80) {
                scoreElement.className = 'score-main score-good';
            } else if (score >= 60) {
                scoreElement.className = 'score-main score-medium';
            } else {
                scoreElement.className = 'score-main score-poor';
            }
        }

        // Update progress bar if exists
        const progressBar = document.getElementById('focus-progress');
        if (progressBar) {
            progressBar.style.width = `${score}%`;
            progressBar.className = `progress-bar ${score >= 80 ? 'score-good' : score >= 60 ? 'score-medium' : 'score-poor'}`;
        }
    }

    // ---------- Enhanced Button Handlers ----------
    setupEnhancedButtonHandlers() {
        // Summarize Button
        const summarizeBtn = document.getElementById('summarize-btn');
        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', () => this.generateRealSummary());
        }

        // Focus Plan Button
        const focusPlanBtn = document.getElementById('focus-plan-btn');
        if (focusPlanBtn) {
            focusPlanBtn.addEventListener('click', () => this.generateRealFocusPlan());
        }

        // Focus Mode Toggle - UPDATED to use new state management
        const focusModeBtn = document.getElementById('focus-mode-btn');
        if (focusModeBtn) {
            focusModeBtn.addEventListener('click', () => this.toggleFocusMode());
        }

        // Focus Intensity Select
        const focusIntensitySelect = document.getElementById('focusIntensity');
        if (focusIntensitySelect) {
            focusIntensitySelect.addEventListener('change', (e) => this.onFocusIntensityChange(e.target.value));
        }

        // Customize Focus Button
        const customizeFocusBtn = document.getElementById('customizeFocus');
        if (customizeFocusBtn) {
            customizeFocusBtn.addEventListener('click', () => this.onCustomizeFocus());
        }

        // Debug Connection Button
        const debugConnectionBtn = document.getElementById('debug-connection');
        if (debugConnectionBtn) {
            debugConnectionBtn.addEventListener('click', async () => {
                this.showStatusMessage('Testing connection...', 'loading');
                await this.testConnection();
            });
        }
    }

    // ===== UPDATED FOCUS MODE TOGGLE =====
    async toggleFocusMode() {
        const newState = !this.currentState.isFocusModeActive;
        await this.setFocusMode(newState);
    }

    cacheData(key, value) {
        try {
            const data = JSON.parse(localStorage.getItem('aclb_cache') || '{}');
            data[key] = { value, timestamp: Date.now() };
            localStorage.setItem('aclb_cache', JSON.stringify(data));
        } catch (e) {
            console.warn('ACLB: Cache write failed', e);
        }
    }

    getCachedData(key, maxAge = 300000) { // 5 minutes default
        try {
            const data = JSON.parse(localStorage.getItem('aclb_cache') || '{}');
            const item = data[key];
            if (item && Date.now() - item.timestamp < maxAge) {
                return item.value;
            }
        } catch (e) {
            console.warn('ACLB: Cache read failed', e);
        }
        return null;
    }

    // ---------- Enhanced Summary Rendering ----------
    renderSummary(content) {
        const summaryOutput = document.getElementById('summary-output');
        if (!summaryOutput) return;

        if (!content) {
            summaryOutput.textContent = 'No summary available.';
            return;
        }

        // Truncate very long summaries
        let displayContent = content;
        if (content.length > 1000) {
            displayContent = content.substring(0, 1000) + '... [summary truncated]';
        }

        if (Array.isArray(displayContent)) {
            summaryOutput.innerHTML = displayContent.map(item => `• ${item}`).join('<br>');
        } else if (typeof displayContent === 'string') {
            // Clean up the summary - remove excessive punctuation
            const cleanedContent = displayContent
                .replace(/([.!?])\1+/g, '$1') // Remove duplicate punctuation
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

            summaryOutput.textContent = cleanedContent;
        }

        // Add active class for styling
        summaryOutput.className = 'summary-output active';
    }

    // ---------- Enhanced Distraction Display ----------
    async loadDistractions() {
        try {
            const response = await this.safeSendToBackground({ type: 'getDistractions' });

            if (response?.success && response.distractions) {
                this.updateDistractions(response.distractions);
                this.cacheData('distractions', response.distractions);
            } else {
                // Show demo data if no real data available
                this.updateDistractions();
            }
        } catch (error) {
            console.warn('⚠️ ACLB Popup: Distraction data unavailable, using demo data');
            this.updateDistractions();
        }
    }

    updateDistractions(distractions) {
        const distractionList = document.getElementById('distraction-list');
        if (!distractionList) return;

        // Show demo data if no real data available
        const demoDistractions = [
            { name: 'Social Media', percent: 65 },
            { name: 'News Sites', percent: 45 },
            { name: 'Email', percent: 30 },
            { name: 'Video Sites', percent: 25 },
            { name: 'Shopping', percent: 15 }
        ];

        const displayData = distractions && distractions.length > 0 ? distractions : demoDistractions;

        distractionList.innerHTML = '';

        displayData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'distraction-item';
            div.innerHTML = `
                <span class="distraction-name">${item.name || 'Unknown'}</span>
                <span class="distraction-percent">${item.percent || 0}%</span>
            `;
            distractionList.appendChild(div);
        });

        // Store in current state
        this.currentState.distractions = displayData;
    }

    // ===== ENHANCED SUMMARY GENERATION =====
    async generateRealSummary() {
        this.showLoading('Analyzing page content...');

        try {
            const response = await this.safeSendToBackground({
                type: 'requestSummaryViaBg'
            }, 10000); // 10 second timeout

            if (response?.success && response.summary) {
                this.renderSummary(response.summary);
                console.log('✅ Popup: Summary received successfully');
            } else {
                console.warn('⚠️ Popup: Summary request failed:', response?.error);
                this.renderSummary(response?.summary || 'Summary unavailable. Try browsing to a content-rich page like Wikipedia.');
            }
        } catch (error) {
            console.error('❌ Popup: Summary generation failed:', error);
            this.renderSummary('Summary service temporarily unavailable. Please refresh the page and try again.');
        }

        this.hideLoading();
    }

    async generateRealFocusPlan() {
        this.showLoading('Creating personalized focus plan...');

        try {
            // Try to get page content for context-aware planning
            const contentResponse = await this.safeSendToBackground({
                type: 'getPageContentViaBg'
            });

            let plan;
            if (contentResponse?.success && contentResponse.content?.length > 100) {
                // Content-aware focus plan
                plan = this.generateContentAwareFocusPlan(contentResponse.content);
            } else {
                // Generic focus plan
                plan = this.generateGenericFocusPlan();
            }

            this.renderPlan(plan);
        } catch (error) {
            console.error('❌ ACLB Popup: Focus plan generation failed:', error);
            this.renderPlan(this.generateGenericFocusPlan());
        }

        this.hideLoading();
    }

    generateContentAwareFocusPlan(content) {
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // 200 wpm

        const plan = [
            `📖 Estimated reading time: ${readingTime} minutes`,
            '⏱️ Break into 25-minute focused sessions',
            '🔄 Take 5-minute breaks between sections',
            '📝 Note down 3 key takeaways',
            '🔍 Review main points after reading',
            readingTime > 10 ? '💧 Stay hydrated during long reading sessions' : '🎯 You can finish this in one focused session'
        ];

        return plan.join('\n• ');
    }

    generateGenericFocusPlan() {
        const plan = [
            '⏱️ Set a 25-minute focus timer',
            '🔕 Close distracting tabs and notifications',
            '📖 Skim headings first to get overview',
            '🔄 Take 3-minute breaks every 25 minutes',
            '💧 Stay hydrated and maintain good posture',
            '🎯 Use focus mode to minimize distractions'
        ];

        return plan.join('\n• ');
    }

    updateFocusModeButton(state) {
        const btn = document.getElementById('focus-mode-btn');
        const badge = document.getElementById('focus-badge');
        const status = document.getElementById('focus-mode-status');

        if (!btn) return;

        switch (state) {
            case 'loading':
                btn.className = 'btn btn-focus-loading';
                btn.disabled = true;
                btn.innerHTML = '⏳ Toggling...';
                if (badge) badge.textContent = '...';
                if (status) status.textContent = 'Focus Mode: UPDATING';
                break;

            case 'active':
                btn.className = 'btn btn-focus-active';
                btn.disabled = false;
                btn.innerHTML = '🔓 Disable Focus Mode';
                if (badge) {
                    badge.textContent = 'ON';
                    badge.className = 'focus-badge badge-active';
                }
                if (status) status.textContent = 'Focus Mode: ACTIVE';
                break;

            case 'inactive':
                btn.className = 'btn btn-focus';
                btn.disabled = false;
                btn.innerHTML = '🎯 Enable Focus Mode';
                if (badge) {
                    badge.textContent = 'OFF';
                    badge.className = 'focus-badge badge-inactive';
                }
                if (status) status.textContent = 'Focus Mode: INACTIVE';
                break;
        }
    }

    showFocusIntensityControls() {
        // Find or create container for focus controls
        let controlsContainer = document.getElementById('focus-controls-container');
        if (!controlsContainer) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'focus-controls-container';
            // Insert after focus mode button
            const focusModeBtn = document.getElementById('focus-mode-btn');
            if (focusModeBtn && focusModeBtn.parentNode) {
                focusModeBtn.parentNode.insertBefore(controlsContainer, focusModeBtn.nextSibling);
            }
        }

        controlsContainer.innerHTML = this.createFocusModeControls();

        // Re-bind events for the new controls
        const focusIntensitySelect = document.getElementById('focusIntensity');
        const customizeFocusBtn = document.getElementById('customizeFocus');
        const debugPickerBtn = document.getElementById('debug-picker');

        if (focusIntensitySelect) {
            focusIntensitySelect.addEventListener('change', (e) => this.onFocusIntensityChange(e.target.value));
        }

        if (customizeFocusBtn) {
            customizeFocusBtn.addEventListener('click', () => this.onCustomizeFocus());
        }

        if (debugPickerBtn) {
            debugPickerBtn.addEventListener('click', () => this.debugElementPicker());
        }
    }

    hideFocusIntensityControls() {
        const controlsContainer = document.getElementById('focus-controls-container');
        if (controlsContainer) {
            controlsContainer.remove();
        }
    }

    renderPlan(plan) {
        const out = document.getElementById('plan-output');
        if (out) {
            out.textContent = plan;
            out.className = 'plan-output active';
        }
    }

    showLoading(message = 'Processing...') {
        this.showStatusMessage(message, 'loading');
        const overlay = this.refs.loadingOverlay;
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = this.refs.loadingOverlay;
        if (overlay) overlay.style.display = 'none';
    }

    // ---------- Context & messaging ----------
    validateExtensionContext() {
        try {
            if (!chrome?.runtime?.id) {
                this.isContextValid = false;
                this.contextInvalidated = true;
                return false;
            }
            chrome.runtime.getPlatformInfo?.(() => {
                this.isContextValid = true;
                this.contextInvalidated = false;
            });
            return true;
        } catch {
            this.isContextValid = false;
            this.contextInvalidated = true;
            return false;
        }
    }

    safeSendToBackground(message, timeout = 3000) {
        return new Promise((resolve) => {
            if (!chrome?.runtime?.id) {
                this.isContextValid = false;
                this.contextInvalidated = true;
                return resolve({ success: false, error: 'runtime missing', contextInvalidated: true });
            }
            let settled = false;
            const t = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    resolve({ success: false, error: 'timeout', timedOut: true });
                }
            }, timeout);
            try {
                chrome.runtime.sendMessage(message, (resp) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(t);
                    if (chrome.runtime.lastError) {
                        const msg = chrome.runtime.lastError.message || 'lastError';
                        const ctxInv = /context invalidated/i.test(msg);
                        this.contextInvalidated = this.contextInvalidated || ctxInv;
                        return resolve({ success: false, error: msg, contextInvalidated: ctxInv });
                    }
                    resolve(resp ?? { success: false, error: 'no response' });
                });
            } catch (e) {
                clearTimeout(t);
                const msg = e?.message || 'send error';
                const ctxInv = /context invalidated/i.test(msg);
                this.contextInvalidated = this.contextInvalidated || ctxInv;
                resolve({ success: false, error: msg, contextInvalidated: ctxInv });
            }
        });
    }

    async handleContextRecovery() {
        this.showStatusMessage('Recovering extension context…', 'loading');
        try {
            try { chrome.runtime.reload?.(); } catch { }
            await this.delay(800);
            if (!this.validateExtensionContext()) throw new Error('context still invalid');
            const ok = await this.tryDirectPing();
            if (ok?.success) {
                this.contextInvalidated = false;
                this.isContextValid = true;
                this.showStatusMessage('Context recovered', 'success');
                return true;
            }
            throw new Error('ping failed');
        } catch (e) {
            this.showStatusMessage('Recovery failed. Reopen popup.', 'error');
            return false;
        }
    }

    // ---------- Connection strategies ----------
    async loadCurrentStatus() {
        if (this.loadingStatus) return;
        this.loadingStatus = true;
        try {
            if (!this.validateExtensionContext()) {
                const recovered = await this.handleContextRecovery();
                if (!recovered) {
                    this.handleConnectionError({ contextInvalidated: true });
                    return;
                }
            }

            const strategies = [
                this.tryDirectPing.bind(this),
                this.tryBackgroundWakeup.bind(this),
                this.tryStorageFallback.bind(this),
            ];
            let res = null;
            for (const s of strategies) {
                res = await s();
                if (res?.success) break;
            }

            if (res?.success) {
                this.isConnected = true;
                this.retryCount = 0;
                if (this.retryTimerId) { clearTimeout(this.retryTimerId); this.retryTimerId = null; }
                await Promise.allSettled([
                    this.fetchTrackerStatus(),
                    this.fetchSummary(),
                    this.loadFocusScore(),
                    this.loadDistractions()
                ]);
                this.renderDiagnostics();
                this.showConnectionSuccess();
            } else {
                this.handleConnectionError(res || { error: 'no connection' });
            }
        } finally {
            this.loadingStatus = false;
        }
    }

    async tryDirectPing() {
        const resp = await this.safeSendToBackground({ type: 'ping' }, 1200);
        if (resp?.success) {
            return { success: true };
        }
        return { success: false, error: resp?.error || 'ping failed' };
    }

    async tryBackgroundWakeup() {
        await this.safeSendToBackground({ type: 'getStatus' }, 1500);
        await this.delay(300);
        return this.tryDirectPing();
    }

    async tryStorageFallback() {
        try {
            const data = await this.getFromStorage(['aclb_last_status']);
            if (data?.aclb_last_status) {
                this.currentState.lastUpdated = Date.now();
                return { success: false, error: 'using cached status' };
            }
        } catch { }
        return { success: false, error: 'no cache' };
    }

    // ---------- Fetchers ----------
    async fetchTrackerStatus() {
        const r = await this.safeSendToBackground({ type: 'getStatus' }, 1500);
        const svc = !!r?.serviceWorkerActive;
        this.isConnected = svc;

        // Update detail fields
        const conn = document.getElementById('status-connection');
        const init = document.getElementById('status-initialized');
        const mode = document.getElementById('status-mode');
        const reconn = document.getElementById('status-reconnect');

        if (conn) {
            conn.textContent = svc ? 'Connected' : 'Disconnected';
            conn.className = `status-value ${svc ? 'connected' : 'disconnected'}`;
        }
        if (init) {
            const initialized = (r?.connectedPorts ?? 0) > 0 || svc;
            init.textContent = initialized ? 'Ready' : 'Initializing';
            init.className = `status-value ${initialized ? 'ready' : 'initializing'}`;
        }
        if (mode) mode.textContent = 'Normal';
        if (reconn) reconn.textContent = String(r?.connectedPorts ?? 0);

        // Top badge and indicator
        const topTxt = document.getElementById('connection-text');
        const topDot = document.getElementById('status-indicator');
        const card = document.getElementById('connection-status');
        if (topTxt && topDot && card) {
            if (svc) {
                topTxt.textContent = 'Connected';
                topTxt.className = 'connection-text connected';
                topDot.className = 'status-indicator status-online';
                card.classList.remove('disconnected', 'connecting');
                card.classList.add('connected');
            } else {
                topTxt.textContent = 'Disconnected';
                topTxt.className = 'connection-text disconnected';
                topDot.className = 'status-indicator status-offline';
                card.classList.remove('connected', 'connecting');
                card.classList.add('disconnected');
            }
        }

        // Last updated
        const lu = document.getElementById('last-updated');
        if (lu) lu.textContent = new Date().toLocaleTimeString();
    }

    async fetchSummary() {
        const r = await this.safeSendToBackground({ type: 'getPageContentViaBg' }, 2500);
        if (r?.success && r.response?.content) {
            this.currentState.contentAnalysis = {
                title: r.response.title,
                wordCount: r.response.wordCount,
                url: r.response.url,
            };
            if (this.refs.summaryEl) {
                this.refs.summaryEl.textContent = `${r.response.title || 'Page'} — ${r.response.wordCount || 0} words`;
            }
        } else {
            if (this.refs.summaryEl) this.refs.summaryEl.textContent = 'No page content available.';
        }
    }

    // ---------- UI actions ----------
    async handleManualRetry() {
        if (this.loadingStatus) return;
        this.showStatusMessage('Reconnecting…', 'loading');
        await this.loadCurrentStatus();
    }

    // ---------- UI render ----------
    updateConnectionStatus() {
        if (this.contextInvalidated) {
            const topTxt = document.getElementById('connection-text');
            const topDot = document.getElementById('status-indicator');
            const card = document.getElementById('connection-status');
            if (topTxt) { topTxt.textContent = 'Context lost'; topTxt.className = 'connection-text disconnected'; }
            if (topDot) topDot.className = 'status-indicator status-offline';
            if (card) { card.classList.remove('connected', 'connecting'); card.classList.add('disconnected'); }
            this.showContextRecoveryOptions();
        }
    }

    showConnectionSuccess() { this.showStatusMessage('Connected', 'success'); }

    showDisconnectedState() {
        const topTxt = document.getElementById('connection-text');
        const topDot = document.getElementById('status-indicator');
        const card = document.getElementById('connection-status');
        if (topTxt) { topTxt.textContent = 'Disconnected'; topTxt.className = 'connection-text disconnected'; }
        if (topDot) topDot.className = 'status-indicator status-offline';
        if (card) { card.classList.remove('connected', 'connecting'); card.classList.add('disconnected'); }
        this.showStatusMessage('Disconnected', 'error');
    }

    showContextInvalidatedState() {
        this.contextInvalidated = true;
        this.updateConnectionStatus();
        this.showStatusMessage('Extension context lost. Recovery required.', 'error');
    }

    showPermanentRetryOption() {
        const btn = this.refs.retryBtn;
        if (btn) btn.disabled = false;
    }

    showContextRecoveryOptions() {
        const container = document.getElementById('context-recovery-options') || document.createElement('div');
        container.id = 'context-recovery-options';
        container.className = 'status-message status-loading';
        container.innerHTML = `
      <div class="status-icon">🛠️</div>
      <div class="status-text">Context lost. Try "Recover context" or reopen the popup.</div>
      <div style="display:flex; gap:8px; margin-left:8px;">
        <button id="recover-context" class="btn-secondary">Recover context</button>
        <button id="open-ext-page" class="btn-secondary">Manage extensions</button>
      </div>
    `;
        const host = document.getElementById('status-host') || document.body;
        if (!document.getElementById('context-recovery-options')) host.appendChild(container);

        document.getElementById('recover-context')?.addEventListener('click', () => this.handleContextRecovery());
        document.getElementById('open-ext-page')?.addEventListener('click', () => {
            try { chrome.tabs.create({ url: 'chrome://extensions' }); } catch { }
        });
    }

    renderDiagnostics() {
        const el = this.refs.diagnosticsEl;
        if (!el) return;
        const diag = {
            connected: this.isConnected,
            contextValid: this.isContextValid,
            contextInvalidated: this.contextInvalidated,
            retries: this.retryCount,
            lastUpdated: new Date().toLocaleTimeString(),
            focusScore: this.currentState.focusScore,
            distractions: this.currentState.distractions?.length || 0,
            focusModeActive: this.currentState.isFocusModeActive,
            currentTabId: this.currentTabId,
            focusIntensity: this.currentState.focusIntensity
        };
        el.textContent = JSON.stringify(diag, null, 2);
    }

    // ---------- Error/retry ----------
    handleConnectionError(error = {}) {
        this.isConnected = false;

        if (error.contextInvalidated || this.contextInvalidated) {
            this.showContextInvalidatedState();
            return;
        }

        const next = this.retryCount + 1;
        if (next > this.maxRetries) {
            this.showDisconnectedState();
            this.showPermanentRetryOption();
            return;
        }

        this.retryCount = next;
        const baseDelay = 1000;
        const expo = Math.min(5, this.retryCount - 1);
        const base = baseDelay * Math.pow(2, expo);
        const jitter = Math.round(base * 0.2 * (Math.random() * 2 - 1));
        const delay = Math.max(250, base + jitter);

        if (this.retryTimerId) clearTimeout(this.retryTimerId);
        this.retryTimerId = setTimeout(() => {
            this.retryTimerId = null;
            if (!this.loadingStatus) this.loadCurrentStatus();
        }, delay);

        this.updateConnectionStatus();
    }

    // ---------- Storage helpers ----------
    async saveToStorage(data) {
        return new Promise((resolve) => {
            try {
                if (!chrome?.storage?.local) return resolve(false);
                chrome.storage.local.set(data, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('ACLB: Storage save failed:', chrome.runtime.lastError);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            } catch (e) {
                console.warn('ACLB: Storage save error:', e);
                resolve(false);
            }
        });
    }

    async getFromStorage(keys) {
        return new Promise((resolve) => {
            try {
                if (!chrome?.storage?.local) return resolve(null);
                chrome.storage.local.get(keys, (res) => {
                    if (chrome.runtime.lastError) {
                        console.warn('ACLB: Storage get failed:', chrome.runtime.lastError);
                        resolve(null);
                    } else {
                        resolve(res);
                    }
                });
            } catch (e) {
                console.warn('ACLB: Storage get error:', e);
                resolve(null);
            }
        });
    }

    // ---------- Utils ----------
    delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    try { window.aclbPopup = new ACLBPopup(); } catch (e) { console.error('Popup boot error:', e); }
});