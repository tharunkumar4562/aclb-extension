// background.js - Enhanced with PERSISTENT ALARMS & AGGRESSIVE Service Worker Keep-Alive + FOCUS MODE STATE TRACKING + ELEMENT PICKER
class ACLBBackground {
    constructor() {
        // Enhanced state management with aggressive keep-alive
        this.isServiceWorkerActive = false;
        this.isActive = true;
        this.lastActivityTime = Date.now();
        this.connectedPorts = new Set();
        this.contentScriptReadyTabs = new Set();
        this.keepAliveInterval = null;
        this.activityMonitor = null;

        // Initialize Focus Mode Manager
        this.focusModeManager = new FocusModeManager();

        // Initialize with aggressive activation
        this.init();
    }

    init() {
        console.log('🔧 ACLB: Starting PERSISTENT background service...');

        // Mark as active immediately
        this.isServiceWorkerActive = true;
        this.isActive = true;

        // Setup message handlers FIRST
        this.setupMessageHandling();

        // Start ULTRA-AGGRESSIVE keep-alive
        this.startUltraKeepAlive();

        // Register persistent alarms for maximum reliability
        this.registerPersistentAlarms();

        // Initialize core systems
        this.setupEnhancedConnectionHandling();
        this.setupTabMonitoring();

        console.log('✅ ACLB: Background service ACTIVATED with persistent keep-alive & alarms');
    }

    // ===== FOCUS MODE PREFERENCES STORAGE =====
    async saveFocusPreferences(preferences) {
        await chrome.storage.local.set({
            focusPreferences: {
                intensity: preferences.intensity || 'medium',
                blockedSelectors: preferences.blockedSelectors || [],
                allowedSites: preferences.allowedSites || []
            }
        });
    }

    async getFocusPreferences() {
        const result = await chrome.storage.local.get(['focusPreferences']);
        return result.focusPreferences || {
            intensity: 'medium',
            blockedSelectors: [],
            allowedSites: []
        };
    }

    // ===== PERSISTENT ALARMS SYSTEM =====
    registerPersistentAlarms() {
        console.log('⏰ ACLB: Registering persistent alarms...');

        // Keep service worker alive with alarms (every 6 seconds)
        chrome.alarms.create('aclb_keepalive', {
            periodInMinutes: 0.1 // Every 6 seconds
        });

        // Additional alarm for health checks
        chrome.alarms.create('aclb_health_check', {
            periodInMinutes: 0.2 // Every 12 seconds
        });

        chrome.alarms.onAlarm.addListener((alarm) => {
            console.log(`🔔 ACLB: Alarm triggered: ${alarm.name}`);

            if (alarm.name === 'aclb_keepalive') {
                this.handleKeepAliveAlarm();
            } else if (alarm.name === 'aclb_health_check') {
                this.handleHealthCheckAlarm();
            }
        });
    }

    handleKeepAliveAlarm() {
        console.log('💓 ACLB: Keep-alive alarm triggered');
        this.performStorageKeepAlive();
        this.broadcastToPorts({
            type: 'alarm_keepalive',
            timestamp: Date.now()
        });

        // Force activity to ensure service worker stays active
        this.lastActivityTime = Date.now();
        this.isServiceWorkerActive = true;
    }

    handleHealthCheckAlarm() {
        console.log('🏥 ACLB: Health check alarm triggered');
        this.checkConnectionHealth();

        // Ensure alarms are still active (defensive programming)
        this.ensureAlarmsActive();
    }

    ensureAlarmsActive() {
        chrome.alarms.get('aclb_keepalive', (alarm) => {
            if (!alarm) {
                console.log('🔄 ACLB: Keep-alive alarm missing, recreating...');
                chrome.alarms.create('aclb_keepalive', { periodInMinutes: 0.1 });
            }
        });

        chrome.alarms.get('aclb_health_check', (alarm) => {
            if (!alarm) {
                console.log('🔄 ACLB: Health check alarm missing, recreating...');
                chrome.alarms.create('aclb_health_check', { periodInMinutes: 0.2 });
            }
        });
    }

    // ===== ULTRA-AGGRESSIVE KEEP-ALIVE SYSTEM =====
    startUltraKeepAlive() {
        console.log('🔄 ACLB: Starting ULTRA keep-alive system');

        // Clear any existing intervals
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        if (this.activityMonitor) clearInterval(this.activityMonitor);

        // Method 1: Storage-based keep-alive (every 15 seconds)
        this.keepAliveInterval = setInterval(() => {
            this.performStorageKeepAlive();
        }, 15000);

        // Method 2: Activity monitoring (every 10 seconds)
        this.activityMonitor = setInterval(() => {
            this.monitorActivity();
        }, 10000);

        // Method 3: Port-based keep-alive
        this.setupPersistentPorts();

        // Method 4: Initial aggressive wake-up calls
        this.initialWakeupSequence();
    }

    initialWakeupSequence() {
        // Send multiple wakeup calls in first minute
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.forceActivity();
            }, i * 5000);
        }
    }

    performStorageKeepAlive() {
        const keepAliveData = {
            timestamp: Date.now(),
            active: true,
            service: 'ACLB Cognitive Monitor',
            version: '1.0.0',
            alarmsActive: true
        };

        // Use multiple storage operations
        chrome.storage.local.set({
            'aclb_keepalive': keepAliveData,
            'aclb_last_keepalive': Date.now(),
            'aclb_service_active': true,
            'aclb_alarms_active': true
        }, () => {
            // Force multiple storage operations
            chrome.storage.local.get(['aclb_keepalive'], () => {
                this.isServiceWorkerActive = true;
            });

            // Additional storage operation
            chrome.storage.local.set({
                'aclb_heartbeat': Date.now()
            });
        });

        console.log('💓 ACLB: Storage keep-alive performed');
    }

    monitorActivity() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivityTime;

        // If no activity for 10 seconds, force activity
        if (timeSinceLastActivity > 10000) {
            console.log('🔄 ACLB: No recent activity, forcing keep-alive...');
            this.forceActivity();
        }

        // Check connection health
        this.checkConnectionHealth();
    }

    forceActivity() {
        console.log('⚡ ACLB: Forcing activity to prevent sleep');

        // Perform multiple operations
        this.performStorageKeepAlive();

        // Send ping to all connected ports
        this.broadcastToPorts({
            type: 'keepalive_ping',
            timestamp: Date.now(),
            source: 'background_keepalive'
        });

        // Additional storage operation
        chrome.storage.local.get(['aclb_settings'], () => {
            this.lastActivityTime = Date.now();
        });

        this.lastActivityTime = Date.now();
    }

    checkConnectionHealth() {
        const activeTabs = Array.from(this.contentScriptReadyTabs);
        console.log(`📊 ACLB: Connection health - Ports: ${this.connectedPorts.size}, Tabs: ${activeTabs.length}`);

        if (this.connectedPorts.size === 0 && activeTabs.length > 0) {
            console.log('🔄 ACLB: No ports but active tabs - may need reconnection');
        }
    }

    // ===== ENHANCED PERSISTENT PORTS SYSTEM =====
    setupPersistentPorts() {
        console.log('🔗 ACLB: Setting up persistent ports');

        chrome.runtime.onConnect.addListener((port) => {
            console.log(`🔗 ACLB: New port connected: ${port.name} from ${port.sender?.url}`);

            // Add to active ports
            this.connectedPorts.add(port);

            // Send immediate welcome message
            try {
                port.postMessage({
                    type: 'welcome',
                    serviceWorkerActive: true,
                    timestamp: Date.now(),
                    message: 'ACLB Background Service Active',
                    alarmsActive: true,
                    elementPickerAvailable: true
                });
            } catch (e) {
                console.warn('⚠️ ACLB: Port welcome failed, removing:', e.message);
                this.connectedPorts.delete(port);
            }

            // Handle port messages
            port.onMessage.addListener((msg) => {
                this.lastActivityTime = Date.now();

                if (msg.type === 'heartbeat') {
                    try {
                        port.postMessage({
                            type: 'heartbeat_ack',
                            timestamp: Date.now(),
                            active: true,
                            alarmsActive: true
                        });
                    } catch (e) {
                        this.connectedPorts.delete(port);
                    }
                }

                if (msg.type === 'alarm_keepalive') {
                    // Acknowledge alarm keep-alive
                    try {
                        port.postMessage({
                            type: 'alarm_ack',
                            timestamp: Date.now()
                        });
                    } catch (e) {
                        this.connectedPorts.delete(port);
                    }
                }

                if (msg.type === 'contentScriptReady') {
                    const tabId = port.sender?.tab?.id;
                    if (tabId) {
                        this.contentScriptReadyTabs.add(tabId);
                        console.log(`✅ ACLB: Content script ready for tab ${tabId}`);
                    }
                }
            });

            port.onDisconnect.addListener(() => {
                console.log(`🔌 ACLB: Port disconnected: ${port.name}`);
                this.connectedPorts.delete(port);

                // Try to reconnect if this was an important port
                if (port.name === 'content-script-persistent') {
                    console.log('🔄 ACLB: Important port disconnected, will attempt reconnection');
                }
            });
        });
    }

    broadcastToPorts(message) {
        let activeCount = 0;
        this.connectedPorts.forEach(port => {
            try {
                if (port.sender) {
                    port.postMessage(message);
                    activeCount++;
                }
            } catch (e) {
                // Remove dead ports
                this.connectedPorts.delete(port);
            }
        });

        if (activeCount === 0) {
            console.log('⚠️ ACLB: No active ports connected');
        }
    }

    // ===== ENHANCED MESSAGE HANDLING =====
    setupMessageHandling() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // UPDATE ACTIVITY TIMESTAMP on EVERY message
            this.lastActivityTime = Date.now();

            console.log(`📨 ACLB: Received message: ${message.action || message.type} from ${sender.tab?.url}`);

            // Handle wakeup requests immediately
            if (message.type === 'wakeup' || message.action === 'wakeup') {
                console.log('🔔 ACLB: Received explicit wakeup request');
                this.isServiceWorkerActive = true;
                this.forceActivity();
                sendResponse({ success: true, awake: true, timestamp: Date.now(), alarmsActive: true });
                return true;
            }

            // Handle both 'action' and 'type' message formats
            const messageType = message.action || message.type;

            switch (messageType) {
                case 'ping':
                    sendResponse({
                        success: true,
                        serviceWorkerActive: true,
                        timestamp: Date.now(),
                        alarmsActive: true
                    });
                    return false;

                case 'getStatus':
                    sendResponse({
                        success: true,
                        serviceWorkerActive: true,
                        connectedPorts: this.connectedPorts.size,
                        contentScriptReadyTabs: Array.from(this.contentScriptReadyTabs),
                        lastActivity: this.lastActivityTime,
                        alarmsActive: true
                    });
                    return false;

                // ===== ELEMENT PICKER HANDLERS =====
                case 'startElementPicker':
                    console.log('🎯 ACLB Background: Starting element picker for tab:', sender.tab?.id);

                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0]?.id) {
                            console.log('📤 Sending to content script in tab:', tabs[0].id);

                            // Send with BOTH action names for compatibility
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'startElementPicker',
                                type: 'startElementPicker' // Dual format for compatibility
                            }, (response) => {
                                if (chrome.runtime.lastError) {
                                    console.error('❌ Error sending to content script:', chrome.runtime.lastError);
                                    sendResponse({
                                        success: false,
                                        error: chrome.runtime.lastError.message
                                    });
                                } else {
                                    console.log('✅ Content script response:', response);
                                    sendResponse(response || { success: true });
                                }
                            });
                        } else {
                            sendResponse({ success: false, error: 'No active tab found' });
                        }
                    });
                    return true; // Keep message channel open

                case 'elementPickerStopped':
                    console.log('🎯 ACLB: Element picker stopped, selected count:', message.selectedCount);

                    // Update storage with the new blocked elements
                    if (message.selectedCount > 0) {
                        chrome.storage.local.set({
                            customBlockedElements: message.blockedElements || [],
                            lastElementPickerUpdate: Date.now()
                        });
                    }

                    sendResponse({ success: true });
                    return true;

                // ===== FOCUS MODE HANDLERS =====
                case 'focusModeChanged':
                    this.handleFocusModeChange(message, sender, sendResponse);
                    return true;

                case 'getFocusModeState':
                    if (sender.tab) {
                        const state = this.focusModeManager.getFocusMode(sender.tab.id);
                        sendResponse({ enabled: state });
                    } else {
                        // Fallback for when sender.tab is not available
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]?.id) {
                                const state = this.focusModeManager.getFocusMode(tabs[0].id);
                                sendResponse({ enabled: state });
                            } else {
                                sendResponse({ enabled: false });
                            }
                        });
                        return true;
                    }
                    return true;

                case 'setFocusModeState':
                    if (sender.tab) {
                        this.focusModeManager.setFocusMode(sender.tab.id, message.enabled);
                        sendResponse({ success: true });
                    } else {
                        // Fallback for when sender.tab is not available
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]?.id) {
                                this.focusModeManager.setFocusMode(tabs[0].id, message.enabled);
                                sendResponse({ success: true });
                            } else {
                                sendResponse({ success: false, error: 'No active tab' });
                            }
                        });
                        return true;
                    }
                    return true;

                // ===== FOCUS PREFERENCES HANDLERS =====
                case 'saveFocusPreferences':
                    this.handleSaveFocusPreferences(message, sender, sendResponse);
                    return true;

                case 'getFocusPreferences':
                    this.handleGetFocusPreferences(message, sender, sendResponse);
                    return true;

                case 'setFocusIntensity':
                    this.handleSetFocusIntensity(message, sender, sendResponse);
                    return true;

                // ===== MESSAGE RELAY HANDLERS =====
                case 'requestSummaryViaBg':
                    this.handleSummaryRequest(message, sender, sendResponse);
                    return true;

                case 'getPageContentViaBg':
                    this.handleGetPageContent(message, sender, sendResponse);
                    return true;

                case 'contentScriptReady':
                    // Handle direct content script ready messages
                    const tabId = sender.tab?.id;
                    if (tabId) {
                        this.contentScriptReadyTabs.add(tabId);
                        console.log(`✅ ACLB: Content script ready for tab ${tabId} via message`);
                    }
                    sendResponse({ success: true, confirmed: true, alarmsActive: true });
                    return false;

                case 'testConnection':
                    sendResponse({
                        success: true,
                        serviceWorkerActive: true,
                        connectedPorts: this.connectedPorts.size,
                        alarmsActive: true,
                        timestamp: Date.now()
                    });
                    return false;

                default:
                    console.warn('⚠️ ACLB: Unknown message type:', messageType);
                    sendResponse({ success: false, error: 'Unknown message type: ' + messageType });
                    return false;
            }
        });
    }

    // ===== FOCUS PREFERENCES HANDLERS =====
    async handleSaveFocusPreferences(message, sender, sendResponse) {
        try {
            await this.saveFocusPreferences(message.preferences);
            sendResponse({
                success: true,
                message: 'Focus preferences saved successfully'
            });
        } catch (error) {
            console.error('❌ ACLB: Failed to save focus preferences:', error);
            sendResponse({
                success: false,
                error: 'Failed to save focus preferences'
            });
        }
    }

    async handleGetFocusPreferences(message, sender, sendResponse) {
        try {
            const preferences = await this.getFocusPreferences();
            sendResponse({
                success: true,
                preferences: preferences
            });
        } catch (error) {
            console.error('❌ ACLB: Failed to get focus preferences:', error);
            sendResponse({
                success: false,
                error: 'Failed to get focus preferences'
            });
        }
    }

    async handleSetFocusIntensity(message, sender, sendResponse) {
        try {
            // Update the focus preferences with new intensity
            const currentPreferences = await this.getFocusPreferences();
            const updatedPreferences = {
                ...currentPreferences,
                intensity: message.intensity
            };

            await this.saveFocusPreferences(updatedPreferences);

            // Broadcast intensity change to all content scripts
            this.broadcastToPorts({
                type: 'focusIntensityChanged',
                intensity: message.intensity,
                preferences: updatedPreferences
            });

            sendResponse({
                success: true,
                message: `Focus intensity set to: ${message.intensity}`
            });
        } catch (error) {
            console.error('❌ ACLB: Failed to set focus intensity:', error);
            sendResponse({
                success: false,
                error: 'Failed to set focus intensity'
            });
        }
    }

    // ===== ENHANCED SUMMARY REQUEST HANDLER =====
    async handleSummaryRequest(message, sender, sendResponse) {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            if (!tab || !this.canTabReceiveMessages(tab.url)) {
                sendResponse({
                    success: false,
                    error: 'No eligible active tab or restricted page',
                    summary: 'Cannot summarize this page type. Try a content-rich page like Wikipedia.'
                });
                return;
            }

            // Relay to content script with timeout
            chrome.tabs.sendMessage(tab.id, {
                type: 'requestSummary',
                timestamp: Date.now()
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Background: Content script error:', chrome.runtime.lastError);
                    sendResponse({
                        success: false,
                        error: chrome.runtime.lastError.message,
                        summary: 'Content script not available. Please refresh the page.'
                    });
                    return;
                }

                if (response?.success) {
                    sendResponse({
                        success: true,
                        summary: response.summary,
                        extractionMethod: response.extractionMethod,
                        aiGenerated: response.aiGenerated
                    });
                } else {
                    sendResponse({
                        success: false,
                        error: response?.error || 'No summary generated',
                        summary: 'Summary unavailable. Try browsing to a content-rich page like Wikipedia.'
                    });
                }
            });
        } catch (error) {
            console.error('❌ Background: Summary request failed:', error);
            sendResponse({
                success: false,
                error: error.message,
                summary: 'Service temporarily unavailable. Please try again.'
            });
        }
    }

    async handleGetPageContent(message, sender, sendResponse) {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            if (!tab || !this.canTabReceiveMessages(tab.url)) {
                sendResponse({ success: false, error: 'Cannot access page content' });
                return;
            }

            chrome.tabs.sendMessage(tab.id, { type: 'getPageContent' }, (response) => {
                if (chrome.runtime.lastError) {
                    sendResponse({
                        success: false,
                        error: chrome.runtime.lastError.message
                    });
                    return;
                }

                sendResponse({
                    success: true,
                    content: response?.content || '',
                    title: response?.title || ''
                });
            });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    // ===== ENHANCED CONNECTION MANAGEMENT =====
    setupEnhancedConnectionHandling() {
        chrome.runtime.onConnect.addListener((port) => {
            if (port.name === 'content-script' || port.name === 'content-script-persistent') {
                console.log(`🔗 ACLB: Enhanced connection from ${port.name}`);
                this.connectedPorts.add(port);

                port.onMessage.addListener((msg) => {
                    this.lastActivityTime = Date.now();

                    // Handle element picker messages through ports too
                    if (msg.action === 'startElementPicker') {
                        console.log('🎯 ACLB: Element picker request via port');
                        // You can handle port-based element picker requests here if needed
                    }

                    if (msg.type === 'contentScriptReady') {
                        const tabId = port.sender?.tab?.id;
                        if (tabId) {
                            this.contentScriptReadyTabs.add(tabId);
                            console.log(`✅ ACLB: Content script ready for tab ${tabId}`);

                            try {
                                port.postMessage({
                                    type: 'contentScriptConfirmed',
                                    timestamp: Date.now(),
                                    serviceWorkerActive: true,
                                    alarmsActive: true,
                                    elementPickerAvailable: true // Indicate element picker is available
                                });
                            } catch (e) {
                                // Port might be closed
                            }
                        }
                    }

                    // Handle heartbeat from content script
                    if (msg.type === 'heartbeat') {
                        try {
                            port.postMessage({
                                type: 'heartbeat_response',
                                timestamp: Date.now()
                            });
                        } catch (e) {
                            this.connectedPorts.delete(port);
                        }
                    }

                    // Handle alarm keep-alive responses
                    if (msg.type === 'alarm_keepalive') {
                        try {
                            port.postMessage({
                                type: 'alarm_ack',
                                timestamp: Date.now()
                            });
                        } catch (e) {
                            this.connectedPorts.delete(port);
                        }
                    }

                    // Handle focus preference requests
                    if (msg.type === 'getFocusPreferences') {
                        this.getFocusPreferences().then(prefs => {
                            try {
                                port.postMessage({
                                    type: 'focusPreferences',
                                    preferences: prefs
                                });
                            } catch (e) {
                                this.connectedPorts.delete(port);
                            }
                        });
                    }

                    // Handle focus mode state requests
                    if (msg.type === 'getFocusModeState') {
                        const tabId = port.sender?.tab?.id;
                        if (tabId) {
                            const state = this.focusModeManager.getFocusMode(tabId);
                            try {
                                port.postMessage({
                                    type: 'focusModeState',
                                    enabled: state
                                });
                            } catch (e) {
                                this.connectedPorts.delete(port);
                            }
                        }
                    }
                });

                port.onDisconnect.addListener(() => {
                    this.connectedPorts.delete(port);
                    const tabId = port.sender?.tab?.id;
                    if (tabId) {
                        this.contentScriptReadyTabs.delete(tabId);
                    }
                    console.log(`🔌 ACLB: Port ${port.name} disconnected`);
                });
            }
        });
    }

    // ===== EXISTING FOCUS MODE HANDLER =====
    async handleFocusModeChange(message, sender, sendResponse) {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            if (tab && this.canTabReceiveMessages(tab.url)) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'focusModeChanged',
                    isActive: message.isActive
                });
            }

            sendResponse({ received: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    // ===== TAB MONITORING =====
    setupTabMonitoring() {
        // Monitor tab updates to maintain connections
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.canTabReceiveMessages(tab.url)) {
                console.log(`🔄 ACLB: Tab ${tabId} updated, ensuring connection`);
                // This will trigger content script re-initialization
            }
        });

        // Handle tab removal
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.contentScriptReadyTabs.delete(tabId);
            console.log(`🗑️ ACLB: Tab ${tabId} removed from ready set`);
        });
    }

    // ===== UTILITY METHODS =====
    canTabReceiveMessages(url) {
        if (!url) return false;

        // Allow http, https, and file URLs for local development
        const allowedProtocols = ['http:', 'https:', 'file:'];
        try {
            const urlObj = new URL(url);
            return allowedProtocols.includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    // ===== ELEMENT PICKER TEST FUNCTION =====
    testElementPickerCommunication() {
        console.log('🧪 Testing element picker communication...');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                // Test if content script responds
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'ping'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ Content script not responsive:', chrome.runtime.lastError);
                    } else {
                        console.log('✅ Content script is responsive:', response);

                        // Now test element picker
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'startElementPicker'
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error('❌ Element picker failed:', chrome.runtime.lastError);
                            } else {
                                console.log('✅ Element picker response:', response);
                            }
                        });
                    }
                });
            }
        });
    }

    // ===== INITIALIZE CORE SYSTEMS =====
    initializeCoreSystems() {
        console.log('🔧 ACLB: Initializing core background systems...');
        // Any additional core system initialization can go here
        this.isServiceWorkerActive = true;
    }

    // ===== SETUP CONNECTION MONITORING =====
    setupConnectionMonitoring() {
        console.log('🔍 ACLB: Setting up connection monitoring...');
        // Enhanced connection monitoring logic can be added here
    }

    // ===== CLEANUP =====
    cleanup() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
        if (this.activityMonitor) {
            clearInterval(this.activityMonitor);
            this.activityMonitor = null;
        }

        // Clear alarms on cleanup
        chrome.alarms.clear('aclb_keepalive');
        chrome.alarms.clear('aclb_health_check');

        console.log('🧹 ACLB: Background service cleanup completed');
    }
}

// ===== FOCUS MODE MANAGER CLASS =====
// Add persistent focus mode state tracking
class FocusModeManager {
    constructor() {
        this.focusModeStates = new Map(); // tabId -> focusState
        this.init();
    }

    init() {
        // Load saved states from storage
        chrome.storage.local.get(['focusModeStates']).then(result => {
            if (result.focusModeStates) {
                this.focusModeStates = new Map(Object.entries(result.focusModeStates));
                console.log('🔍 FocusModeManager: Loaded saved focus mode states');
            }
        });

        // Track tab updates and closures
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.focusModeStates.delete(tabId);
            this.saveStates();
        });

        // Handle tab URL changes
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.url) {
                // Reset focus mode on navigation
                this.setFocusMode(tabId, false);
            }
        });

        // Handle keyboard commands for focus mode
        chrome.commands.onCommand.addListener((command, tab) => {
            if (command === 'toggle-focus-mode') {
                const currentState = this.getFocusMode(tab.id);
                this.setFocusMode(tab.id, !currentState);
            }
        });
    }

    setFocusMode(tabId, enabled) {
        this.focusModeStates.set(tabId.toString(), enabled);
        this.saveStates();

        // Notify content script
        chrome.tabs.sendMessage(tabId, {
            action: 'focusModeChanged',
            enabled: enabled
        }).catch(() => {
            // Content script not ready, that's ok
        });

        console.log(`🎯 FocusModeManager: Tab ${tabId} focus mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    getFocusMode(tabId) {
        return this.focusModeStates.get(tabId.toString()) || false;
    }

    saveStates() {
        const statesObject = Object.fromEntries(this.focusModeStates);
        chrome.storage.local.set({ focusModeStates: statesObject });
    }
}

// Initialize background service with aggressive keep-alive
const aclbBackground = new ACLBBackground();

// Handle service worker shutdown gracefully
chrome.runtime.onSuspend.addListener(() => {
    console.log('🔌 ACLB: Service worker suspending, performing cleanup...');
    aclbBackground.cleanup();
});

// Handle service worker startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 ACLB: Service worker starting up...');
    // The constructor will automatically reinitialize
});

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ACLBBackground, FocusModeManager };
}