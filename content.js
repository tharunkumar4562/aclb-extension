// 🚨 CONFLICT PREVENTION - Only one content script should run
if (window.aclbContentScriptLoaded) {
    console.log('🚫 ACLB: Duplicate content script detected, stopping execution');
    throw new Error('ACLB: Remove duplicate content script injection from background.js');
}
window.aclbContentScriptLoaded = true;
console.log('✅ ACLB: Content script starting - single instance enforced');

// Add at the top of content.js
console.log('🚀 ACLB Content Script Loaded');

// ===== ELEMENT PICKER FOR CUSTOM BLOCKING =====
class ElementPicker {
    constructor() {
        this.isActive = false;
        this.selectedElements = new Set();
        this.originalStyles = new Map();
    }

    start() {
        if (this.isActive) return;

        console.log('🎯 ACLB: Starting element picker mode');
        this.isActive = true;

        // Change cursor to indicate picking mode
        document.body.style.cursor = 'crosshair';

        // Add overlay to indicate active mode
        this.addPickerOverlay();

        // Add event listeners
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
        document.addEventListener('click', this.handleElementClick.bind(this), true);
        document.addEventListener('keydown', this.handleKeyPress.bind(this), true);

        return { success: true, message: 'Element picker started' };
    }

    stop() {
        if (!this.isActive) return;

        console.log('🎯 ACLB: Stopping element picker mode');
        this.isActive = false;

        // Restore cursor
        document.body.style.cursor = '';

        // Remove overlay
        this.removePickerOverlay();

        // Remove event listeners
        document.removeEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.removeEventListener('mouseout', this.handleMouseOut.bind(this), true);
        document.removeEventListener('click', this.handleElementClick.bind(this), true);
        document.removeEventListener('keydown', this.handleKeyPress.bind(this), true);

        // Restore all hover styles
        this.restoreAllHoverStyles();
    }

    handleMouseOver(event) {
        if (!this.isActive) return;

        const element = event.target;
        if (element === document.body) return;

        // Store original style
        if (!this.originalStyles.has(element)) {
            this.originalStyles.set(element, {
                outline: element.style.outline,
                backgroundColor: element.style.backgroundColor
            });
        }

        // Highlight element on hover
        element.style.outline = '2px solid #ff4444';
        element.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
    }

    handleMouseOut(event) {
        if (!this.isActive) return;

        const element = event.target;
        const original = this.originalStyles.get(element);

        if (original) {
            element.style.outline = original.outline;
            element.style.backgroundColor = original.backgroundColor;
        }
    }

    handleElementClick(event) {
        if (!this.isActive) return;

        event.preventDefault();
        event.stopPropagation();

        const element = event.target;
        this.toggleElementBlock(element);
    }

    handleKeyPress(event) {
        // Escape key to exit picker mode
        if (event.key === 'Escape' && this.isActive) {
            this.stop();

            // Notify background that picker mode ended
            chrome.runtime.sendMessage({
                action: 'elementPickerStopped',
                selectedCount: this.selectedElements.size
            });
        }
    }

    toggleElementBlock(element) {
        const selector = this.getElementSelector(element);

        if (this.selectedElements.has(selector)) {
            // Unblock element
            this.selectedElements.delete(selector);
            element.style.display = '';
            console.log(`🔓 ACLB: Unblocked element: ${selector}`);
        } else {
            // Block element
            this.selectedElements.add(selector);
            element.style.display = 'none';
            console.log(`🚫 ACLB: Blocked element: ${selector}`);
        }

        // Save to storage
        this.saveBlockedElements();
    }

    getElementSelector(element) {
        // Generate a unique selector for the element
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className) {
            const classes = element.className.toString().split(' ').filter(c => c).join('.');
            if (classes) {
                return `${element.tagName.toLowerCase()}.${classes}`;
            }
        }

        // Fallback to generating a path
        return this.generateSelectorPath(element);
    }

    generateSelectorPath(element) {
        const path = [];
        let current = element;

        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();

            if (current.id) {
                selector += `#${current.id}`;
                path.unshift(selector);
                break;
            }

            if (current.className) {
                const classes = current.className.toString().split(' ').filter(c => c).join('.');
                if (classes) {
                    selector += `.${classes}`;
                }
            }

            // Add nth-child if possible
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-child(${index})`;
            }

            path.unshift(selector);
            current = parent;
        }

        return path.join(' > ');
    }

    saveBlockedElements() {
        const blockedElements = Array.from(this.selectedElements);
        chrome.storage.local.set({
            customBlockedElements: blockedElements,
            focusIntensity: 'custom'
        });
    }

    addPickerOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'aclb-element-picker-overlay';
        overlay.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: #ff4444; color: white; padding: 10px; border-radius: 5px; z-index: 10000; font-family: Arial, sans-serif;">
                <strong>🎯 Element Picker Active</strong>
                <div style="font-size: 12px; margin-top: 5px;">
                    Click elements to hide/show them • Press ESC to exit
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    removePickerOverlay() {
        const overlay = document.getElementById('aclb-element-picker-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    restoreAllHoverStyles() {
        this.originalStyles.forEach((original, element) => {
            element.style.outline = original.outline;
            element.style.backgroundColor = original.backgroundColor;
        });
        this.originalStyles.clear();
    }
}

// Initialize element picker
const elementPicker = new ElementPicker();

// ===== ENHANCED MESSAGE HANDLING =====
function setupEnhancedMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 ACLB: Received message:', request.action || request.type);

        // Handle both 'action' and 'type' formats
        const action = request.action || request.type;

        switch (action) {
            case 'requestSummary':
                console.log('🧠 ACLB: Processing summary request');
                if (window.aclbTracker) {
                    // Use the enhanced summary generation
                    window.aclbTracker.generateIntelligentSummary()
                        .then(summary => {
                            console.log('✅ ACLB: Summary generated successfully');
                            sendResponse({
                                success: true,
                                summary: summary,
                                extractionMethod: window.aclbTracker.contentAnalysis.extractionMethod,
                                aiGenerated: window.aclbTracker.contentAnalysis.aiGenerated
                            });
                        })
                        .catch(error => {
                            console.error('❌ ACLB: Summary generation failed:', error);
                            // Fallback to heuristic summary
                            const fallbackSummary = window.aclbTracker.generateFallbackSummary();
                            sendResponse({
                                success: true,
                                summary: fallbackSummary,
                                extractionMethod: 'fallback',
                                aiGenerated: false,
                                error: error.message
                            });
                        });
                    return true; // Keep channel open for async
                } else {
                    console.error('❌ ACLB: Tracker not available for summary');
                    sendResponse({
                        success: false,
                        error: 'Content tracker not initialized',
                        summary: 'Please refresh the page and try again.'
                    });
                }
                return true;

            case 'getPageContent':
                console.log('📄 ACLB: Processing page content request');
                if (window.aclbTracker) {
                    const content = window.aclbTracker.getPageContent();
                    sendResponse({
                        success: true,
                        content: content,
                        title: document.title,
                        url: window.location.href,
                        wordCount: content ? content.trim().split(/\s+/).filter(Boolean).length : 0,
                        extractionMethod: window.aclbTracker.contentAnalysis.extractionMethod,
                        focusScore: window.aclbTracker.realFocusAnalyzer.calculateRealFocusScore()
                    });
                } else {
                    sendResponse({
                        success: false,
                        content: '',
                        title: document.title,
                        url: window.location.href,
                        error: 'Tracker not initialized'
                    });
                }
                return true;

            case 'testConnection':
                console.log('🔍 ACLB: Processing test connection');
                sendResponse({
                    success: true,
                    connected: true,
                    trackerAvailable: !!window.aclbTracker,
                    contentExtracted: window.aclbTracker?.hasContent() || false,
                    timestamp: Date.now()
                });
                return true;

            case 'startElementPicker':
            case 'activateElementPicker':
                console.log('🎯 Starting element picker via message');
                try {
                    const result = elementPicker.start();
                    sendResponse(result);
                    return true;
                } catch (error) {
                    console.error('❌ Error starting element picker:', error);
                    sendResponse({ success: false, error: error.message });
                    return true;
                }

            case 'stopElementPicker':
                elementPicker.stop();
                sendResponse({ success: true });
                return true;

            case 'ping':
                sendResponse({
                    success: true,
                    pong: true,
                    timestamp: Date.now(),
                    elementPickerAvailable: true
                });
                return true;

            default:
                console.warn('⚠️ ACLB: Unknown message action:', action);
                sendResponse({ error: `Unknown action: ${action}` });
                return false;
        }
    });
}

// Initialize the enhanced message listener
setupEnhancedMessageListener();

// ===== GLOBAL ELEMENT PICKER INSTANCE & FUNCTIONS =====
console.log('🔧 ACLB: Initializing global element picker...');

// Make element picker globally accessible
window.aclbElementPicker = elementPicker;

// Global functions for direct access
window.startElementPicker = function () {
    console.log('🎯 ACLB: Starting element picker via global function');
    return elementPicker.start();
};

window.stopElementPicker = function () {
    console.log('🎯 ACLB: Stopping element picker via global function');
    return elementPicker.stop();
};

// Test function for debugging
window.testElementPicker = function () {
    console.log('🧪 Testing element picker...');
    const result = elementPicker.start();
    console.log('Element picker test result:', result);
    return result;
};

console.log('✅ ACLB: Global element picker functions registered');

// ===== SMART AUTO-BLOCKING SYSTEM =====
class SmartAutoBlocker {
    constructor() {
        this.commonDistractions = [
            // Social media elements
            '[data-testid*="sidebar"]', '[aria-label*="trend"]', '[data-testid*="news"]',
            // Recommendation sections
            '#related', '#recommendations', '.recommended', '.suggested',
            // Comment sections
            '#comments', '.comments', '[class*="comment"]',
            // Notification elements
            '[aria-label*="notification"]', '.notification', '.alert',
            // Ads and promos
            '.ad', '.advertisement', '.promo', '.sponsored',
            // Social sharing
            '.social', '.share', '.like', '.follow',
            // Popups and modals
            '.popup', '.modal', '[role="dialog"]',
            // Video recommendations
            '#secondary', '.watch-next', '.related-videos'
        ];

        this.blockedCount = 0;
    }

    startAutoBlocking() {
        console.log('🤖 ACLB: Starting smart auto-blocking...');

        // Block common distractions
        this.commonDistractions.forEach(selector => {
            this.blockElementsBySelector(selector);
        });

        // Block based on page analysis
        this.analyzeAndBlockPage();

        console.log(`✅ ACLB: Auto-blocking completed. Blocked ${this.blockedCount} elements.`);

        return {
            success: true,
            message: `Auto-blocked ${this.blockedCount} distracting elements`,
            blockedCount: this.blockedCount
        };
    }

    blockElementsBySelector(selector) {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.shouldBlockElement(element)) {
                    this.hideElement(element);
                    this.blockedCount++;
                }
            });
        } catch (error) {
            console.warn(`⚠️ ACLB: Error blocking selector ${selector}:`, error);
        }
    }

    analyzeAndBlockPage() {
        const hostname = window.location.hostname;

        // Site-specific blocking rules
        if (hostname.includes('youtube.com')) {
            this.blockYouTubeDistractions();
        } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            this.blockTwitterDistractions();
        } else if (hostname.includes('instagram.com')) {
            this.blockInstagramDistractions();
        } else if (hostname.includes('facebook.com')) {
            this.blockFacebookDistractions();
        } else if (hostname.includes('linkedin.com')) {
            this.blockLinkedInDistractions();
        } else if (hostname.includes('reddit.com')) {
            this.blockRedditDistractions();
        }

        // Generic analysis
        this.blockByContentAnalysis();
    }

    blockYouTubeDistractions() {
        const youtubeSelectors = [
            '#related', '#comments', 'ytd-watch-next-secondary-results-renderer',
            'ytd-rich-section-renderer', 'ytd-notification-renderer'
        ];
        youtubeSelectors.forEach(selector => this.blockElementsBySelector(selector));
    }

    blockTwitterDistractions() {
        const twitterSelectors = [
            '[data-testid="sidebarColumn"]', '[aria-label="Timeline: Trending now"]',
            '[data-testid="primaryColumn"] [aria-label*="Trend"]', '[data-testid="whoToFollow"]'
        ];
        twitterSelectors.forEach(selector => this.blockElementsBySelector(selector));
    }

    blockInstagramDistractions() {
        const instagramSelectors = [
            '[aria-label="Notifications"]', '._a9_1', '._a9_0'
        ];
        instagramSelectors.forEach(selector => this.blockElementsBySelector(selector));
    }

    blockFacebookDistractions() {
        const facebookSelectors = [
            '[role="feed"]', '[aria-label="Stories"]', '[role="navigation"] a[aria-label*="Notification"]'
        ];
        facebookSelectors.forEach(selector => this.blockElementsBySelector(selector));
    }

    blockLinkedInDistractions() {
        const linkedinSelectors = [
            '.scaffold-layout__aside', '.feed-shared-update-v2', '.msg-overlay-list-bubble'
        ];
        linkedinSelectors.forEach(selector => this.blockElementsBySelector(selector));
    }

    blockRedditDistractions() {
        const redditSelectors = [
            '.recommentation', '.trending-posts', '.community-box'
        ];
        redditSelectors.forEach(selector => this.blockElementsBySelector(selector));
    }

    shouldBlockElement(element) {
        // Don't block if element is too small
        const rect = element.getBoundingClientRect();
        if (rect.width < 50 && rect.height < 50) return false;

        // Don't block if element contains important content
        const text = element.textContent || '';
        if (text.includes('login') || text.includes('sign in') || text.includes('menu')) return false;

        // Check if element looks like navigation
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'nav' || tagName === 'header' || tagName === 'footer') return false;

        return true;
    }

    hideElement(element) {
        // Store original display for potential restoration
        if (!element.dataset.originalDisplay) {
            element.dataset.originalDisplay = element.style.display || '';
        }

        element.style.display = 'none';
        element.setAttribute('data-aclb-blocked', 'true');
    }

    restoreAllBlockedElements() {
        const blockedElements = document.querySelectorAll('[data-aclb-blocked="true"]');
        blockedElements.forEach(element => {
            element.style.display = element.dataset.originalDisplay || '';
            element.removeAttribute('data-aclb-blocked');
        });

        console.log(`🔓 ACLB: Restored ${blockedElements.length} blocked elements`);
        return blockedElements.length;
    }

    blockByContentAnalysis() {
        // Analyze page content to identify distractions
        const allElements = document.querySelectorAll('div, section, aside, article');

        allElements.forEach(element => {
            if (this.isLikelyDistraction(element)) {
                this.hideElement(element);
                this.blockedCount++;
            }
        });
    }

    isLikelyDistraction(element) {
        const text = element.textContent || '';
        const html = element.innerHTML || '';

        // Common distraction keywords
        const distractionKeywords = [
            'recommended', 'trending', 'popular', 'you may like', 'sponsored',
            'advertisement', 'suggested', 'related', 'watch next', 'follow',
            'subscribe', 'newsletter', 'notification', 'alert'
        ];

        const hasDistractionText = distractionKeywords.some(keyword =>
            text.toLowerCase().includes(keyword) || html.toLowerCase().includes(keyword)
        );

        // Check for common distraction classes
        const classes = element.className || '';
        const distractionClasses = [
            'recommended', 'trending', 'popular', 'sponsored', 'ad',
            'suggestion', 'related', 'notification', 'alert', 'promo'
        ];

        const hasDistractionClass = distractionClasses.some(cls =>
            classes.toLowerCase().includes(cls)
        );

        return hasDistractionText || hasDistractionClass;
    }
}

// Initialize auto-blocker
const autoBlocker = new SmartAutoBlocker();

// Add to window for global access
window.aclbAutoBlocker = autoBlocker;

// ============================ CENTRALIZED BLOCKING CONFIGURATION ============================
const blockingRules = {
    'youtube.com': [
        '#comments', // Comments section
        '#related', // Related videos sidebar
        'ytd-notification-renderer', // Notification badges
        'ytd-rich-section-renderer', // Recommended sections,
    ],
    'instagram.com': [
        '[aria-label="Notifications"]', // Notification bell
        'main section > div > div', // Stories ring & feed (common selector)
        'article', // Individual posts,
    ],
    'linkedin.com': [
        '.scaffold-layout__aside', // Right sidebar
        '.feed-shared-update-v2', // Feed posts
        '.msg-overlay-list-bubble', // Messaging popup,
    ],
    'facebook.com': [
        '[role="feed"]', // Main news feed
        '[aria-label="Stories"]', // Stories
        '[role="navigation"] a[aria-label*="Notification"]', // Notification area,
    ],
    'twitter.com': [
        '[data-testid="primaryColumn"] [aria-label="Timeline"]', // Timeline
        '[data-testid="sidebarColumn"]', // Right sidebar,
    ],
    'x.com': [ // Also cover Twitter's new domain
        '[data-testid="primaryColumn"] [aria-label="Timeline"]',
        '[data-testid="sidebarColumn"]',
    ]
    // Add more sites and their selectors here
};

// ============================ ADAPTIVE BLOCKING WITH MUTATION OBSERVER ============================
class AdaptiveBlocker {
    constructor() {
        this.currentHostname = window.location.hostname;
        this.observer = null;
        this.isBlocking = false;
        this.rulesToApply = [];
    }

    start() {
        this.rulesToApply = this.getRulesForCurrentSite();

        if (this.rulesToApply.length === 0) {
            console.log('🔍 ACLB: No blocking rules for this site:', this.currentHostname);
            return;
        }

        console.log('🚫 ACLB: Starting adaptive blocking for:', this.currentHostname, 'with', this.rulesToApply.length, 'rules');

        // Run immediately
        this.hideDistractions();

        // Set up the observer to run again when the page changes
        this.observer = new MutationObserver(() => this.hideDistractions());
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Re-run on page navigation (for SPAs)
        window.addEventListener('popstate', () => this.hideDistractions());
        window.addEventListener('pushstate', () => this.hideDistractions());

        this.isBlocking = true;
    }

    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Remove event listeners
        window.removeEventListener('popstate', () => this.hideDistractions());
        window.removeEventListener('pushstate', () => this.hideDistractions());

        // Restore hidden elements
        this.showDistractions();

        this.isBlocking = false;
        console.log('🔓 ACLB: Adaptive blocking stopped');
    }

    getRulesForCurrentSite() {
        return Object.entries(blockingRules).find(([domain]) =>
            this.currentHostname.includes(domain)
        )?.[1] || [];
    }

    hideDistractions() {
        this.rulesToApply.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(element => {
                    if (element.style.display !== 'none') {
                        // Store original display value before hiding
                        if (!element.dataset.aclbOriginalDisplay) {
                            element.dataset.aclbOriginalDisplay = element.style.display || '';
                        }
                        element.style.display = 'none';
                    }
                });
            } catch (error) {
                console.warn('⚠️ ACLB: Error hiding elements for selector:', selector, error);
            }
        });
    }

    showDistractions() {
        this.rulesToApply.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(element => {
                    if (element.dataset.aclbOriginalDisplay !== undefined) {
                        element.style.display = element.dataset.aclbOriginalDisplay;
                        delete element.dataset.aclbOriginalDisplay;
                    } else {
                        element.style.display = '';
                    }
                });
            } catch (error) {
                console.warn('⚠️ ACLB: Error showing elements for selector:', selector, error);
            }
        });
    }

    updateForNewPage() {
        this.currentHostname = window.location.hostname;
        const newRules = this.getRulesForCurrentSite();

        if (JSON.stringify(newRules) !== JSON.stringify(this.rulesToApply)) {
            console.log('🔄 ACLB: Page changed, updating blocking rules');
            this.stop();
            this.rulesToApply = newRules;
            if (this.isBlocking) {
                this.start();
            }
        }
    }
}

// ============================ SPA NAVIGATION DETECTION ============================
class ACLBContent {
    constructor(tracker) {
        this.tracker = tracker;
        this.currentURL = window.location.href;
        this.isSPA = this.detectSPA();
        this.adaptiveBlocker = new AdaptiveBlocker();
        this.setupSPANavigationListener();
    }

    setupSPANavigationListener() {
        // Method 1: MutationObserver for DOM changes
        this.setupMutationObserver();

        // Method 2: History API interception
        this.interceptHistoryAPI();

        // Method 3: Periodic URL checking
        this.startURLMonitoring();

        // Method 4: Message-based reinitialization
        this.setupMessageHandler();
    }

    setupMutationObserver() {
        // Watch for major DOM changes that indicate navigation
        const observer = new MutationObserver((mutations) => {
            let shouldReinit = false;

            for (const mutation of mutations) {
                // Check if new content was added that might indicate navigation
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && (
                            node.classList?.contains('prose') ||
                            node.querySelector?.('article') ||
                            node.querySelector?.('[role="document"]')
                        )) {
                            shouldReinit = true;
                            break;
                        }
                    }
                }

                if (shouldReinit) break;
            }

            if (shouldReinit) {
                console.log('🔄 ACLB: Detected SPA content change, reinitializing...');
                this.reinitialize();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'id']
        });
    }

    interceptHistoryAPI() {
        // Override pushState and replaceState to detect SPA navigation
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (state, title, url) {
            originalPushState.apply(this, arguments);
            window.dispatchEvent(new Event('spaNavigation'));
        };

        history.replaceState = function (state, title, url) {
            originalReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event('spaNavigation'));
        };

        // Listen for our custom SPA navigation event
        window.addEventListener('spaNavigation', () => {
            setTimeout(() => {
                console.log('🔄 ACLB: History API navigation detected');
                this.reinitialize();
            }, 500);
        });
    }

    startURLMonitoring() {
        // Check for URL changes every second
        setInterval(() => {
            if (window.location.href !== this.currentURL) {
                this.currentURL = window.location.href;
                console.log('🔄 ACLB: URL changed, reinitializing...');
                setTimeout(() => this.reinitialize(), 1000);
            }
        }, 1000);
    }

    setupMessageHandler() {
        // Listen for reinitialization requests from background/popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'reinitializeContentScript') {
                console.log('🔄 ACLB: Received reinitialization request');
                this.reinitialize();
                sendResponse({ status: 'reinitialized' });
            }
            return true;
        });
    }

    reinitialize() {
        console.log('🔄 ACLB: Reinitializing content tracker for SPA navigation');
        this.adaptiveBlocker.updateForNewPage();

        if (this.tracker && typeof this.tracker.reinitialize === 'function') {
            this.tracker.reinitialize();
        } else {
            console.warn('⚠️ ACLB: Tracker reinitialize method not available');
        }
    }

    detectSPA() {
        // Detect if we're on a known SPA
        const spaHostnames = [
            'perplexity.ai', 'github.com', 'gmail.com', 'notion.so',
            'docs.google.com', 'figma.com', 'linear.app', 'slack.com'
        ];

        return spaHostnames.some(hostname =>
            window.location.hostname.includes(hostname)
        );
    }

    startBlocking() {
        this.adaptiveBlocker.start();
    }

    stopBlocking() {
        this.adaptiveBlocker.stop();
    }
}

// ============================ REAL FOCUS SCORING IMPLEMENTATION ============================
class RealFocusAnalyzer {
    constructor() {
        this.pageLoadTime = Date.now();
        this.activityBuffer = [];
        this.scrollDepth = 0;
        this.lastActivity = Date.now();
        this.interactionCount = 0;
        this.focusSessions = [];
        this.currentSessionStart = Date.now();
    }

    calculateRealFocusScore() {
        const engagement = this.calculateEngagement();
        const scrollDepth = this.getScrollDepth();
        const timeFactor = this.getTimeFactor();
        const activityLevel = this.getActivityLevel();
        const sessionQuality = this.getSessionQuality();

        // Real algorithm with weighted factors:
        let score = 50; // Base score

        // Engagement boost (0-20 points) - user interactions
        score += Math.min(20, engagement * 20);

        // Scroll depth boost (0-15 points) - content consumption
        score += Math.min(15, scrollDepth * 15);

        // Activity level (0-15 points) - sustained interaction
        score += Math.min(15, activityLevel * 15);

        // Session quality (0-10 points) - focused time blocks
        score += Math.min(10, sessionQuality * 10);

        // Time factor bonus (0-10 points) - sustained attention
        score += Math.min(10, timeFactor * 10);

        return Math.min(100, Math.max(0, Math.round(score)));
    }

    calculateEngagement() {
        // Based on clicks, typing, interactions in last 30 seconds
        const recentActivities = this.activityBuffer.filter(
            activity => Date.now() - activity.timestamp < 30000
        );

        // Different activities have different weights
        let engagementScore = 0;
        recentActivities.forEach(activity => {
            switch (activity.type) {
                case 'contentClick':
                case 'typing_start':
                    engagementScore += 2; // High engagement
                    break;
                case 'click':
                case 'mouse_move':
                    engagementScore += 1; // Medium engagement
                    break;
                default:
                    engagementScore += 0.5; // Low engagement
            }
        });

        return Math.min(1, engagementScore / 15); // Normalize to 0-1
    }

    getScrollDepth() {
        try {
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

            if (scrollHeight <= clientHeight) return 0.5; // Single page content

            const depth = Math.min(1, scrollTop / (scrollHeight - clientHeight));
            this.scrollDepth = depth;
            return depth;
        } catch {
            return 0;
        }
    }

    getTimeFactor() {
        // Time spent on page in minutes, with diminishing returns after 10 minutes
        const timeSpent = (Date.now() - this.pageLoadTime) / 60000;
        return Math.min(1, timeSpent / 10);
    }

    getActivityLevel() {
        // Based on the frequency of activities in the last 5 minutes
        const recentActivities = this.activityBuffer.filter(
            activity => Date.now() - activity.timestamp < 300000 // 5 minutes
        );

        // Normalize activity level (0-1) based on expected maximum of 30 activities in 5 minutes
        return Math.min(1, recentActivities.length / 30);
    }

    getSessionQuality() {
        // Measure quality of focus sessions (uninterrupted periods of activity)
        const currentSessionDuration = (Date.now() - this.currentSessionStart) / 1000; // seconds

        // Score based on session duration (longer sessions = better focus)
        if (currentSessionDuration > 300) return 1.0; // 5+ minutes excellent
        if (currentSessionDuration > 180) return 0.8; // 3-5 minutes very good
        if (currentSessionDuration > 120) return 0.6; // 2-3 minutes good
        if (currentSessionDuration > 60) return 0.4;  // 1-2 minutes fair
        if (currentSessionDuration > 30) return 0.2;  // 30-60 seconds poor
        return 0.1; // Less than 30 seconds
    }

    recordActivity(activity) {
        this.activityBuffer.push({
            type: activity.type,
            timestamp: Date.now(),
            data: activity.data || {}
        });

        // Keep buffer manageable (last 100 activities)
        if (this.activityBuffer.length > 100) {
            this.activityBuffer = this.activityBuffer.slice(-50);
        }

        // Update session tracking
        this.lastActivity = Date.now();
        this.interactionCount++;
    }

    resetSession() {
        if (this.currentSessionStart > 0) {
            this.focusSessions.push({
                start: this.currentSessionStart,
                end: Date.now(),
                duration: Date.now() - this.currentSessionStart
            });
        }
        this.currentSessionStart = Date.now();
    }
}

// ============================ COGNITIVE ENGINE (FALLBACK ONLY) ============================
let CognitiveEngine;

console.log('🔄 ACLB: Initializing enhanced CognitiveEngine for multi-site support');

class EnhancedCognitiveEngine {
    // 🎯 ENHANCED HEURISTIC SUMMARY WITH BETTER CONTENT PROCESSING
    static heuristicSummary(content, maxSentences = 7) { // Increased from 5 to 7
        if (!content || content.length < 100) {
            return 'Insufficient content for meaningful summary. Please try on a content-rich page like Wikipedia.';
        }

        try {
            console.log('🧠 ACLB: Generating comprehensive summary from:', content.length, 'chars');

            // Clean content more aggressively
            const cleanText = content
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, ' ')
                .replace(/\t/g, ' ')
                .trim();

            // Split into sentences with better detection
            const sentences = cleanText.split(/[.!?]+/)
                .map(s => s.trim())
                .filter(s => s.length > 20 && s.split(/\s+/).length > 4); // Reduced minimums

            if (sentences.length === 0) {
                console.warn('⚠️ ACLB: No meaningful sentences found');
                return this.generateFallbackSummary(content);
            }

            console.log(`📝 ACLB: Found ${sentences.length} meaningful sentences`);

            // ENHANCED SCORING - Less bias toward beginning
            const scoredSentences = sentences.map((sentence, index) => {
                let score = 0;
                const lowerSentence = sentence.toLowerCase();
                const wordCount = sentence.split(/\s+/).length;

                // REDUCED position scoring - give more weight to middle content
                if (index < 2) score += 2;        // Reduced from 3
                else if (index < 5) score += 1.5; // Reduced from 2  
                else if (index < 10) score += 1;  // Same
                else if (index < 20) score += 0.5; // Added middle content bonus

                // Length optimization - favor medium-length sentences
                if (wordCount > 10 && wordCount < 30) score += 2;
                else if (wordCount > 5 && wordCount < 40) score += 1;

                // Content quality indicators - EXPANDED
                const qualityIndicators = [
                    'study', 'research', 'found', 'according', 'report', 'data',
                    'analysis', 'results', 'shows', 'indicates', 'suggests',
                    'important', 'significant', 'key', 'major', 'primary',
                    'conclusion', 'finding', 'evidence', 'demonstrates', 'reveals',
                    'however', 'although', 'therefore', 'consequently', 'additionally'
                ];

                qualityIndicators.forEach(indicator => {
                    if (lowerSentence.includes(indicator)) score += 1;
                });

                // Bonus for sentences that look like main points
                if (sentence.includes(':') || sentence.includes('-')) score += 0.5;

                return { sentence, score, index, wordCount };
            });

            // SELECT MORE DIVERSE SENTENCES
            const selectedSentences = [];
            const usedIndices = new Set();

            // Take top 4 by score (increased from 3)
            scoredSentences
                .sort((a, b) => b.score - a.score)
                .slice(0, 4)
                .forEach(item => {
                    selectedSentences.push(item);
                    usedIndices.add(item.index);
                });

            // Ensure good coverage from different parts
            if (sentences.length > 8) {
                // Add from 25% point
                const quarterIndex = Math.floor(sentences.length * 0.25);
                if (!usedIndices.has(quarterIndex) && quarterIndex < sentences.length) {
                    selectedSentences.push({
                        sentence: sentences[quarterIndex],
                        index: quarterIndex,
                        score: 0.8
                    });
                    usedIndices.add(quarterIndex);
                }

                // Add from 50% point (middle)
                const middleIndex = Math.floor(sentences.length / 2);
                if (!usedIndices.has(middleIndex) && middleIndex < sentences.length) {
                    selectedSentences.push({
                        sentence: sentences[middleIndex],
                        index: middleIndex,
                        score: 0.7
                    });
                    usedIndices.add(middleIndex);
                }

                // Add from 75% point
                const threeQuarterIndex = Math.floor(sentences.length * 0.75);
                if (!usedIndices.has(threeQuarterIndex) && threeQuarterIndex < sentences.length) {
                    selectedSentences.push({
                        sentence: sentences[threeQuarterIndex],
                        index: threeQuarterIndex,
                        score: 0.6
                    });
                    usedIndices.add(threeQuarterIndex);
                }
            }

            // Sort by original order and format
            const finalSentences = selectedSentences
                .sort((a, b) => a.index - b.index)
                .map(item => {
                    let finalSentence = item.sentence.trim();
                    // Ensure proper punctuation
                    if (!finalSentence.endsWith('.') && !finalSentence.endsWith('!') && !finalSentence.endsWith('?')) {
                        finalSentence += '.';
                    }
                    return finalSentence;
                });

            let summary = finalSentences.join(' ');

            // Final cleanup and validation
            summary = summary.replace(/\s+/g, ' ').trim();

            if (!summary.endsWith('.') && !summary.endsWith('!') && !summary.endsWith('?')) {
                summary += '.';
            }

            console.log('✅ ACLB: Comprehensive summary generated:', summary.length, 'chars');
            return summary || this.generateFallbackSummary(content);

        } catch (error) {
            console.warn('⚠️ ACLB: Enhanced summary failed, using fallback:', error);
            return this.generateFallbackSummary(content);
        }
    }

    static generateFallbackSummary(content) {
        if (!content || content.length < 50) {
            return 'No sufficient content available for summary. Please try on a different page with more text content.';
        }

        // Simple first paragraph extraction
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
        if (paragraphs.length > 0) {
            return paragraphs[0].substring(0, 300) + '...';
        }

        // Last resort: first 200 characters
        return content.substring(0, 200) + '...';
    }

    static estimateReadingTime(content, wordsPerMinute = 200) {
        if (!content) return 1;
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    static extractKeywords(content, maxKeywords = 10) {
        if (!content) return [];

        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their'
        ]);

        try {
            const words = content.toLowerCase()
                .split(/\W+/)
                .filter(word =>
                    word.length > 3 &&
                    word.length < 20 &&
                    !stopWords.has(word) &&
                    !/\d/.test(word)
                );

            const frequency = {};
            words.forEach(word => {
                frequency[word] = (frequency[word] || 0) + 1;
            });

            return Object.entries(frequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, maxKeywords)
                .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

        } catch (error) {
            return ['Content', 'Information', 'Reading'];
        }
    }

    static analyzeComplexity(content) {
        if (!content || content.length < 50) return 5;

        try {
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const words = content.split(/\s+/).filter(w => w.length > 0);

            if (sentences.length === 0 || words.length === 0) return 5;

            const avgSentenceLength = words.length / sentences.length;
            const longWords = words.filter(w => w.length > 6).length;
            const longWordRatio = longWords / words.length;

            let score = 5;

            if (avgSentenceLength > 25) score += 2;
            else if (avgSentenceLength > 15) score += 1;
            else if (avgSentenceLength < 8) score -= 1;

            if (longWordRatio > 0.2) score += 2;
            else if (longWordRatio > 0.1) score += 1;

            return Math.min(10, Math.max(1, Math.round(score)));

        } catch (error) {
            return 5;
        }
    }

    static classifyContentType(content) {
        if (!content) return 'general';

        const text = content.toLowerCase();
        const patterns = {
            news: ['breaking', 'news', 'reports', 'announced', 'confirmed', 'official', 'update', 'latest', 'hours ago', 'minutes ago'],
            technical: ['algorithm', 'function', 'variable', 'database', 'server', 'api', 'framework', 'javascript', 'python', 'code', 'software'],
            educational: ['learn', 'study', 'education', 'tutorial', 'guide', 'instruction', 'course', 'lesson', 'knowledge'],
            research: ['study', 'research', 'data', 'analysis', 'results', 'findings', 'experiment', 'methodology'],
            scientific: ['hypothesis', 'theory', 'experiment', 'results', 'conclusion', 'method', 'data', 'study'],
            business: ['business', 'market', 'company', 'profit', 'revenue', 'strategy', 'management', 'economic']
        };

        let maxScore = 0;
        let detectedType = 'general';

        for (const [type, keywords] of Object.entries(patterns)) {
            const score = keywords.filter(keyword => text.includes(keyword)).length;
            if (score > maxScore) {
                maxScore = score;
                detectedType = type;
            }
        }

        return maxScore >= 2 ? detectedType : 'general';
    }

    static assessContentQuality(content) {
        if (!content) return { score: 0, issues: ['No content'] };

        const issues = [];
        let score = 100;

        const wordCount = content.split(/\s+/).length;
        if (wordCount < 100) {
            issues.push('Content too short');
            score -= 30;
        } else if (wordCount > 5000) {
            issues.push('Content very long');
            score -= 10;
        }

        const complexity = this.analyzeComplexity(content);
        if (complexity > 8) {
            issues.push('High complexity');
            score -= 15;
        } else if (complexity < 3) {
            issues.push('Very simple content');
            score -= 10;
        }

        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgLength = wordCount / sentences.length;
        if (avgLength > 30) {
            issues.push('Long sentences');
            score -= 10;
        } else if (avgLength < 8) {
            issues.push('Short sentences');
            score -= 5;
        }

        const keywords = this.extractKeywords(content, 20);
        if (keywords.length < 5) {
            issues.push('Limited keyword diversity');
            score -= 10;
        }

        return {
            score: Math.max(0, score),
            issues,
            wordCount,
            complexity,
            readingTime: this.estimateReadingTime(content)
        };
    }
}

CognitiveEngine = EnhancedCognitiveEngine;
console.log('✅ ACLB: Enhanced CognitiveEngine initialized for multi-site support');

// ============================ WEBSITE PRIORITY CONFIGURATION ============================
const WEBSITE_PRIORITIES = {
    // 🎯 HIGH PRIORITY (High cognitive load, frequent usage)
    HIGH: {
        educational: [
            'coursera.org', 'edx.org', 'khanacademy.org', 'udemy.com',
            'pluralsight.com', 'linkedin.com/learning'
        ],
        technical: [
            'stackoverflow.com', 'github.com', 'gitlab.com',
            'developer.mozilla.org', 'docs.microsoft.com',
            'aws.amazon.com/documentation', 'cloud.google.com/docs'
        ],
        research: [
            'scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov',
            'researchgate.net', 'academia.edu'
        ],
        productivity: [
            'notion.so', 'confluence.atlassian.com', 'atlassian.com',
            'trello.com', 'asana.com', 'slack.com'
        ]
    },

    // 🎯 MEDIUM PRIORITY (Moderate cognitive load)
    MEDIUM: {
        documentation: [
            'stripe.com/docs', 'twilio.com/docs',
            'sendgrid.com/docs', 'stripe.com/docs' // Fixed duplicate
        ],
        professional: [
            'linkedin.com', 'indeed.com', 'glassdoor.com'
        ],
        specialized: [
            'figma.com', 'adobe.com', 'sketch.com'
        ]
    }
};

// Helper function to check if current site matches any priority list
function getWebsitePriority(hostname) {
    // Check high priority sites
    for (const [category, sites] of Object.entries(WEBSITE_PRIORITIES.HIGH)) {
        if (sites.some(site => hostname.includes(site.replace('/learning', '')))) {
            return { priority: 'HIGH', category };
        }
    }

    // Check medium priority sites
    for (const [category, sites] of Object.entries(WEBSITE_PRIORITIES.MEDIUM)) {
        if (sites.some(site => hostname.includes(site))) {
            return { priority: 'MEDIUM', category };
        }
    }

    return { priority: 'LOW', category: 'general' };
}

// ============================ COMPLETE CONTENT EXTRACTION ============================
class WebsiteSpecificExtractor {
    // 🎯 ENHANCED CONTENT EXTRACTION FOR DYNAMIC SITES
    static extractComprehensiveContent() {
        let fullContent = '';

        console.log('🔄 ACLB: Using comprehensive content extraction for dynamic sites');

        // 1. Article/Content specific selectors
        const articleSelectors = [
            'article', '[role="article"]', '.content', '.post-content',
            '.article-body', '.story-content', '.main-content',
            '[data-testid="article-content"]', '.prose', '.text-content'
        ];

        for (const selector of articleSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isMeaningfulContent(el.textContent)) {
                    fullContent += ' ' + el.textContent;
                }
            });
        }

        // 2. Text density analysis for dynamic sites
        if (!fullContent.trim()) {
            fullContent = this.textDensityAnalysis();
        }

        // 3. Body text extraction with filtering
        if (!fullContent.trim()) {
            const bodyText = document.body.innerText;
            fullContent = this.filterMeaningfulText(bodyText);
        }

        return fullContent.trim();
    }

    static filterMeaningfulText(text) {
        // Remove navigation, headers, footers, ads
        const lines = text.split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 50 && // Minimum length
                    !trimmed.match(/^(menu|home|about|contact|login|sign)/i) && // No navigation
                    !trimmed.match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/) && // No dates
                    trimmed.split(' ').length > 8; // Minimum word count
            });

        return lines.join('\n');
    }

    static textDensityAnalysis() {
        // Find elements with highest text density (likely main content)
        const contentCandidates = [];
        const elements = document.querySelectorAll('p, div, article, section');

        elements.forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 100) {
                // Calculate text density (text length vs HTML complexity)
                const htmlLength = el.innerHTML.length;
                const textDensity = text.length / Math.max(1, htmlLength);

                if (textDensity > 0.3) { // Good text density threshold
                    contentCandidates.push({
                        element: el,
                        text: text,
                        density: textDensity,
                        length: text.length
                    });
                }
            }
        });

        // Sort by density and length, take top 3
        contentCandidates.sort((a, b) => {
            if (b.density !== a.density) return b.density - a.density;
            return b.length - a.length;
        });

        return contentCandidates.slice(0, 3).map(c => c.text).join(' ');
    }

    static isMeaningfulContent(text) {
        return text && text.length > 50 && text.split(' ').length > 10;
    }

    // 🎯 BBC NEWS EXTRACTION
    static extractBBCContent() {
        try {
            console.log('📰 ACLB: Using BBC-specific extraction');

            // Strategy 1: Main article content
            const articleSelectors = [
                '[data-component="text-block"]',
                '.ssrcss-1q0x1qg-Paragraph',
                '.article__body-content',
                '.story-body__inner',
                '[role="main"] p',
                '.gs-c-promo-body',
                '.lx-stream-post-body'
            ];

            for (const selector of articleSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text.length > 50 &&
                            !text.includes('BBC is not responsible') &&
                            !text.includes('©') &&
                            !text.includes('Share') &&
                            !text.includes('Image source')) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: BBC content found with ${selector}:`, content.length);
                        return content;
                    }
                }
            }

            // Strategy 2: Generic article detection
            const article = document.querySelector('article');
            if (article) {
                const content = this.extractTextFromElement(article);
                if (content.length > 200) {
                    console.log('✅ ACLB: BBC article content found:', content.length);
                    return content;
                }
            }

            // Strategy 3: Headline and summary
            const headline = document.querySelector('h1')?.textContent || '';
            const summary = document.querySelector('[data-component="summary"]')?.textContent || '';
            if (headline && summary) {
                const combined = `${headline}. ${summary}`;
                if (combined.length > 100) {
                    console.log('✅ ACLB: Using BBC headline + summary');
                    return combined;
                }
            }

        } catch (error) {
            console.warn('⚠️ ACLB: BBC extraction failed:', error);
        }
        return null;
    }

    // 🎯 CNN EXTRACTION
    static extractCNNContent() {
        try {
            console.log('📺 ACLB: Using CNN-specific extraction');

            const selectors = [
                '.article__content',
                '.zn-body__paragraph',
                '.l-container .paragraph',
                '[data-editable="content"] p',
                '.paragraph',
                '.body-text'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text.length > 30 && !text.includes('Advertisement')) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: CNN content found with ${selector}:`, content.length);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: CNN extraction failed:', error);
        }
        return null;
    }

    // 🎯 NEW YORK TIMES EXTRACTION
    static extractNYTimesContent() {
        try {
            console.log('🗞️ ACLB: Using NYTimes-specific extraction');

            const selectors = [
                '.story-body',
                '[data-testid="article-body"]',
                '.css-1ygdjhk',
                '.StoryBodyCompanionColumn p',
                '.css-1i8edl6',
                '[name="articleBody"]'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text.length > 30 &&
                            !text.includes('Advertisement') &&
                            !text.includes('Sign up')) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: NYTimes content found with ${selector}:`, content.length);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: NYTimes extraction failed:', error);
        }
        return null;
    }

    // 🎯 MEDIUM/BLOG EXTRACTION
    static extractMediumContent() {
        try {
            console.log('📝 ACLB: Using Medium-specific extraction');

            const selectors = [
                'article .pw-post-body',
                '.postArticle-content',
                '.section-content',
                '.graf--p',
                '.paragraph',
                '[data-field="body"]'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text.length > 50 && !text.includes('Sign up for')) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: Medium content found with ${selector}:`, content.length);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Medium extraction failed:', error);
        }
        return null;
    }

    // 🎯 GENERIC NEWS SITE EXTRACTION
    static extractGenericNewsContent() {
        try {
            console.log('📰 ACLB: Using generic news extraction');

            const selectors = [
                'article .article-content',
                '.story-content',
                '.post-content',
                '.entry-content',
                '.content-inner p',
                '.article-text',
                '.news-content',
                '.story-body',
                '.article-body',
                '.post-body'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text.length > 30 &&
                            !text.includes('ADVERTISEMENT') &&
                            !text.includes('Sign up') &&
                            !text.includes('Subscribe')) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: Generic news content found with ${selector}:`, content.length);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Generic news extraction failed:', error);
        }
        return null;
    }

    // 🎯 EDUCATIONAL PLATFORMS
    static extractEducationalContent() {
        try {
            console.log('🎓 ACLB: Using educational platform extraction');

            const selectors = [
                // Coursera, edX
                '.course-content', '.week-body', '.module-body',
                '.lecture-content', '.rc-WeekBody',
                // Khan Academy
                '.perseus-renderer', '.exercise-content',
                // General educational
                '.lesson-content', '.tutorial-content', '.learning-content',
                '[data-purpose="course-content"]'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = this.extractTextFromElement(el);
                        if (text.length > 100) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: Educational content found with ${selector}`);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Educational extraction failed:', error);
        }
        return null;
    }

    // 🎯 TECHNICAL DOCUMENTATION
    static extractTechnicalDocsContent() {
        try {
            console.log('💻 ACLB: Using technical documentation extraction');

            const selectors = [
                // MDN, developer docs
                '#content article', '.main-page-content', '.documentation-content',
                '.api-content', '.docs-content', '.devsite-article',
                // Stack Overflow
                '.question .post-text', '.answer .post-text', '.js-post-body',
                // GitHub
                '.markdown-body', '.repository-content', '.readme',
                // General technical
                'article .content', '.documentation', '.api-docs'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = this.extractTextFromElement(el);
                        if (text.length > 50) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: Technical docs found with ${selector}`);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Technical docs extraction failed:', error);
        }
        return null;
    }

    // 🎯 RESEARCH PAPERS & ACADEMIC CONTENT
    static extractResearchContent() {
        try {
            console.log('🔬 ACLB: Using research content extraction');

            const selectors = [
                // arXiv, academic papers
                '.ltx_page_content', '.abstract', '.article-content',
                '.research-content', '.paper-content', '.thesis-content',
                // PubMed
                '.abstract-content', '.article-abstract', '.full-view',
                // General academic
                '.citation', '.publication-content', '.scholarly-article'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = this.extractTextFromElement(el);
                        // Research content can be shorter but dense
                        if (text.length > 30) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 150) {
                        console.log(`✅ ACLB: Research content found with ${selector}`);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Research extraction failed:', error);
        }
        return null;
    }

    // 🎯 PRODUCTIVITY & BUSINESS PLATFORMS
    static extractProductivityContent() {
        try {
            console.log('📊 ACLB: Using productivity platform extraction');

            const selectors = [
                // Notion, Confluence
                '.notion-page-content', '.page-content', '.wiki-content',
                '.document-content', '.sheet-content', '.board-content',
                // Project management
                '.task-content', '.issue-content', '.ticket-content',
                // Business intelligence
                '.dashboard-content', '.report-content', '.analytics-content'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    let content = '';
                    elements.forEach(el => {
                        const text = this.extractTextFromElement(el);
                        if (text.length > 50) {
                            content += text + ' ';
                        }
                    });

                    if (content.length > 200) {
                        console.log(`✅ ACLB: Productivity content found with ${selector}`);
                        return content;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Productivity extraction failed:', error);
        }
        return null;
    }

    // 🎯 HELPER: Extract text from element while removing unwanted content
    static extractTextFromElement(element) {
        if (!element) return '';

        // Clone to avoid modifying original
        const clone = element.cloneNode(true);

        // Remove unwanted elements
        const unwantedSelectors = [
            'nav', 'header', 'footer', 'aside', '.ad', '.ads', '.sidebar',
            '.menu', '.comments', '.social-share', '.navigation', '.navbar',
            '.advertisement', '.banner', 'script', 'style', 'meta', 'link',
            '.related-articles', '.recommendations', '.newsletter-signup',
            '.share-buttons', '.author-info', '.published-date'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        return clone.textContent.replace(/\s+/g, ' ').trim();
    }
}

// ============================ GLOBAL PORT (BFCache-safe) ============================
let aclbPort = null;
let aclbPortReady = false;

function getOrCreatePort() {
    try {
        if (!chrome?.runtime?.id) return null;
        if (aclbPort) {
            try { aclbPort.disconnect(); } catch { }
            aclbPort = null;
        }
        const port = chrome.runtime.connect({ name: 'content-script-persistent' });
        port.onDisconnect.addListener(() => { aclbPortReady = false; });
        aclbPort = port;
        aclbPortReady = true;
        return port;
    } catch {
        aclbPortReady = false;
        return null;
    }
}

async function trySend(message, timeout = 2000) {
    if (aclbPort && aclbPortReady) {
        try { aclbPort.postMessage(message); return true; } catch { aclbPortReady = false; }
    }
    const resp = await sendRuntimeMessageAsync(message, timeout);
    return resp !== null;
}

window.addEventListener('pageshow', (evt) => {
    if (evt.persisted) {
        getOrCreatePort();
        trySend({ type: 'contentScriptReady', bfcacheResistant: true, timestamp: Date.now(), url: location.href });
    }
});

// ============================ RUNTIME & PAGE HELPERS ============================
function sendRuntimeMessageAsync(message, timeout = 3000) {
    return new Promise((resolve) => {
        if (!chrome?.runtime?.id) return resolve(null);
        let done = false;
        const t = setTimeout(() => { if (!done) { done = true; resolve(null); } }, timeout);
        try {
            chrome.runtime.sendMessage(message, (resp) => {
                if (done) return;
                done = true;
                clearTimeout(t);
                if (chrome.runtime.lastError) resolve(null);
                else resolve(resp ?? null);
            });
        } catch { clearTimeout(t); resolve(null); }
    });
}

function isRestrictedPage() {
    try {
        const href = window.location.href || '';
        const protocol = window.location.protocol || '';
        if (!document || !document.body) return true;
        if (
            protocol === 'chrome:' ||
            protocol === 'chrome-extension:' ||
            href.startsWith('about:') ||
            href.startsWith('file:') ||
            href.startsWith('edge:') ||
            href.startsWith('opera:') ||
            href.startsWith('brave:')
        ) return true;
        return false;
    } catch { return true; }
}

function domReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') return Promise.resolve();
    return new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
}

async function validateExtensionContextStrict(pingTimeout = 1500) {
    try {
        if (!chrome?.runtime?.id) return false;
        const resp = await sendRuntimeMessageAsync({ type: 'ping', test: true }, pingTimeout);
        return resp !== null;
    } catch { return false; }
}

// ============================ ENHANCED MESSAGE HANDLING ============================
function setupEnhancedMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 ACLB: Received message:', request.type);

        switch (request.type) {
            case 'getStatus':
                sendResponse({
                    success: true,
                    connected: window.aclbTracker?.isConnected || false,
                    contentExtracted: true,
                    contentLength: window.aclbTracker?.getPageContent?.()?.length || 0,
                    url: window.location.href,
                    timestamp: Date.now(),
                    extractionMethod: window.aclbTracker?.contentAnalysis?.extractionMethod || 'unknown',
                    sitePriority: window.aclbTracker?.contentAnalysis?.sitePriority || 'unknown',
                    siteCategory: window.aclbTracker?.contentAnalysis?.siteCategory || 'unknown',
                    focusScore: window.aclbTracker?.realFocusAnalyzer?.calculateRealFocusScore() || 50,
                    blockingActive: window.aclbTracker?.spaDetector?.adaptiveBlocker?.isBlocking || false
                });
                return true;

            case 'requestSummary':
                if (window.aclbTracker) {
                    window.aclbTracker.generateIntelligentSummary()
                        .then(summary => {
                            sendResponse({
                                success: true,
                                summary: summary,
                                extractionMethod: window.aclbTracker.contentAnalysis.extractionMethod,
                                aiGenerated: window.aclbTracker.contentAnalysis.aiGenerated
                            });
                        })
                        .catch(error => {
                            console.warn('⚠️ ACLB: AI summary failed, using fallback:', error);
                            sendResponse({
                                success: true,
                                summary: window.aclbTracker.generateFallbackSummary(),
                                extractionMethod: 'fallback',
                                aiGenerated: false
                            });
                        });
                } else {
                    sendResponse({
                        success: false,
                        error: 'Tracker not initialized',
                        summary: 'Content analyzer not ready. Please refresh the page.'
                    });
                }
                return true; // Keep channel open for async

            case 'toggleFocusMode':
                if (window.aclbTracker) {
                    window.aclbTracker.handleFocusModeChange(request.isActive);
                    sendResponse({ success: true, active: request.isActive });
                } else {
                    sendResponse({ success: false, error: 'Tracker not initialized' });
                }
                return true;

            case 'getPageContent':
                if (window.aclbTracker) {
                    const content = window.aclbTracker.getPageContent();
                    sendResponse({
                        success: true,
                        content: content,
                        title: document.title,
                        url: window.location.href,
                        wordCount: content ? content.trim().split(/\s+/).filter(Boolean).length : 0,
                        extractionMethod: window.aclbTracker.contentAnalysis.extractionMethod,
                        focusScore: window.aclbTracker.realFocusAnalyzer.calculateRealFocusScore()
                    });
                } else {
                    sendResponse({
                        success: false,
                        content: '',
                        title: document.title,
                        url: window.location.href,
                        error: 'Tracker not initialized'
                    });
                }
                return true;

            case 'ping':
                sendResponse({
                    success: true,
                    pong: true,
                    timestamp: Date.now(),
                    contentScriptReady: true,
                    connectionEstablished: window.aclbTracker?.connectionEstablished || false,
                    multiSiteSupported: true,
                    focusAnalyzerActive: !!window.aclbTracker?.realFocusAnalyzer,
                    blockingActive: window.aclbTracker?.spaDetector?.adaptiveBlocker?.isBlocking || false
                });
                return true;

            case 'getFocusScore':
                if (window.aclbTracker?.realFocusAnalyzer) {
                    const score = window.aclbTracker.realFocusAnalyzer.calculateRealFocusScore();
                    sendResponse({
                        success: true,
                        score: score,
                        engagement: window.aclbTracker.realFocusAnalyzer.calculateEngagement(),
                        scrollDepth: window.aclbTracker.realFocusAnalyzer.getScrollDepth(),
                        sessionQuality: window.aclbTracker.realFocusAnalyzer.getSessionQuality()
                    });
                } else {
                    sendResponse({
                        success: false,
                        error: 'Focus analyzer not available',
                        score: 50
                    });
                }
                return true;

            case 'toggleBlocking':
                if (window.aclbTracker?.spaDetector?.adaptiveBlocker) {
                    if (request.enabled) {
                        window.aclbTracker.spaDetector.adaptiveBlocker.start();
                    } else {
                        window.aclbTracker.spaDetector.adaptiveBlocker.stop();
                    }
                    sendResponse({
                        success: true,
                        enabled: window.aclbTracker.spaDetector.adaptiveBlocker.isBlocking
                    });
                } else {
                    sendResponse({ success: false, error: 'Blocking system not available' });
                }
                return true;

            // ===== ELEMENT PICKER MESSAGES =====
            case 'startElementPicker':
                const result = elementPicker.start();
                sendResponse(result);
                break;

            case 'stopElementPicker':
                elementPicker.stop();
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ error: 'Unknown message type' });
                return false;
        }
    });
}

// Enhanced context validation with retry
async function validateExtensionContextWithRetry() {
    try {
        if (!chrome?.runtime?.id) return false;

        // First attempt
        let response = await sendRuntimeMessageAsync({ type: 'ping' }, 1500);
        if (response !== null) return true;

        // Retry once after delay
        await new Promise(resolve => setTimeout(resolve, 400));
        response = await sendRuntimeMessageAsync({ type: 'ping' }, 1500);

        return response !== null;
    } catch (error) {
        console.warn('⚠️ ACLB: Context validation failed:', error);
        return false;
    }
}

// ============================ CHROME AI WRAPPER (Enhanced) ============================
class ChromeAIContentService {
    constructor() {
        this.isAIAvailable = false;
        this.supportedAPIs = new Set();
        this.checkAIAvailability();
    }

    async checkAIAvailability() {
        try {
            const ai = window.ai;
            this.isAIAvailable = !!(ai && (ai.summarizer || ai.prompt || ai.writer || ai.proofreader));
            this.supportedAPIs.clear();

            if (ai?.summarizer) this.supportedAPIs.add('summarizer');
            if (ai?.prompt) this.supportedAPIs.add('prompt');
            if (ai?.writer) this.supportedAPIs.add('writer');
            if (ai?.proofreader) this.supportedAPIs.add('proofreader');

            console.log('🔍 ACLB: Chrome AI Availability:', {
                available: this.isAIAvailable,
                apis: Array.from(this.supportedAPIs)
            });

            return this.isAIAvailable;
        } catch {
            this.isAIAvailable = false;
            this.supportedAPIs.clear();
            return false;
        }
    }

    async summarizeContent(content, options = {}) {
        // 🎯 PRIMARY: Try Chrome Built-in AI Summarizer API
        try {
            if (window.ai?.summarizer) {
                console.log('🚀 ACLB: Using Chrome AI Summarizer API');
                const result = await window.ai.summarizer.summarize({
                    text: content,
                    maxOutputTokens: options.maxLength || 500
                });

                if (result && typeof result === 'string' && result.length > 50) {
                    console.log('✅ ACLB: Chrome AI summary successful:', result.length, 'chars');
                    return result;
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Chrome AI summarizer failed:', error);
        }

        // 🎯 SECONDARY: Try Chrome Prompt API for structured summary
        try {
            if (window.ai?.prompt) {
                console.log('🔄 ACLB: Trying Chrome Prompt API for summary');
                const prompt = `Please provide a concise 2-3 sentence summary of the following text:\n\n${content.substring(0, 4000)}`;

                const result = await window.ai.prompt.execute(prompt, {
                    format: 'text',
                    maxOutputTokens: 300
                });

                if (result && result.length > 50) {
                    console.log('✅ ACLB: Chrome Prompt API summary successful');
                    return result;
                }
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Chrome Prompt API failed:', error);
        }

        return null;
    }

    async analyzeContentWithAI(content) {
        if (!this.supportedAPIs.has('prompt')) return null;
        try {
            const prompt = `Analyze this text for content characteristics and cognitive load factors.
Text: "${(content || '').substring(0, 3000)}"

Return a JSON object with:
- complexity: number 1-10
- contentType: string
- estimatedReadTime: number (minutes)
- keyThemes: array of strings
- focusRequired: number 1-10`;

            const analysis = await window.ai.prompt.execute(prompt, {
                format: 'json',
                schema: {
                    type: 'object',
                    properties: {
                        complexity: { type: 'number', minimum: 1, maximum: 10 },
                        contentType: { type: 'string' },
                        estimatedReadTime: { type: 'number', minimum: 1 },
                        keyThemes: { type: 'array', items: { type: 'string' } },
                        focusRequired: { type: 'number', minimum: 1, maximum: 10 },
                    },
                    required: ['complexity', 'contentType', 'estimatedReadTime', 'keyThemes', 'focusRequired'],
                },
            });
            return analysis || null;
        } catch {
            return null;
        }
    }

    getAPIStatus() {
        return {
            available: this.isAIAvailable,
            supportedAPIs: Array.from(this.supportedAPIs),
            timestamp: Date.now()
        };
    }
}

// ============================ ENHANCED TRACKER WITH REAL FOCUS SCORING ============================
class IntelligentActivityTracker {
    constructor() {
        // State
        this.isInitialized = false;
        this.isConnected = false;
        this.extensionContextValid = false;
        this.serviceWorkerActive = false;
        this.readySignalSent = false;
        this.connectionEstablished = false;

        this.port = null;
        this.heartbeatInterval = null;
        this.reconnectionInterval = null;
        this.connectionAttempts = 0;

        this.useFallback = false;
        this.activityBuffer = [];
        this.localQueue = [];
        this.pageLoadTime = Date.now();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // 🎯 REAL FOCUS SCORING
        this.realFocusAnalyzer = new RealFocusAnalyzer();

        // 🎯 SPA NAVIGATION DETECTION & ADAPTIVE BLOCKING
        this.spaDetector = new ACLBContent(this);

        // 🎯 FOCUS MODE STATE
        this.isFocusModeEnabled = false;
        this.focusModeState = {
            enabled: false,
            layoutPreserved: false,
            distractionsBlocked: false
        };

        this.extractionStats = {
            totalExtractions: 0,
            successfulExtractions: 0,
            failedExtractions: 0,
            lastExtractionMethod: 'unknown'
        };

        this.userPreferences = { preferredContentTypes: [], readingSpeed: 'medium', focusAreas: [] };
        this.contentAnalysis = {
            lastSummary: null,
            pageKeywords: [],
            readingTime: 0,
            contentComplexity: 0,
            contentType: 'general',
            aiGenerated: false,
            focusRequired: 5,
            extractionMethod: 'unknown',
            sitePriority: 'unknown',
            siteCategory: 'unknown'
        };

        // Stubs to avoid missing-method binder warnings
        this.handleRuntimeError = (e, msg) => void 0;
        this.queueMessage = (m) => { (this._queuedMsgs ||= []).push(m); };
        this.flushQueuedMessages = () => {
            const q = this._queuedMsgs || [];
            this._queuedMsgs = [];
            q.forEach((m) => this.safeSendMessage?.(m));
        };
        this.sendActivity = (a) => this.sendToBackground({ type: 'activity_update', activity: a });

        this.aiService = new ChromeAIContentService();

        // Initialize with persistent connection system
        this.bootstrap().catch(() => this.enterFallback());
    }

    // ===== ENHANCED FOCUS MODE WITH COMPREHENSIVE BLOCKING =====
    handleFocusModeChange(isActive) {
        if (isActive) {
            this.enableTrueFocusMode();
        } else {
            this.disableFocusMode();
        }
        this.isFocusModeEnabled = isActive;

        // Sync state with background
        this.syncFocusModeState();
    }

    // Enhanced focus mode with comprehensive blocking
    enableTrueFocusMode() {
        console.log('🔄 ACLB: Enabling comprehensive focus mode...');

        try {
            // 1. PRESERVE LAYOUT FIRST
            this.preserveLayout();

            // 2. Apply visual effects
            document.documentElement.style.filter = 'grayscale(0.4) brightness(0.85)';
            document.body.style.backgroundColor = '#f8fcff';

            // 3. START ADAPTIVE BLOCKING (NEW CENTRALIZED SYSTEM)
            if (this.spaDetector && this.spaDetector.adaptiveBlocker) {
                this.spaDetector.adaptiveBlocker.start();
            }

            // 4. COMPREHENSIVE DISTRACTION BLOCKING (LEGACY - for backward compatibility)
            this.blockDistractionsSafely();
            this.blockAllNotifications();

            // 5. Set focus mode state
            this.isFocusModeEnabled = true;

            console.log('✅ ACLB: Focus mode enabled with comprehensive blocking');
        } catch (error) {
            console.error('❌ Error in enableTrueFocusMode:', error);
        }
    }

    // ADD TO content.js - Comprehensive notification blocking
    blockAllNotifications() {
        console.log('🔕 ACLB: Blocking all notifications...');
        const notificationSelectors = [
            // YouTube
            'ytd-notification-renderer',
            '#notification',
            '.ytd-notification',
            '[aria-label*="notification"]',

            // Instagram
            '[aria-label="Notifications"]',
            '._a9_1', // Instagram notification badges
            '._a9_0', // Instagram notification panels

            // Facebook
            '[aria-label="Notifications"]',
            '[data-pagelet="WWPhotoFeed"] [role="dialog"]', // FB notification popup
            'div[role="menu"] [role="dialog"]', // FB menus with notifications

            // LinkedIn
            '.scaffold-layout__aside [role="dialog"]', // LinkedIn notification sidebar
            '.msg-overlay-list-bubble', // LinkedIn messaging notifications
            '.notifications-card', // LinkedIn notification cards

            // Twitter/X
            '[data-testid="notification"]',
            '[aria-label*="Notification"]',
            '[role="dialog"] [aria-label*="notification"]',

            // Generic/News Sites
            '.notification',
            '.alert',
            '.toast',
            '.snackbar',
            '.notice',
            '.banner',
            '[role="alert"]',
            '[aria-live="polite"]',
            '[aria-live="assertive"]',

            // Browser push notification styles
            '.web-notification',
            '.push-notification',
            '.notification-center',

            // Chat/Message notifications
            '.message-indicator',
            '.unread-badge',
            '.notification-badge',
            '[class*="unread"]',
            '[class*="badge"]:not(.button)'
        ];

        notificationSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Store original state before hiding
                el.dataset.aclbOriginalDisplay = el.style.display;
                el.dataset.aclbOriginalVisibility = el.style.visibility;

                // Hide completely
                el.style.display = 'none !important';
                el.style.visibility = 'hidden !important';
                el.style.opacity = '0 !important';
            });
        });

        // Also run quick blocking as backup
        this.blockAllNotificationsQuick();
    }

    // Quick comprehensive notification blocking
    blockAllNotificationsQuick() {
        console.log('⚡ ACLB: Quick blocking all notifications...');
        // Hide ALL elements that might be notifications
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            const styles = window.getComputedStyle(el);

            // Check if element looks like a notification
            const isNotification =
                text.includes('notification') ||
                text.includes('alert') ||
                text.includes('unread') ||
                styles.position === 'fixed' &&
                (styles.top === '0px' || styles.bottom === '0px') ||
                el.getAttribute('role') === 'alert' ||
                el.getAttribute('aria-live') === 'polite' ||
                el.getAttribute('aria-live') === 'assertive';

            if (isNotification) {
                el.style.display = 'none';
            }
        });
    }

    disableFocusMode() {
        console.log('🔚 ACLB: Disabling focus mode...');

        // Remove all effects
        document.documentElement.style.filter = '';
        document.body.style.backgroundColor = '';

        // STOP ADAPTIVE BLOCKING
        if (this.spaDetector && this.spaDetector.adaptiveBlocker) {
            this.spaDetector.adaptiveBlocker.stop();
        }

        // Restore hidden elements
        this.restoreLayout();

        this.isFocusModeEnabled = false;
        console.log('✅ ACLB: Focus Mode DISABLED');
    }

    // Test if focus mode works manually
    static testFocusMode() {
        console.log('🧪 Manual focus mode test');
        if (window.aclbTracker) {
            window.aclbTracker.enableTrueFocusMode();
        } else {
            console.error('❌ ACLB Tracker not available');
        }
    }

    preserveLayout() {
        console.log('🔄 ACLB: Preserving layout to prevent shifts');

        // Prevent layout shifts by maintaining element dimensions
        const elementsToHide = document.querySelectorAll([
            '[data-testid="sidebarColumn"]',
            '#secondary',
            '[role="complementary"]',
            '.sidebar',
            '.right-column'
        ].join(','));

        elementsToHide.forEach(el => {
            if (!el) return;

            // Store original dimensions and styles before hiding
            const rect = el.getBoundingClientRect();
            el.dataset.aclbOriginalWidth = el.style.width || `${rect.width}px`;
            el.dataset.aclbOriginalHeight = el.style.height || `${rect.height}px`;
            el.dataset.aclbOriginalDisplay = el.style.display || '';
            el.dataset.aclbOriginalVisibility = el.style.visibility || '';
            el.dataset.aclbOriginalOpacity = el.style.opacity || '';
            el.dataset.aclbOriginalPosition = el.style.position || '';

            // Hide but maintain space - use visibility and opacity instead of display
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.position = 'absolute'; // Remove from flow but maintain dimensions
            el.style.pointerEvents = 'none'; // Prevent interactions

            console.log(`📐 ACLB: Preserved layout for ${el.tagName} with dimensions ${rect.width}x${rect.height}`);
        });
    }

    blockDistractionsSafely() {
        console.log('🔄 ACLB: Blocking distractions safely');

        // Only hide elements that won't cause layout shifts
        const safeToHide = [
            '[data-testid="primaryColumn"] [aria-label="Timeline"]', // Twitter feed
            '[role="feed"]', // Facebook feed
            '.scaffold-finite-scroll', // LinkedIn feed
            '.newsfeed', // Generic feeds
            '[class*="notification"]', // Notifications
            '[class*="popup"]', // Popups
            '[class*="modal"]' // Modals
        ];

        safeToHide.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el) return;
                el.style.display = 'none';
                el.dataset.aclbOriginalDisplay = el.style.display;
                console.log(`🚫 ACLB: Safely hidden ${el.tagName}`);
            });
        });
    }

    restoreLayout() {
        console.log('🔄 ACLB: Restoring original layout');

        // Restore elements that were hidden with layout preservation
        const preservedElements = document.querySelectorAll([
            '[data-testid="sidebarColumn"]',
            '#secondary',
            '[role="complementary"]',
            '.sidebar',
            '.right-column'
        ].join(','));

        preservedElements.forEach(el => {
            if (!el || !el.dataset.aclbOriginalWidth) return;

            // Restore original styles
            el.style.width = el.dataset.aclbOriginalWidth;
            el.style.height = el.dataset.aclbOriginalHeight;
            el.style.display = el.dataset.aclbOriginalDisplay;
            el.style.visibility = el.dataset.aclbOriginalVisibility;
            el.style.opacity = el.dataset.aclbOriginalOpacity;
            el.style.position = el.dataset.aclbOriginalPosition;
            el.style.pointerEvents = '';

            // Clean up data attributes
            delete el.dataset.aclbOriginalWidth;
            delete el.dataset.aclbOriginalHeight;
            delete el.dataset.aclbOriginalDisplay;
            delete el.dataset.aclbOriginalVisibility;
            delete el.dataset.aclbOriginalOpacity;
            delete el.dataset.aclbOriginalPosition;

            console.log(`📐 ACLB: Restored layout for ${el.tagName}`);
        });
    }

    // ===== BACKGROUND STATE SYNCHRONIZATION =====
    async syncFocusModeState() {
        try {
            await sendRuntimeMessageAsync({
                action: 'focusModeStateUpdate',
                enabled: this.isFocusModeEnabled,
                tabId: await this.getCurrentTabId(),
                url: window.location.href,
                timestamp: Date.now()
            });
            console.log('🔄 ACLB: Focus mode state synced with background');
        } catch (error) {
            console.warn('⚠️ ACLB: Failed to sync focus mode state:', error);
        }
    }

    async getCurrentTabId() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getCurrentTabId' }, (response) => {
                resolve(response?.tabId || null);
            });
        });
    }

    hasContent() {
        return this.getPageContent().length > 0;
    }

    // ===== ENHANCED CONTENT EXTRACTION - GET COMPLETE PAGE CONTENT =====
    getPageContent() {
        console.log('🔍 ACLB: Starting COMPREHENSIVE multi-site content extraction...');
        this.extractionStats.totalExtractions++;

        try {
            const hostname = window.location.hostname;
            let content = '';
            let extractionMethod = 'unknown';

            console.log('🌐 ACLB: Extracting from hostname:', hostname);

            // 🎯 COMPREHENSIVE CONTENT GATHERING - MULTI-STRATEGY APPROACH
            const extractionStrategies = [
                // Strategy 1: Website-specific extraction
                () => this.extractWebsiteSpecificContent(hostname),
                // Strategy 2: Main article content
                () => this.extractMainArticleContent(),
                // Strategy 3: Comprehensive text density analysis
                () => this.extractByTextDensity(),
                // Strategy 4: Body text with intelligent filtering
                () => this.extractIntelligentBodyContent(),
                // Strategy 5: Fallback - all meaningful text
                () => this.extractAllMeaningfulText()
            ];

            // Try each strategy until we get substantial content
            for (const strategy of extractionStrategies) {
                if (content && content.length > 500) break; // Stop if we have enough content

                const result = strategy();
                if (result && result.length > content.length) {
                    content = result;
                    console.log(`✅ ACLB: Strategy added ${result.length} chars`);
                }
            }

            // 🎯 FINAL CLEANING AND VALIDATION
            if (content && content.length > 200) {
                const cleanedContent = this.cleanContent(content);
                this.extractionStats.successfulExtractions++;
                this.extractionStats.lastExtractionMethod = extractionMethod;
                this.contentAnalysis.extractionMethod = extractionMethod;

                console.log(`✅ ACLB: COMPREHENSIVE extraction successful:`, {
                    original: content.length,
                    cleaned: cleanedContent.length,
                    hostname: hostname,
                    strategiesUsed: extractionStrategies.length
                });

                return cleanedContent;
            } else {
                this.extractionStats.failedExtractions++;
                console.warn('❌ ACLB: All extraction methods failed for:', hostname);
                return this.generateHelpfulFallbackContent();
            }

        } catch (error) {
            this.extractionStats.failedExtractions++;
            console.error('❌ ACLB: Content extraction failed:', error);
            return this.generateHelpfulFallbackContent();
        }
    }

    // 🎯 NEW: WEBSITE-SPECIFIC CONTENT EXTRACTION
    extractWebsiteSpecificContent(hostname) {
        let content = '';

        // Wikipedia-specific extraction (IMPROVED)
        if (hostname.includes('wikipedia.org')) {
            content = this.extractWikipediaContent();
            if (content.length > 500) return content;
        }

        // News sites
        if (hostname.includes('bbc.com') || hostname.includes('bbc.co.uk')) {
            content = WebsiteSpecificExtractor.extractBBCContent();
        } else if (hostname.includes('cnn.com')) {
            content = WebsiteSpecificExtractor.extractCNNContent();
        } else if (hostname.includes('nytimes.com')) {
            content = WebsiteSpecificExtractor.extractNYTimesContent();
        }
        // Add more site-specific extractors as needed...

        return content || '';
    }

    // 🎯 IMPROVED WIKIPEDIA EXTRACTION - GET ALL SECTIONS
    extractWikipediaContent() {
        try {
            console.log('📚 ACLB: Using COMPREHENSIVE Wikipedia extraction');

            let fullContent = '';

            // Method 1: Main content area with ALL paragraphs
            const contentElement = document.getElementById('mw-content-text');
            if (contentElement) {
                // Get ALL paragraphs, not just the first few
                const paragraphs = contentElement.querySelectorAll('p');
                console.log(`📝 ACLB: Found ${paragraphs.length} paragraphs in Wikipedia`);

                paragraphs.forEach((p, index) => {
                    const text = p.textContent.trim();
                    // Include ALL meaningful paragraphs (not just first few)
                    if (text.length > 30 &&
                        !text.includes('[edit]') &&
                        !text.includes('Jump to navigation') &&
                        !text.includes('Main menu')) {
                        fullContent += text + ' ';
                    }
                });
            }

            // Method 2: Also get content from sections
            const sections = document.querySelectorAll('.mw-parser-output > *');
            sections.forEach(section => {
                if (section.tagName === 'P' || section.tagName === 'DIV') {
                    const text = section.textContent.trim();
                    if (text.length > 50 && !fullContent.includes(text.substring(0, 100))) {
                        fullContent += text + ' ';
                    }
                }
            });

            console.log(`✅ ACLB: Wikipedia extraction: ${fullContent.length} chars`);
            return fullContent;

        } catch (error) {
            console.warn('⚠️ ACLB: Wikipedia extraction failed:', error);
            return '';
        }
    }

    // 🎯 NEW: EXTRACT MAIN ARTICLE CONTENT
    extractMainArticleContent() {
        console.log('📄 ACLB: Extracting main article content');

        let content = '';
        const articleSelectors = [
            'article',
            '[role="article"]',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.story-content',
            '.main-content',
            '.content-inner',
            '[data-testid="article-content"]',
            '.prose',
            '.text-content',
            '.article-body',
            '.post-body',
            '.story-body'
        ];

        articleSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = this.extractTextFromElement(element);
                if (text.length > 200) {
                    content += text + ' ';
                }
            });
        });

        return content;
    }

    // 🎯 NEW: EXTRACT BY TEXT DENSITY (GET ALL HIGH-DENSITY ELEMENTS)
    extractByTextDensity() {
        console.log('📊 ACLB: Extracting by text density analysis');

        let content = '';
        const contentCandidates = [];
        const elements = document.querySelectorAll('p, div, article, section, main, [class*="content"], [class*="article"], [class*="story"]');

        elements.forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 100) {
                const htmlLength = el.innerHTML.length;
                const textDensity = text.length / Math.max(1, htmlLength);

                if (textDensity > 0.3) {
                    contentCandidates.push({
                        element: el,
                        text: text,
                        density: textDensity,
                        length: text.length
                    });
                }
            }
        });

        // Sort by density and length, take top 10 (not just 3)
        contentCandidates.sort((a, b) => {
            if (b.density !== a.density) return b.density - a.density;
            return b.length - a.length;
        });

        // Take more candidates for comprehensive content
        return contentCandidates.slice(0, 10).map(c => c.text).join(' ');
    }

    // 🎯 NEW: INTELLIGENT BODY CONTENT EXTRACTION
    extractIntelligentBodyContent() {
        console.log('🧠 ACLB: Extracting intelligent body content');

        const body = document.body;
        const clone = body.cloneNode(true);

        // Remove unwanted elements MORE AGGRESSIVELY
        const unwantedSelectors = [
            'nav', 'header', 'footer', 'aside', 'menu',
            '.navigation', '.header', '.footer', '.sidebar',
            '.menu', '.advertisement', '.ad', '.ads',
            '.social', '.share', '.comments', '.related',
            'script', 'style', 'noscript', 'iframe',
            '.hidden', '.sr-only', '.visually-hidden',
            '.modal', '.popup', '.overlay',
            // Additional unwanted elements
            '.navbar', '.breadcrumb', '.pagination',
            '.widget', '.recommendations', '.trending',
            '.newsletter', '.subscribe', '.popular-posts'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        return this.cleanContent(clone.textContent);
    }

    // 🎯 NEW: EXTRACT ALL MEANINGFUL TEXT (FALLBACK)
    extractAllMeaningfulText() {
        console.log('🌐 ACLB: Extracting all meaningful text');

        let content = '';
        const elements = document.querySelectorAll('p, div, span, li, td, h1, h2, h3, h4, h5, h6');

        elements.forEach(el => {
            const text = el.textContent.trim();
            // Include ALL meaningful text chunks
            if (text.length > 50 &&
                !text.match(/^(menu|home|about|contact|login|sign)/i) &&
                !text.match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/) &&
                text.split(' ').length > 5) {
                content += text + ' ';
            }
        });

        return content;
    }

    // 🎯 IMPROVED TEXT EXTRACTION FROM ELEMENT
    extractTextFromElement(element) {
        if (!element) return '';

        const clone = element.cloneNode(true);

        // Remove unwanted elements from the clone
        const unwantedSelectors = [
            'nav', 'header', 'footer', 'aside',
            '.ad', '.ads', '.sidebar', '.social',
            '.share', '.comments', '.related',
            'script', 'style', 'iframe'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    // 🎯 ENHANCED CONTENT CLEANING
    cleanContent(rawContent) {
        if (!rawContent) return '';

        console.log('🧹 ACLB: Cleaning raw content:', rawContent.length);

        let cleaned = rawContent
            // Remove common noise patterns
            .replace(/\[\d+\]/g, '') // Citations [1], [2]
            .replace(/\[edit\]/g, '') // Wikipedia [edit]
            .replace(/\{\{.*?\}\}/g, '') // Templates {{...}}
            .replace(/\|.*?\|/g, '') // Template parameters |...|
            .replace(/\[citation needed\]/gi, '') // Citation needed
            .replace(/Toggle the table of contents/gi, '') // TOC text
            .replace(/Jump to navigation/gi, '') // Navigation text
            .replace(/Jump to search/gi, '') // Search text

            // Remove social media and share text
            .replace(/Share(Save)?/gi, '')
            .replace(/Follow\s+@\w+/gi, '')
            .replace(/Like us on Facebook/gi, '')
            .replace(/Follow on Twitter/gi, '')

            // Remove common advertising text
            .replace(/Advertisement/gi, '')
            .replace(/Sponsored content/gi, '')
            .replace(/Partner content/gi, '')

            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();

        console.log('✅ ACLB: Cleaned content:', cleaned.length);
        return cleaned;
    }

    generateHelpfulFallbackContent() {
        const hostname = window.location.hostname;
        console.log('🔄 ACLB: Generating helpful fallback content for:', hostname);

        // Try to extract at least some meaningful content
        const bodyText = document.body?.textContent || '';
        const cleaned = this.cleanContent(bodyText);

        if (cleaned.length > 100) {
            return cleaned.substring(0, 1000); // Limit fallback content
        }

        return `This page (${hostname}) doesn't contain sufficient text content for analysis. Please try a different page with more article or blog content.`;
    }

    // ===== ENHANCED CONTENT EXTRACTION WITH RETRY =====
    async getPageContentWithRetry() {
        let content = '';
        let attempts = 0;

        while (attempts < 3 && !this.isSubstantialContent(content)) {
            content = await this.getCompletePageContent();
            attempts++;

            if (!this.isSubstantialContent(content)) {
                await this.delay(1000); // Wait 1 second between attempts
            }
        }

        return content;
    }

    async getCompletePageContent() {
        // Strategy 1: Wait for dynamic content to load
        return new Promise((resolve) => {
            setTimeout(() => {
                const content = this.extractComprehensiveContent();
                resolve(content);
            }, 2000); // Wait for dynamic loading
        });
    }

    extractComprehensiveContent() {
        let fullContent = '';

        console.log('🔄 ACLB: Using comprehensive content extraction for dynamic sites');

        // 1. Article/Content specific selectors
        const articleSelectors = [
            'article', '[role="article"]', '.content', '.post-content',
            '.article-body', '.story-content', '.main-content',
            '[data-testid="article-content"]', '.prose', '.text-content'
        ];

        for (const selector of articleSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isMeaningfulContent(el.textContent)) {
                    fullContent += ' ' + el.textContent;
                }
            });
        }

        // 2. Text density analysis for dynamic sites
        if (!fullContent.trim()) {
            fullContent = this.textDensityAnalysis();
        }

        // 3. Body text extraction with filtering
        if (!fullContent.trim()) {
            const bodyText = document.body.innerText;
            fullContent = this.filterMeaningfulText(bodyText);
        }

        return fullContent.trim();
    }

    filterMeaningfulText(text) {
        // Remove navigation, headers, footers, ads
        const lines = text.split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 50 && // Minimum length
                    !trimmed.match(/^(menu|home|about|contact|login|sign)/i) && // No navigation
                    !trimmed.match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/) && // No dates
                    trimmed.split(' ').length > 8; // Minimum word count
            });

        return lines.join('\n');
    }

    textDensityAnalysis() {
        // Find elements with highest text density (likely main content)
        const contentCandidates = [];
        const elements = document.querySelectorAll('p, div, article, section');

        elements.forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 100) {
                // Calculate text density (text length vs HTML complexity)
                const htmlLength = el.innerHTML.length;
                const textDensity = text.length / Math.max(1, htmlLength);

                if (textDensity > 0.3) { // Good text density threshold
                    contentCandidates.push({
                        element: el,
                        text: text,
                        density: textDensity,
                        length: text.length
                    });
                }
            }
        });

        // Sort by density and length, take top 3
        contentCandidates.sort((a, b) => {
            if (b.density !== a.density) return b.density - a.density;
            return b.length - a.length;
        });

        return contentCandidates.slice(0, 3).map(c => c.text).join(' ');
    }

    isMeaningfulContent(text) {
        return text && text.length > 50 && text.split(' ').length > 10;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isSubstantialContent(content) {
        return content &&
            content.length > 500 &&
            content.split(' ').length > 80;
    }

    isValidContent(text) {
        if (!text || text.length < 100) return false;

        const wordCount = text.split(/\s+/).length;
        const avgWordLength = text.length / wordCount;

        return wordCount > 20 &&
            avgWordLength > 3 &&
            !text.includes('Jump to navigation') &&
            !text.includes('Main menu') &&
            !text.includes('Cookie Policy');
    }

    // ===== ENHANCED SUMMARY GENERATION WITH CHROME AI =====
    async generateIntelligentSummary() {
        const content = await this.getPageContentWithRetry();

        if (!content || content.length < 50) {
            return 'Unable to generate summary: insufficient content extracted from this page. Please try a different page with more text content.';
        }

        console.log('🤖 ACLB: Attempting Chrome AI summarization...');

        // 🎯 PRIMARY: Try Chrome Built-in AI Summarizer API
        try {
            const aiSummary = await this.aiService.summarizeContent(content);
            if (aiSummary) {
                this.contentAnalysis.aiGenerated = true;
                return aiSummary;
            }
        } catch (error) {
            console.warn('⚠️ ACLB: Chrome AI summarization failed:', error);
        }

        // 🎯 FALLBACK: Use enhanced heuristic summary
        console.log('🔄 ACLB: Using enhanced heuristic fallback summary');
        return this.generateFallbackSummary();
    }

    generateFallbackSummary() {
        const content = this.getPageContent();

        if (typeof CognitiveEngine !== 'undefined' && CognitiveEngine.heuristicSummary) {
            return CognitiveEngine.heuristicSummary(content);
        } else {
            return this.generateBasicFallback(content);
        }
    }

    generateBasicFallback(content) {
        if (!content || content.length < 100) {
            return 'Content too short for meaningful summary. Please try a page with more article text.';
        }

        // Simple paragraph extraction
        const paragraphs = content.split(/\.\s+/).filter(p => p.length > 50);
        if (paragraphs.length >= 2) {
            return paragraphs.slice(0, 2).join('. ') + '.';
        }

        return content.substring(0, 200) + '...';
    }

    // ===== REAL FOCUS SCORING INTEGRATION =====
    calculateEngagementScore() {
        return this.realFocusAnalyzer.calculateRealFocusScore();
    }

    // ===== PERSISTENT CONNECTION SYSTEM =====
    setupPersistentConnection() {
        console.log('🔗 ACLB: Setting up persistent connection system');

        // Setup long-lived port connection
        this.setupBackgroundPort();

        // Start aggressive heartbeat
        this.startAggressiveHeartbeat();

        // Setup reconnection system
        this.startReconnectionMonitor();
    }

    startAggressiveHeartbeat() {
        // Send heartbeat every 10 seconds to keep service worker alive
        this.heartbeatInterval = setInterval(() => {
            if (this.port && this.port.name === 'content-script-persistent') {
                try {
                    this.port.postMessage({
                        type: 'heartbeat',
                        timestamp: Date.now(),
                        url: window.location.href,
                        focusScore: this.realFocusAnalyzer.calculateRealFocusScore(),
                        focusModeEnabled: this.isFocusModeEnabled,
                        blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false
                    });
                } catch (e) {
                    console.log('💔 ACLB: Heartbeat failed, port may be dead');
                    this.handleConnectionLost();
                }
            } else {
                // Try to reconnect if port is missing
                this.setupBackgroundPort();
            }
        }, 10000);
    }

    startReconnectionMonitor() {
        // Monitor connection state and attempt reconnection
        this.reconnectionInterval = setInterval(() => {
            if (!this.isConnected && this.connectionAttempts < 5) {
                console.log('🔄 ACLB: Attempting reconnection...');
                this.connectToBackground();
            }
        }, 15000);
    }

    handleConnectionLost() {
        console.log('🔌 ACLB: Connection lost, entering local mode');
        this.isConnected = false;
        this.setupLocalMode();

        // Attempt reconnection after delay
        setTimeout(() => {
            this.connectToBackground();
        }, 3000);
    }

    setupBackgroundPort() {
        this.port = getOrCreatePort();
        if (this.port) {
            this.setupPortHandlers();
            this.isConnected = true;
        }
    }

    setupLocalMode() {
        this.useFallback = true;
        console.log('🔌 ACLB: Running in local fallback mode');
    }

    connectToBackground() {
        this.connectionAttempts++;
        this.setupBackgroundPort();
    }

    async bootstrap() {
        if (isRestrictedPage()) return this.enterFallback(true);
        await domReady();

        // Setup enhanced message listener first
        setupEnhancedMessageListener();

        // Setup persistent connection system
        this.setupPersistentConnection();

        // Strict context ping
        this.extensionContextValid = await validateExtensionContextStrict();
        if (!this.extensionContextValid) return this.scheduleRetry();

        // AI availability (non-fatal)
        await this.aiService.checkAIAvailability();

        // Ready signal
        const ack = await sendRuntimeMessageAsync({
            type: 'contentScriptReady',
            url: location.href,
            timestamp: Date.now(),
            hasPort: true,
            bfcacheResistant: true,
            multiSiteSupported: true,
            focusScoring: true,
            spaDetection: true,
            adaptiveBlocking: true
        }, 1500);

        if (ack && ack.success) {
            this.readySignalSent = true;
            this.connectionEstablished = true;
            this.serviceWorkerActive = !!ack.serviceWorkerActive;
        }

        // Message handlers and tracking
        this.setupMessageHandlers();
        await this.loadUserPreferences();
        this.setupActivityTracking();

        // Check for existing focus mode state on load
        await this.checkInitialFocusModeState();

        // Initial content analysis using new extraction
        const content = await this.getPageContentWithRetry();
        await this.analyzePageContent({ content });

        this.isInitialized = true;
        this.signalInitializationComplete();
    }

    // ===== BACKGROUND STATE SYNCHRONIZATION =====
    async checkInitialFocusModeState() {
        try {
            console.log('🔄 ACLB: Checking initial focus mode state...');
            const response = await sendRuntimeMessageAsync({
                action: 'getFocusModeState',
                tabId: await this.getCurrentTabId(),
                url: window.location.href
            });

            if (response && response.enabled) {
                console.log('🎯 ACLB: Restoring focus mode from background state');
                this.enableTrueFocusMode();
                this.isFocusModeEnabled = true;
            }
        } catch (error) {
            console.log('ℹ️ ACLB: No focus mode state found or background not ready');
        }
    }

    scheduleRetry() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) return this.enterFallback();
        this.reconnectAttempts += 1;
        const delay = Math.min(30000, Math.round(800 * Math.pow(1.7, this.reconnectAttempts) + Math.random() * 250));
        setTimeout(() => this.bootstrap().catch(() => this.enterFallback()), delay);
    }

    enterFallback(silent = false) {
        this.useFallback = true;
        this.isInitialized = true;
        if (!silent) console.warn('ACLB: Fallback mode active');
    }

    setupPortHandlers() {
        if (!this.port) return;
        this.port.onMessage.addListener((msg) => this.handlePortMessage(msg));
        this.port.onDisconnect.addListener(() => {
            this.isConnected = false;
            this.serviceWorkerActive = false;
            this.handleConnectionLost();
        });
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.reconnectionInterval) {
            clearInterval(this.reconnectionInterval);
            this.reconnectionInterval = null;
        }
    }

    handlePortMessage(message) {
        switch (message?.type) {
            case 'heartbeat_response':
            case 'keepalive':
                this.serviceWorkerActive = true;
                break;
            case 'service_worker_suspending':
                this.serviceWorkerActive = false;
                this.scheduleRetry();
                break;
            case 'contentScriptConfirmed':
                this.connectionEstablished = true;
                this.serviceWorkerActive = true;
                this.flushQueuedActivities();
                break;
            case 'focus_score_update':
                this.updateLocalFocusScore?.(message.score);
                break;
            case 'intervention_triggered':
                this.handleIntervention?.(message.intervention);
                break;
            case 'summary_response':
                this.handleSummaryResponse?.(message.summary);
                break;
            case 'request_summary':
                this.requestIntelligentSummary?.();
                break;
            default:
                break;
        }
    }

    setupMessageHandlers() {
        if (!chrome?.runtime?.onMessage) return;
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            let isAsync = false;
            try {
                switch (request?.type) {
                    case 'ping':
                        sendResponse({
                            success: true,
                            pong: true,
                            timestamp: Date.now(),
                            contentScriptReady: true,
                            connectionEstablished: this.connectionEstablished,
                            multiSiteSupported: true,
                            focusScore: this.realFocusAnalyzer.calculateRealFocusScore(),
                            spaDetection: !!this.spaDetector,
                            focusModeEnabled: this.isFocusModeEnabled,
                            blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false
                        });
                        break;
                    case 'getPageContent':
                        isAsync = true;
                        this.handleContentExtraction()
                            .then((content) => sendResponse(content))
                            .catch((e) => sendResponse({
                                success: false,
                                error: e?.message || 'extract failed',
                                content: '',
                                sufficientContent: false
                            }));
                        break;

                    case 'requestSummary':
                        isAsync = true;
                        this.generateIntelligentSummary()
                            .then(summary => sendResponse({
                                success: true,
                                summary,
                                extractionMethod: this.contentAnalysis.extractionMethod,
                                aiGenerated: this.contentAnalysis.aiGenerated
                            }))
                            .catch(() => sendResponse({
                                success: true,
                                summary: this.generateFallbackSummary(),
                                extractionMethod: 'fallback',
                                aiGenerated: false
                            }));
                        break;

                    case 'focusModeChanged':
                        this.handleFocusModeChange?.(request.isActive);
                        sendResponse({ received: true });
                        break;

                    case 'toggleFocusMode':
                        this.handleFocusModeChange?.(request.isActive);
                        sendResponse({ success: true, active: request.isActive });
                        break;

                    case 'getStatus':
                        sendResponse({
                            connectionState: this.getConnectionState(),
                            contentScriptReady: true,
                            connectionEstablished: this.connectionEstablished,
                            extractionStats: this.extractionStats,
                            url: location.href,
                            multiSiteSupported: true,
                            focusScore: this.realFocusAnalyzer.calculateRealFocusScore(),
                            spaDetection: !!this.spaDetector,
                            focusModeEnabled: this.isFocusModeEnabled,
                            blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false
                        });
                        break;
                    case 'reinitialize':
                        isAsync = true;
                        this.reinitialize()
                            .then(() => sendResponse({ reinitializing: true }))
                            .catch((e) => sendResponse({
                                reinitializing: false,
                                error: e?.message || 'reinit failed'
                            }));
                        break;
                    case 'getFocusScore':
                        sendResponse({
                            success: true,
                            score: this.realFocusAnalyzer.calculateRealFocusScore(),
                            engagement: this.realFocusAnalyzer.calculateEngagement(),
                            scrollDepth: this.realFocusAnalyzer.getScrollDepth(),
                            timeFactor: this.realFocusAnalyzer.getTimeFactor(),
                            sessionQuality: this.realFocusAnalyzer.getSessionQuality()
                        });
                        break;

                    case 'toggleBlocking':
                        if (this.spaDetector?.adaptiveBlocker) {
                            if (request.enabled) {
                                this.spaDetector.adaptiveBlocker.start();
                            } else {
                                this.spaDetector.adaptiveBlocker.stop();
                            }
                            sendResponse({
                                success: true,
                                enabled: this.spaDetector.adaptiveBlocker.isBlocking
                            });
                        } else {
                            sendResponse({ success: false, error: 'Blocking system not available' });
                        }
                        break;

                    // ===== ELEMENT PICKER MESSAGES =====
                    case 'startElementPicker':
                        const result = elementPicker.start();
                        sendResponse(result);
                        break;

                    case 'stopElementPicker':
                        elementPicker.stop();
                        sendResponse({ success: true });
                        break;

                    // ===== SMART AUTO-BLOCKING MESSAGES =====
                    case 'startAutoBlocking':
                        const autoBlockResult = autoBlocker.startAutoBlocking();
                        sendResponse(autoBlockResult);
                        break;

                    case 'restoreBlockedElements':
                        const restoredCount = autoBlocker.restoreAllBlockedElements();
                        sendResponse({ success: true, restoredCount });
                        break;

                    // ===== BACKGROUND STATE SYNCHRONIZATION MESSAGES =====
                    case 'focusModeChanged':
                        if (request.enabled !== undefined) {
                            this.handleFocusModeChange(request.enabled);
                            sendResponse({ success: true });
                        }
                        break;

                    case 'getCurrentState':
                        sendResponse({
                            focusModeEnabled: this.isFocusModeEnabled,
                            contentExtracted: this.hasContent(),
                            focusScore: this.realFocusAnalyzer.calculateRealFocusScore(),
                            url: window.location.href,
                            blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false,
                            autoBlockerAvailable: true,
                            elementPickerAvailable: true
                        });
                        break;

                    default:
                        sendResponse({ error: 'Unknown message type' });
                }
            } catch (e) {
                sendResponse({ error: e?.message || 'handler error' });
            }
            return isAsync;
        });
    }

    getConnectionState() {
        return {
            isConnected: this.isConnected,
            isInitialized: this.isInitialized,
            useFallback: this.useFallback,
            extensionContextValid: this.extensionContextValid,
            reconnectAttempts: this.reconnectAttempts,
            connectionAttempts: this.connectionAttempts,
            portActive: !!this.port,
            runtimeAvailable: !!chrome?.runtime?.id,
            contextValid: this.extensionContextValid,
            connectionEstablished: this.connectionEstablished,
            readySignalSent: this.readySignalSent,
            focusAnalyzerActive: true,
            spaDetection: !!this.spaDetector,
            focusModeEnabled: this.isFocusModeEnabled,
            blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false,
            autoBlockerAvailable: true,
            elementPickerAvailable: true
        };
    }

    async handleContentExtraction() {
        this.extractionStats.totalExtractions++;
        try {
            if (document.readyState === 'loading') {
                await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
            }

            // Use new content extraction system with retry
            const content = await this.getPageContentWithRetry();
            const sufficientContent = this.isSubstantialContent(content);
            const result = {
                success: true,
                content,
                title: document.title || 'Unknown Page',
                sufficientContent,
                url: location.href,
                timestamp: Date.now(),
                wordCount: (content || '').trim().split(/\s+/).filter(Boolean).length,
                contentLength: content.length,
                extractionMethod: this.contentAnalysis.extractionMethod,
                focusScore: this.realFocusAnalyzer.calculateRealFocusScore(),
                focusModeEnabled: this.isFocusModeEnabled,
                blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false
            };

            this.lastExtractionResult = result;
            if (sufficientContent) this.extractionStats.successfulExtractions++;
            else this.extractionStats.failedExtractions++;
            return result;
        } catch (e) {
            this.extractionStats.failedExtractions++;
            return {
                success: false,
                error: e?.message || 'extraction failed',
                content: '',
                sufficientContent: false,
                title: document.title,
                url: location.href
            };
        }
    }

    // ===== Analysis & summary =====
    async analyzePageContent(contentResult) {
        try {
            const content = contentResult.content || '';
            const cognitiveAnalysis = this.analyzeContent();

            const aiAnalysis = await this.aiService.analyzeContentWithAI(content);
            if (aiAnalysis) {
                this.contentAnalysis.readingTime = aiAnalysis.estimatedReadTime || cognitiveAnalysis.readingTime;
                this.contentAnalysis.contentComplexity = aiAnalysis.complexity;
                this.contentAnalysis.contentType = aiAnalysis.contentType;
                this.contentAnalysis.pageKeywords = Array.isArray(aiAnalysis.keyThemes) ? aiAnalysis.keyThemes : cognitiveAnalysis.keywords;
                this.contentAnalysis.aiGenerated = true;
                this.contentAnalysis.focusRequired = aiAnalysis.focusRequired ?? 5;
            } else {
                // Use Cognitive Engine analysis
                this.contentAnalysis.readingTime = cognitiveAnalysis.readingTime;
                this.contentAnalysis.contentComplexity = cognitiveAnalysis.complexity;
                this.contentAnalysis.pageKeywords = cognitiveAnalysis.keywords;
                this.contentAnalysis.contentType = cognitiveAnalysis.contentType;
                this.contentAnalysis.aiGenerated = false;
                this.contentAnalysis.focusRequired = cognitiveAnalysis.complexity > 7 ? 8 : 5;
            }

            // Add quality assessment
            this.contentAnalysis.quality = cognitiveAnalysis.quality;

            return this.contentAnalysis;
        } catch {
            return null;
        }
    }

    // Utility and UI helpers
    calculateScrollDepth() {
        return this.realFocusAnalyzer.getScrollDepth();
    }

    calculateEngagementScore() {
        return this.realFocusAnalyzer.calculateRealFocusScore();
    }

    classifyDomain(host) {
        const maps = {
            social: ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'youtube.com', 'reddit.com', 'linkedin.com'],
            productivity: ['docs.google.com', 'notion.so', 'github.com', 'stackoverflow.com', 'figma.com'],
            news: ['news.google.com', 'cnn.com', 'bbc.com', 'reuters.com', 'apnews.com'],
            research: ['arxiv.org', 'research.google', 'ieee.org', 'acm.org'],
            educational: ['coursera.org', 'edx.org', 'khanacademy.org', 'udemy.com'],
            technical: ['stackoverflow.com', 'github.com', 'npmjs.com', 'docker.com'],
        };
        for (const [type, ds] of Object.entries(maps)) {
            if (ds.some((d) => host.includes(d))) return type;
        }
        if (host.includes('mail.') || host.includes('gmail.com')) return 'email';
        if (host.includes('calendar.') || host.includes('outlook.com')) return 'calendar';
        return 'other';
    }

    isContentElement(el) {
        if (!el?.tagName) return false;
        const tags = ['p', 'article', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td'];
        const classes = ['content', 'article', 'post', 'blog', 'news', 'story'];
        if (tags.includes(el.tagName.toLowerCase())) return true;
        const cn = (el.className || '').toString().toLowerCase();
        return classes.some((c) => cn.includes(c));
    }

    calculateContentProgress() {
        const sd = this.calculateScrollDepth();
        const timeFactor = Math.min(100, ((Date.now() - this.pageLoadTime) / 1000 / 60) * 10);
        return Math.round((sd + timeFactor) / 2);
    }

    detectWebsiteType() {
        const h = location.hostname, p = location.pathname;
        const types = {
            documentation: ['developer.mozilla.org', 'docs.', 'learn.', 'tutorial'],
            programming: ['stackoverflow.com', 'stackexchange.com', 'github.com', 'gitlab.com', 'npmjs.com'],
            encyclopedia: ['wikipedia.org', 'wikimedia.org', 'britannica.com'],
            news: ['news.', 'reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com'],
            blog: ['medium.com', 'blog.', 'substack.com', 'wordpress.com'],
            social: ['reddit.com', 'twitter.com', 'x.com', 'facebook.com', 'linkedin.com'],
            forum: ['forum.', 'community.', 'discourse.', 'discuss.'],
            ecommerce: ['amazon.com', 'ebay.com', 'shop.', 'store.'],
            search: ['google.com', 'bing.com', 'duckduckgo.com'],
            video: ['youtube.com', 'vimeo.com', 'twitch.tv'],
        };
        for (const [type, ds] of Object.entries(types)) {
            if (ds.some((d) => h.includes(d) || p.includes(d))) return type;
        }
        return 'general';
    }

    async loadUserPreferences() {
        return new Promise((resolve) => {
            try {
                const saved = localStorage.getItem('aclb_user_preferences');
                if (saved) this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
            } catch { }
            resolve();
        });
    }

    cleanup() {
        this.flushBufferIfNeeded();
        this.stopHeartbeat();
        try {
            localStorage.setItem('aclb_user_preferences', JSON.stringify(this.userPreferences));
        } catch { }
    }

    async reinitialize() {
        this.cleanup();
        this.isInitialized = false;
        this.isConnected = false;
        this.extensionContextValid = false;
        this.readySignalSent = false;
        this.connectionEstablished = false;
        await this.bootstrap();
    }

    // ===== Activity & messaging =====
    setupActivityTracking() {
        const options = { passive: true };
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDepth = this.calculateScrollDepth();
                if (scrollDepth % 20 === 0 || scrollDepth > 80) {
                    this.throttledActivity('scroll', {
                        scrollDepth,
                        contentProgress: this.calculateContentProgress()
                    });
                }
            }, 800);
        }, options);

        document.addEventListener('click', (e) => {
            const el = e.target;
            const isContent = this.isContentElement(el);
            if (isContent) this.throttledActivity('contentClick', {
                engagementScore: 80,
                elementType: el.tagName?.toLowerCase?.() || 'unknown'
            });
            else this.throttledActivity('click', { engagementScore: 70 });
        }, options);

        document.addEventListener('visibilitychange', () => {
            this.throttledActivity('visibilityChange', {
                visible: !document.hidden,
                engagementScore: document.hidden ? 30 : 70,
                timeOnPage: (Date.now() - this.pageLoadTime) / 1000
            });
        });

        // Mouse/Typing
        let mouseMoveTimeout;
        document.addEventListener('mousemove', () => {
            this.throttledActivity('mouse_move', { timestamp: Date.now() });
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                this.throttledActivity('mouse_idle', { duration: 30000, timestamp: Date.now() });
            }, 30000);
        });

        let typingTimeout;
        document.addEventListener('keydown', () => {
            this.throttledActivity('typing_start', { timestamp: Date.now() });
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                this.throttledActivity('typing_stop', { duration: 1000, timestamp: Date.now() });
            }, 1000);
        });

        window.addEventListener('load', async () => {
            setTimeout(async () => {
                const content = await this.getPageContentWithRetry();
                this.analyzePageContent({ content });
                this.throttledActivity('pageLoad', {
                    engagementScore: 50,
                    sessionStart: true,
                    contentAnalysis: this.contentAnalysis
                });
            }, 1500);
        });

        // Note: Removed the old URL change observer since we now use ACLBContent for SPA detection
    }

    throttledActivity(activityType, data = {}) {
        const activity = this.createActivity(activityType, data);
        this.activityBuffer.push(activity);

        // 🎯 RECORD ACTIVITY FOR REAL FOCUS SCORING
        this.realFocusAnalyzer.recordActivity(activity);

        if (this.activityBuffer.length > 50) this.activityBuffer = this.activityBuffer.slice(-25);
        if (['visibilityChange', 'pageLoad', 'navigation'].includes(activityType)) this.sendToBackground(activity);
        else this.flushBufferIfNeeded();
    }

    createActivity(type, data = {}) {
        const activity = {
            type,
            hostname: location.hostname,
            title: document.title,
            ts: Date.now(),
            scrollDepth: this.realFocusAnalyzer.getScrollDepth(),
            domainType: this.classifyDomain(location.hostname),
            engagementScore: this.realFocusAnalyzer.calculateRealFocusScore(),
            contentAnalysis: { ...this.contentAnalysis },
            userPreferences: { ...this.userPreferences },
            focusModeEnabled: this.isFocusModeEnabled,
            blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false,
            ...data,
        };
        this.learnFromBehavior?.(activity);
        return activity;
    }

    async sendToBackground(activity) {
        if (this.useFallback) return this.storeLocally(activity);
        if (!this.isConnected || !this.extensionContextValid) {
            const ok = await this.waitForConnection(2000);
            if (!ok) return this.storeLocally(activity);
        }
        try {
            const ok = await trySend({
                type: 'activity_update',
                activity,
                timestamp: Date.now(),
                connectionState: this.getConnectionState(),
                focusScore: this.realFocusAnalyzer.calculateRealFocusScore(),
                focusModeEnabled: this.isFocusModeEnabled,
                blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false
            });
            if (!ok) throw new Error('send failed');
        } catch {
            this.isConnected = false;
            this.storeLocally(activity);
            this.scheduleRetry();
        }
    }

    waitForConnection(timeout = 8000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                if ((this.isConnected && this.extensionContextValid) || this.useFallback) return resolve(true);
                if (Date.now() - start > timeout) return resolve(false);
                setTimeout(check, 120);
            };
            check();
        });
    }

    flushBufferIfNeeded() {
        if (this.activityBuffer.length === 0) return;
        const pending = [...this.activityBuffer];
        this.activityBuffer = [];
        pending.forEach((a) => this.sendToBackground(a));
    }

    storeLocally(activity) {
        this.localQueue.push(activity);
        if (this.localQueue.length > 100) this.localQueue.shift();
        try {
            localStorage.setItem('aclb_activities', JSON.stringify(this.localQueue));
        } catch { }
    }

    getStoredActivities() {
        try {
            return JSON.parse(localStorage.getItem('aclb_activities') || '[]');
        } catch {
            return [];
        }
    }

    flushQueuedActivities() {
        const stored = this.getStoredActivities();
        const all = [...this.localQueue, ...stored];
        this.localQueue = [];
        localStorage.removeItem('aclb_activities');
        all.forEach((a) => this.sendToBackground(a));
    }

    signalInitializationComplete() {
        trySend({
            type: 'initializationComplete',
            url: location.href,
            timestamp: Date.now(),
            features: {
                activityTracking: true,
                contentAnalysis: true,
                summarization: true,
                aiIntegration: this.aiService.isAIAvailable,
                cognitiveEngine: true,
                persistentConnection: true,
                enhancedExtraction: true,
                multiSiteSupport: true,
                realFocusScoring: true,
                spaNavigationDetection: true,
                enhancedFocusMode: true,
                layoutPreservation: true,
                backgroundSync: true,
                comprehensiveNotificationBlocking: true,
                adaptiveBlocking: true,
                centralizedBlockingRules: true,
                elementPicker: true,
                smartAutoBlocker: true
            },
            aiStatus: this.aiService.getAPIStatus(),
            focusScore: this.realFocusAnalyzer.calculateRealFocusScore(),
            focusModeEnabled: this.isFocusModeEnabled,
            blockingActive: this.spaDetector?.adaptiveBlocker?.isBlocking || false
        });
        sendRuntimeMessageAsync({
            action: 'contentScriptStatusUpdate',
            status: 'ready',
            url: location.href,
            timestamp: Date.now(),
            aiStatus: this.aiService.getAPIStatus(),
            multiSiteSupported: true,
            focusScoringEnabled: true,
            spaDetectionEnabled: true,
            enhancedFocusModeEnabled: true,
            layoutPreservationEnabled: true,
            backgroundSyncEnabled: true,
            notificationBlockingEnabled: true,
            adaptiveBlockingEnabled: true,
            centralizedBlockingRules: true,
            elementPickerEnabled: true,
            smartAutoBlockerEnabled: true
        });
    }

    // ===== Enhanced Content Analysis with Cognitive Engine =====
    analyzeContent() {
        const content = this.getPageContent();

        // Use the imported CognitiveEngine or fallback methods
        if (typeof CognitiveEngine !== 'undefined') {
            const analysis = {
                readingTime: CognitiveEngine.estimateReadingTime(content),
                keywords: CognitiveEngine.extractKeywords(content),
                complexity: CognitiveEngine.analyzeComplexity(content),
                contentType: CognitiveEngine.classifyContentType(content),
                wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
                quality: CognitiveEngine.assessContentQuality(content)
            };

            console.log('📊 ACLB: Content Analysis:', analysis);
            return analysis;
        } else {
            // Fallback analysis
            const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
            return {
                readingTime: Math.max(1, Math.ceil(wordCount / 200)),
                keywords: [],
                complexity: 5,
                contentType: 'general',
                wordCount: wordCount,
                quality: { score: 50, issues: ['Fallback analysis'] }
            };
        }
    }
}

// ============================ BOOTSTRAP ============================
// Delay bootstrap to ensure CognitiveEngine is loaded
setTimeout(() => {
    (function bootstrap() {
        try {
            window.aclbTracker = new IntelligentActivityTracker();
            // Add manual test function to window
            window.testFocusMode = IntelligentActivityTracker.testFocusMode;
            console.log('✅ ACLB: Enhanced tracker initialized with real focus scoring, dynamic content extraction, SPA navigation detection, enhanced focus mode, layout preservation, background state synchronization, comprehensive notification blocking, platform-specific distraction blocking, centralized adaptive blocking system, element picker, AND smart auto-blocking system');
        } catch (e) {
            console.error('ACLB: Initial bootstrap failed, retrying...', e);
            setTimeout(() => {
                try {
                    window.aclbTracker = new IntelligentActivityTracker();
                    window.testFocusMode = IntelligentActivityTracker.testFocusMode;
                } catch (e2) {
                    console.error('ACLB: Secondary bootstrap failed', e2);
                }
            }, 2000);
        }
    })();
}, 100);