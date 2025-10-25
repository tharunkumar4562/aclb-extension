// 🎯 FOCUS ANALYZER - Cognitive Load Calculation Engine (BFCache-safe, schema-aligned, robust)

(function (global) {
    class FocusAnalyzer {
        constructor() {
            this.userModel = {
                productiveHours: [9, 14, 16],   // learned over time
                contentPreferences: {},         // { [type]: 0..1 }
                optimalSessionLength: 25,       // minutes
                distractionPatterns: []         // [{ type:'session'|'switch', duration:number, ts:number }]
            };
            this._saveDebounce = null;
            this._lastSaveAt = 0;
            this.loadUserModel();
        }

        // 🧠 PLANNED FOCUS SCORING - Comprehensive breakdown
        calculateRealFocusScore(activities = [], contentAnalysis = null) {
            return {
                behavior: this.analyzeActivityPatterns(activities),
                content: this.analyzeContentComplexity(contentAnalysis),
                temporal: this.considerTimeOfDay(),
                personal: this.applyUserPreferences(contentAnalysis)
            };
        }

        // 🧠 MAIN SCORE (0..100)
        calculateFocusScore(activities = [], contentAnalysis = null) {
            let score = 50;

            // Normalize latest snapshot
            const latest = this._getLatestActivity(activities);
            const normalized = this._normalizeActivity(latest);

            // 1) Content preference match (−15..+15)
            score += this.calculateContentPreferenceMatch(contentAnalysis);

            // 2) Temporal match (0 or +10)
            score += this.calculateTemporalMatch();

            // 3) Behavioral rhythm (−10..+15)
            score += this.analyzeBehavioralRhythm(activities);

            // 4) Domain impact (−22..+15)
            score += this.calculateDomainImpact(activities);

            // 5) Scroll depth (−10..+10) — normalized to 0..1 internally
            score += this.analyzeScrollDepthFromNormalized(normalized);

            // 6) Distraction penalties (0..−20)
            score += this.detectDistractionPatterns(activities);

            return Math.max(0, Math.min(100, score));
        }

        // ---------- REAL FOCUS SCORE COMPONENTS ----------
        analyzeActivityPatterns(activities = []) {
            if (!Array.isArray(activities) || activities.length === 0) {
                return { rhythm: 50, engagement: 50, consistency: 50, distractions: 0 };
            }

            const recent = activities.slice(-10);

            // Engagement trend
            const engagements = recent.map(a => this._coerceEngagement(a));
            const engagementTrend = engagements.length > 1
                ? (engagements[engagements.length - 1] - engagements[0])
                : 0;

            // Session consistency
            const durations = recent.map(a => a.sessionLength || a.duration || 0).filter(d => d > 0);
            const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0;
            const consistency = durations.length > 1
                ? Math.max(0, 100 - (Math.std(durations) / avgDuration * 100))
                : 50;

            // Distraction frequency
            const distractions = recent.filter(a =>
                a.type === 'visibilityChange' && !a.visible ||
                a.type === 'mouse_idle' ||
                a.type === 'typing_stop'
            ).length;

            return {
                rhythm: this.analyzeBehavioralRhythm(activities) + 50, // Convert to 0-100 scale
                engagement: Math.max(0, Math.min(100, 50 + engagementTrend * 2)),
                consistency: Math.max(0, Math.min(100, consistency)),
                distractions: Math.min(10, distractions),
                trend: engagementTrend > 5 ? 'improving' : engagementTrend < -5 ? 'declining' : 'stable'
            };
        }

        analyzeContentComplexity(contentAnalysis = null) {
            if (!contentAnalysis) {
                return { complexity: 50, readability: 50, focusRequired: 50, type: 'unknown' };
            }

            const complexity = Number.isFinite(contentAnalysis.complexity)
                ? contentAnalysis.complexity * 10
                : Number.isFinite(contentAnalysis.contentComplexity)
                    ? contentAnalysis.contentComplexity * 10
                    : 50;

            const readingTime = Number.isFinite(contentAnalysis.readingTime)
                ? contentAnalysis.readingTime
                : Number.isFinite(contentAnalysis.readingTimeMinutes)
                    ? contentAnalysis.readingTimeMinutes
                    : 5;

            const focusRequired = Number.isFinite(contentAnalysis.focusRequired)
                ? contentAnalysis.focusRequired * 10
                : complexity > 70 ? 80 : complexity < 30 ? 40 : 60;

            return {
                complexity: Math.max(0, Math.min(100, complexity)),
                readability: Math.max(0, Math.min(100, 100 - complexity * 0.7)),
                focusRequired: Math.max(0, Math.min(100, focusRequired)),
                readingTime,
                type: contentAnalysis.type || contentAnalysis.contentType || 'general',
                aiGenerated: !!contentAnalysis.aiGenerated
            };
        }

        considerTimeOfDay(now = new Date()) {
            const hour = now.getHours();
            const productiveHours = Array.isArray(this.userModel.productiveHours)
                ? this.userModel.productiveHours
                : [9, 14, 16];

            const isProductiveHour = productiveHours.includes(hour);
            const timeScore = isProductiveHour ? 80 : 40;

            // Circadian rhythm factors
            let energyLevel = 50;
            if (hour >= 6 && hour <= 9) energyLevel = 70;   // Morning peak
            if (hour >= 13 && hour <= 15) energyLevel = 60; // Afternoon
            if (hour >= 18 && hour <= 20) energyLevel = 65; // Evening
            if (hour >= 22 || hour <= 5) energyLevel = 30;  // Late night

            return {
                timeScore,
                energyLevel,
                isProductiveHour,
                hourOfDay: hour,
                productiveHours,
                recommendation: this.getTimeBasedRecommendation(hour, energyLevel)
            };
        }

        applyUserPreferences(contentAnalysis = null) {
            const prefs = this.userModel.contentPreferences || {};
            const contentType = contentAnalysis?.type || contentAnalysis?.contentType || 'general';

            const preferenceScore = typeof prefs[contentType] === 'number'
                ? prefs[contentType] * 100
                : 50;

            const optimalSession = Number.isFinite(this.userModel.optimalSessionLength)
                ? this.userModel.optimalSessionLength
                : 25;

            const learnedPatterns = {
                preferredContentTypes: Object.keys(prefs)
                    .filter(k => prefs[k] > 0.6)
                    .sort((a, b) => prefs[b] - prefs[a]),
                avoidedContentTypes: Object.keys(prefs)
                    .filter(k => prefs[k] < 0.4),
                optimalSessionLength: optimalSession,
                modelMaturity: Object.keys(prefs).length > 3 ? 'mature' :
                    Object.keys(prefs).length > 0 ? 'learning' : 'new'
            };

            return {
                preferenceScore: Math.max(0, Math.min(100, preferenceScore)),
                personalization: Object.keys(prefs).length * 10,
                ...learnedPatterns,
                match: preferenceScore > 70 ? 'excellent' :
                    preferenceScore > 60 ? 'good' :
                        preferenceScore > 40 ? 'neutral' : 'poor'
            };
        }

        // ---------- COMPONENT SCORES ----------
        calculateContentPreferenceMatch(contentAnalysis) {
            if (!contentAnalysis) return 0;

            const userPrefs = this.userModel.contentPreferences || {};
            const contentType = contentAnalysis.type || contentAnalysis.contentType || 'general';
            const complexity = Number.isFinite(contentAnalysis.complexity) ? contentAnalysis.complexity
                : Number.isFinite(contentAnalysis.contentComplexity) ? contentAnalysis.contentComplexity
                    : 5;

            if (typeof userPrefs[contentType] === 'number') {
                const p = Math.max(0, Math.min(1, userPrefs[contentType]));
                return Math.round((p - 0.5) * 30); // widen to ±15
            }

            const baseScores = {
                technical: complexity > 7 ? 12 : 6,
                educational: 10,
                news: 2,
                entertainment: -5,
                social: -15,
                general: 0
            };
            return baseScores[contentType] ?? 0;
        }

        calculateTemporalMatch(now = new Date()) {
            const hour = now.getHours();
            const productive = Array.isArray(this.userModel.productiveHours) ? this.userModel.productiveHours : [];
            return productive.includes(hour) ? 10 : 0;
        }

        analyzeBehavioralRhythm(activities = []) {
            if (!Array.isArray(activities) || activities.length < 5) return 0;
            const recent = activities.slice(-10);
            const eng = recent.map(a => this._coerceEngagement(a));
            const changes = [];
            for (let i = 1; i < eng.length; i++) {
                changes.push(Math.abs(eng[i] - eng[i - 1]));
            }
            if (changes.length === 0) return 0;
            const avgVol = changes.reduce((a, b) => a + b, 0) / changes.length; // 0..100 scale
            if (avgVol < 10) return 15;
            if (avgVol < 25) return 5;
            return -10;
        }

        calculateDomainImpact(activities = []) {
            if (!Array.isArray(activities) || activities.length === 0) return 0;
            const last = activities[activities.length - 1] || {};
            const host = (last.hostname || last.domain || '').toString();
            const map = {
                'github.com': 15,
                'stackoverflow.com': 12,
                'wikipedia.org': 10,
                'medium.com': 8,
                'nytimes.com': 5,
                'youtube.com': -10,
                'facebook.com': -20,
                'twitter.com': -18,
                'x.com': -18,
                'instagram.com': -22,
                'reddit.com': -8
            };
            const key = Object.keys(map).find(d => host.includes(d));
            return key ? map[key] : 0;
        }

        analyzeScrollDepthFromNormalized(a = {}) {
            // Tracker emits scrollDepth 0..100; map to 0..1 then score
            const sd01 = Math.max(0, Math.min(1, (a.scrollDepth ?? 0) / 100));
            if (sd01 > 0.8) return 10;
            if (sd01 > 0.5) return 5;
            if (sd01 > 0.2) return 0;
            return -10;
        }

        detectDistractionPatterns(activities = []) {
            if (!Array.isArray(activities) || activities.length < 3) return 0;
            const recent = activities.slice(-5);
            let penalty = 0;

            // Rapid domain switching
            const domains = recent.map(a => (a.hostname || a.domain || '').toString());
            const unique = new Set(domains.filter(Boolean)).size;
            if (unique >= 4) penalty -= 10;

            // Short session lengths (seconds)
            const shortSessions = recent.filter(a => (a.sessionLength ?? a.duration ?? 0) < 60).length;
            if (shortSessions >= 3) penalty -= 10;

            return penalty;
        }

        // ---------- TIME-BASED RECOMMENDATIONS ----------
        getTimeBasedRecommendation(hour, energyLevel) {
            if (hour >= 22 || hour <= 5) {
                return "Consider resting - late night focus is challenging";
            } else if (energyLevel > 65) {
                return "High energy period - tackle complex tasks";
            } else if (energyLevel > 45) {
                return "Moderate energy - good for routine work";
            } else {
                return "Lower energy - consider breaks or lighter tasks";
            }
        }

        // ---------- MODEL UPDATE ----------
        updateUserModel(activity = {}, contentAnalysis = null) {
            // Productive hours
            const hour = new Date().getHours();
            const hours = new Set(this.userModel.productiveHours || []);
            hours.add(hour);
            this.userModel.productiveHours = Array.from(hours).sort((a, b) => a - b).slice(-12);

            // Content preferences (bounded moving average)
            if (contentAnalysis) {
                const type = contentAnalysis.type || contentAnalysis.contentType || 'general';
                const engagement = this._coerceEngagement(activity) / 100; // 0..1
                const prev = typeof this.userModel.contentPreferences[type] === 'number'
                    ? this.userModel.contentPreferences[type] : 0.5;
                const alpha = 0.3; // EMA
                const hasEng = Number.isFinite(engagement);
                const next = hasEng ? (prev * (1 - alpha) + engagement * alpha) : prev;
                this.userModel.contentPreferences[type] = Math.max(0, Math.min(1, next));
            }

            // Optimal session length from patterns
            const sessions = (this.userModel.distractionPatterns || [])
                .filter(p => p && p.type === 'session' && Number.isFinite(p.duration))
                .map(p => p.duration);
            if (sessions.length > 0) {
                const avg = Math.round(sessions.reduce((a, b) => a + b, 0) / sessions.length);
                if (Number.isFinite(avg) && avg > 0) this.userModel.optimalSessionLength = avg;
            }

            this.saveUserModel();
        }

        // ---------- PERSISTENCE ----------
        saveUserModel() {
            try {
                const now = Date.now();
                if (now - this._lastSaveAt < 1500) { // debounce writes
                    clearTimeout(this._saveDebounce);
                    this._saveDebounce = setTimeout(() => this._commitSave(), 1500);
                    return;
                }
                this._commitSave();
            } catch (_) { }
        }
        _commitSave() {
            try {
                localStorage.setItem('aclb_user_model', JSON.stringify(this.userModel));
                this._lastSaveAt = Date.now();
            } catch (e) {
                // quota or restricted context; ignore
            }
        }

        loadUserModel() {
            try {
                const saved = localStorage.getItem('aclb_user_model');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Merge safely
                    if (parsed && typeof parsed === 'object') {
                        this.userModel.productiveHours = Array.isArray(parsed.productiveHours) ? parsed.productiveHours : this.userModel.productiveHours;
                        this.userModel.contentPreferences = parsed.contentPreferences || this.userModel.contentPreferences;
                        if (Number.isFinite(parsed.optimalSessionLength)) this.userModel.optimalSessionLength = parsed.optimalSessionLength;
                        this.userModel.distractionPatterns = Array.isArray(parsed.distractionPatterns) ? parsed.distractionPatterns : this.userModel.distractionPatterns;
                    }
                }
            } catch (e) {
                // ignore parse/storage errors
            }
        }

        // ---------- DIAGNOSTICS ----------
        getDiagnostics() {
            let aiAvailable = false;
            try { aiAvailable = !!(global.cognitiveEngine?.aiAvailable); } catch { }
            return {
                userModel: this.userModel,
                aiAvailable,
                lastUpdate: new Date().toISOString()
            };
        }

        // ---------- HELPERS ----------
        _getLatestActivity(activities = []) {
            if (!Array.isArray(activities) || activities.length === 0) return {};
            return activities[activities.length - 1] || {};
        }
        _normalizeActivity(a = {}) {
            // Normalize schema to expected keys/ranges
            const engagementScore = this._coerceEngagement(a);      // 0..100
            const scrollDepth = this._coerceScrollDepth(a);         // 0..100
            const hostname = (a.hostname || a.domain || '').toString();
            const sessionLength = Number.isFinite(a.sessionLength) ? a.sessionLength
                : Number.isFinite(a.duration) ? a.duration
                    : 0;
            return { engagementScore, scrollDepth, hostname, sessionLength };
        }
        _coerceEngagement(a = {}) {
            const e = a.engagementScore ?? a.engagement ?? 50;
            if (e <= 1) return Math.round(e * 100); // convert 0..1 to 0..100
            return Math.max(0, Math.min(100, Math.round(e)));
        }
        _coerceScrollDepth(a = {}) {
            const s = a.scrollDepth ?? 0;
            if (s <= 1) return Math.round(s * 100); // convert 0..1 to 0..100
            return Math.max(0, Math.min(100, Math.round(s)));
        }
    }

    // Add std deviation helper to Math if not present
    if (!Math.std) {
        Math.std = function (arr) {
            if (!Array.isArray(arr) || arr.length === 0) return 0;
            const mean = arr.reduce((a, b) => a + b) / arr.length;
            return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / arr.length);
        };
    }

    // Global instance (guard window/self)
    try {
        global.focusAnalyzer = new FocusAnalyzer();
    } catch (_) { }

    // Universal export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FocusAnalyzer;
    } else if (typeof define === 'function' && define.amd) {
        define([], () => FocusAnalyzer);
    } else {
        try { (global || self || window).FocusAnalyzer = FocusAnalyzer; } catch (_) { }
    }
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this));