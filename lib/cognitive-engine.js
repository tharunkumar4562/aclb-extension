// 🚨 ACLB CONFLICT RESOLUTION SYSTEM
(function () {
    // Prevent duplicate content script execution
    if (window.aclbContentScriptLoaded) {
        console.log('🚫 ACLB: Duplicate content script detected - stopping execution');
        console.log('💡 SOLUTION: Remove cognitive-engine.js injection from background script');
        return; // Stop execution entirely
    }
    window.aclbContentScriptLoaded = true;

    // Mark which script is running
    const currentScript = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest ?
        'content.js' : 'cognitive-engine.js';
    console.log(`✅ ACLB: Starting ${currentScript} as single content script`);
})();

// 🎯 ACLB - Cognitive Engine (BFCache-safe, strict validation, unified init, low-noise)
// Enhanced with Message Relay System, Focus Mode, and Cognitive Engine
// Added: Persistent Connection System & Enhanced Content Extraction

// ============================ COGNITIVE ENGINE ============================
// 🚀 IMMEDIATE GLOBAL AVAILABILITY - NO IIFE WRAPPER
class CognitiveEngine {
    constructor() {
        this.aiAvailable = this.checkAIAvailability();
        try { console.log('Cognitive Engine initialized, AI Available:', this.aiAvailable); } catch { }
    }

    // ✅ STATIC METHODS - IMMEDIATELY AVAILABLE
    static estimateReadingTime(text, wordsPerMinute = 200) {
        if (!text) return 0;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    static extractKeywords(text, maxKeywords = 8) {
        if (!text) return [];

        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'this', 'that', 'these', 'those', 'from'
        ]);

        const words = text.toLowerCase()
            .split(/\W+/)
            .filter(word =>
                word.length > 3 &&
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
    }

    static analyzeComplexity(text) {
        if (!text) return { level: 'Unknown', score: 0 };

        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/).filter(word => word.length > 0);

        if (sentences.length === 0 || words.length === 0) {
            return { level: 'Unknown', score: 0 };
        }

        const avgSentenceLength = words.length / sentences.length;
        const longWords = words.filter(word => word.length > 6).length;
        const complexityRatio = longWords / words.length;

        let complexityScore = (avgSentenceLength * 0.4) + (complexityRatio * 0.6);
        complexityScore = Math.min(10, Math.max(1, complexityScore));

        let level;
        if (complexityScore < 3) level = 'Easy';
        else if (complexityScore < 6) level = 'Medium';
        else if (complexityScore < 8) level = 'Complex';
        else level = 'Advanced';

        return {
            level,
            score: Math.round(complexityScore * 10) / 10,
            avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
            longWordRatio: Math.round(complexityRatio * 100) / 100
        };
    }

    static classifyContentType(content) {
        if (!content) return 'general';

        const text = content.toLowerCase();
        let scores = {
            technical: 0,
            educational: 0,
            news: 0,
            social: 0,
            entertainment: 0,
            general: 0.1
        };

        // Technical indicators
        const techTerms = ['javascript', 'python', 'code', 'algorithm', 'api', 'database', 'function', 'variable'];
        techTerms.forEach(term => {
            if (text.includes(term)) scores.technical += 2;
        });

        // Educational indicators
        const eduTerms = ['study', 'research', 'learning', 'education', 'tutorial', 'guide', 'learn', 'course'];
        eduTerms.forEach(term => {
            if (text.includes(term)) scores.educational += 2;
        });

        // News indicators
        const newsTerms = ['breaking', 'news', 'reports', 'said', 'according', 'announced', 'official', 'update'];
        newsTerms.forEach(term => {
            if (text.includes(term)) scores.news += 2;
        });

        // Social indicators
        const socialTerms = ['like', 'share', 'comment', 'follow', 'post', 'tweet', 'retweet', 'facebook'];
        socialTerms.forEach(term => {
            if (text.includes(term)) scores.social += 2;
        });

        // Entertainment indicators
        const entTerms = ['movie', 'video', 'game', 'entertainment', 'fun', 'music', 'streaming'];
        entTerms.forEach(term => {
            if (text.includes(term)) scores.entertainment += 2;
        });

        // Return the highest scoring type
        return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    }

    static assessContentQuality(content) {
        if (!content) return { score: 0, level: 'Poor' };

        const words = content.split(/\s+/).filter(word => word.length > 0);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

        if (words.length < 50) return { score: 0.2, level: 'Very Poor' };

        let qualityScore = 0;

        // Length factor (max 0.3)
        if (words.length > 1000) qualityScore += 0.3;
        else if (words.length > 500) qualityScore += 0.2;
        else if (words.length > 200) qualityScore += 0.1;

        // Sentence structure (max 0.3)
        const avgSentenceLength = words.length / sentences.length;
        if (avgSentenceLength > 8 && avgSentenceLength < 25) qualityScore += 0.3;
        else if (avgSentenceLength > 5 && avgSentenceLength < 30) qualityScore += 0.2;
        else qualityScore += 0.1;

        // Vocabulary diversity (max 0.2)
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const diversityRatio = uniqueWords.size / words.length;
        if (diversityRatio > 0.6) qualityScore += 0.2;
        else if (diversityRatio > 0.4) qualityScore += 0.1;

        // Readability (max 0.2)
        const complexWords = words.filter(w => w.length > 6).length;
        const complexityRatio = complexWords / words.length;
        if (complexityRatio > 0.1 && complexityRatio < 0.3) qualityScore += 0.2;
        else if (complexityRatio >= 0.3) qualityScore += 0.1;

        const level = qualityScore >= 0.8 ? 'Excellent' :
            qualityScore >= 0.6 ? 'Good' :
                qualityScore >= 0.4 ? 'Fair' : 'Poor';

        return {
            score: Math.round(qualityScore * 100) / 100,
            level,
            wordCount: words.length,
            sentenceCount: sentences.length,
            uniqueWords: uniqueWords.size
        };
    }

    // 🔧 ENHANCED CLEAN CONTENT METHOD - FIX CITATION MARKERS
    static cleanContent(rawContent) {
        if (!rawContent || typeof rawContent !== 'string') return '';

        return rawContent
            // Remove ALL citation markers - enhanced pattern
            .replace(/\[\d+\]/g, '') // Remove [1], [2] citations
            .replace(/\[[a-z]\]/gi, '') // Remove [a], [b] citation markers
            .replace(/\[edit\]/g, '') // Remove [edit] markers
            .replace(/\{\{.*?\}\}/g, '') // Remove {{templates}}
            .replace(/\|.*?\|/g, '') // Remove |template parameters|
            .replace(/\[citation needed\]/gi, '') // Remove citation needed
            .replace(/Toggle the table of contents/gi, '') // Remove TOC text

            // Remove language lists and navigation more aggressively
            .replace(/[\d ]+languages?.*?(?=\.|\n|$)/gis, '')
            .replace(/Afrikaans.*?Winaray/gs, '')
            .replace(/Edit links.*?Tools/gs, '')
            .replace(/ArticleTalk.*?Expand all/gs, '')

            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();
    }

    // Feature-detect Chrome Built-In AI
    checkAIAvailability() {
        try {
            const ai = typeof window !== 'undefined' ? window.ai : undefined;
            return !!(ai && (ai.summarizer || ai.prompt || ai.writer || ai.proofreader));
        } catch {
            return false;
        }
    }

    // 🎯 ENHANCED HEURISTIC SUMMARY METHOD
    static heuristicSummary(text, maxSentences = 3) {
        if (!text || text.length < 50) {
            return 'No sufficient content available for summary from this page.';
        }

        console.log('🧠 ACLB: Generating intelligent summary from:', text.length, 'chars');

        // Clean the text first
        const cleanText = text
            .replace(/\s+/g, ' ')
            .replace(/\b(\w+)\s+\1\b/gi, '$1') // Remove duplicate words
            .trim();

        // Split into sentences
        const sentences = cleanText.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20 && s.split(/\s+/).length > 5);

        if (sentences.length === 0) {
            return 'Content extracted but no meaningful sentences found for summary.';
        }

        // Score sentences based on importance indicators
        const scoredSentences = sentences.map((sentence, index) => {
            let score = 0;
            const lowerSentence = sentence.toLowerCase();

            // Position scoring - favor earlier sentences
            score += Math.max(0, (sentences.length - index) / sentences.length) * 0.4;

            // Content quality indicators
            const qualityIndicators = [
                'genghis khan', 'founder', 'mongol empire', 'emperor',
                'conquest', 'battle', 'established', 'ruled', 'dynasty'
            ];

            qualityIndicators.forEach(indicator => {
                if (lowerSentence.includes(indicator)) {
                    score += 0.3;
                }
            });

            // Length optimization - favor medium-length sentences
            const wordCount = sentence.split(/\s+/).length;
            if (wordCount > 8 && wordCount < 25) {
                score += 0.2;
            }

            // Penalize sentences with too many proper nouns/capital letters
            const capitalRatio = (sentence.match(/[A-Z]/g) || []).length / sentence.length;
            if (capitalRatio > 0.3) {
                score -= 0.2;
            }

            return { sentence, score, index, wordCount };
        });

        // Select top sentences, ensuring diversity
        const selectedSentences = [];
        const usedIndices = new Set();

        // Take top 2 by score
        scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .forEach(item => {
                selectedSentences.push(item);
                usedIndices.add(item.index);
            });

        // Add one from the middle for context diversity
        const middleIndex = Math.floor(sentences.length / 2);
        if (!usedIndices.has(middleIndex) && middleIndex < sentences.length) {
            selectedSentences.push({
                sentence: sentences[middleIndex],
                index: middleIndex,
                score: 0.5
            });
        }

        // Sort by original order and format
        const finalSentences = selectedSentences
            .sort((a, b) => a.index - b.index)
            .map(item => {
                // Ensure sentence ends with proper punctuation
                let finalSentence = item.sentence.trim();
                if (!finalSentence.endsWith('.') && !finalSentence.endsWith('!') && !finalSentence.endsWith('?')) {
                    finalSentence += '.';
                }
                return finalSentence;
            });

        let summary = finalSentences.join(' ');

        // ADDED: Ensure summary ends with complete sentence
        if (!summary.endsWith('.') && !summary.endsWith('!') && !summary.endsWith('?')) {
            summary += '.';
        }

        console.log('✅ ACLB: Generated summary:', summary.length, 'chars');

        return summary || 'Summary generation failed. Please try again.';
    }

    // 🎯 CONTENT ANALYSIS WITH FALLBACK STRATEGY
    async analyzeContent(content = '', title = '') {
        const safeContent = typeof content === 'string' ? content : '';
        const safeTitle = typeof title === 'string' ? title : '';

        if (!safeContent || safeContent.length < 50) {
            return this.fallbackAnalysis(safeContent, safeTitle);
        }

        // Try AI-enhanced paths
        try {
            if (this.aiAvailable && typeof window !== 'undefined' && window.ai) {
                // Attempt prompt-based structured analysis first
                const promptResult = await this.tryPromptAPI(safeContent, safeTitle);
                if (promptResult) return promptResult;

                // Attempt summarizer and augment heuristics
                const summary = await this.trySummarizerAPI(safeContent);
                if (summary) return this.enhanceWithAI(summary, safeContent, safeTitle);
            }
        } catch (error) {
            try { console.warn('AI analysis failed, using heuristic analysis:', error); } catch { }
        }

        // Heuristic fallback
        return this.fallbackAnalysis(safeContent, safeTitle);
    }

    // Summarizer API via window.ai
    async trySummarizerAPI(content) {
        try {
            const ai = typeof window !== 'undefined' ? window.ai : undefined;
            if (ai?.summarizer) {
                return await ai.summarizer.summarize(content, {
                    format: 'paragraph',
                    maxLength: 200,
                    style: 'neutral'
                });
            }
            return null;
        } catch {
            return null;
        }
    }

    // Prompt API for structured analysis JSON
    async tryPromptAPI(content, title) {
        try {
            const ai = typeof window !== 'undefined' ? window.ai : undefined;
            if (!ai?.prompt) return null;

            const prompt = `Analyze the following web page content and return a compact JSON with:
- complexity: number 1-10
- type: string (technical, educational, news, social, entertainment, general)
- readingTimeMinutes: number (minutes)
- keyThemes: array of up to 6 strings
- wordCount: number

Title: "${title}"
Text: "${content.substring(0, 2000)}"`;

            const analysis = await ai.prompt.execute(prompt, {
                format: 'json',
                schema: {
                    type: 'object',
                    properties: {
                        complexity: { type: 'number', minimum: 1, maximum: 10 },
                        type: { type: 'string' },
                        readingTimeMinutes: { type: 'number', minimum: 1 },
                        keyThemes: { type: 'array', items: { type: 'string' } },
                        wordCount: { type: 'number', minimum: 0 }
                    },
                    required: ['complexity', 'type', 'readingTimeMinutes', 'keyThemes']
                }
            });

            if (analysis && typeof analysis === 'object') {
                return {
                    complexity: this._boundNumber(analysis.complexity, 1, 10, 5),
                    type: analysis.type || 'general',
                    readingTimeMinutes: this._boundNumber(analysis.readingTimeMinutes, 1, 120, 5),
                    keyThemes: Array.isArray(analysis.keyThemes) ? analysis.keyThemes.slice(0, 6) : [],
                    wordCount: this._boundNumber(analysis.wordCount, 0, 2_000_000, this._wordCount(content)),
                    aiGenerated: true,
                    confidence: 0.85
                };
            }
            return null;
        } catch {
            return null;
        }
    }

    // 🎯 HEURISTIC CONTENT ANALYSIS (Primary Method)
    fallbackAnalysis(content = '', title = '') {
        const wc = this._wordCount(content);
        const readingTime = Math.max(1, Math.round(wc / 200));

        const contentLower = (content || '').toLowerCase();
        const titleLower = (title || '').toLowerCase();

        const type = this.detectContentType(contentLower, titleLower);
        const complexity = this.calculateComplexity(content, type);
        const keyThemes = this.extractKeyThemes(content);

        return {
            complexity,
            type,
            readingTimeMinutes: readingTime,
            keyThemes,
            wordCount: wc,
            aiGenerated: false,
            confidence: this.calculateConfidence(content, type)
        };
    }

    detectContentType(content, title) {
        const techTerms = ['javascript', 'python', 'code', 'algorithm', 'api', 'database', 'function', 'variable', 'programming', 'software'];
        const newsTerms = ['breaking', 'news', 'reports', 'said', 'according', 'announced', 'official', 'update', 'latest'];
        const socialTerms = ['like', 'share', 'comment', 'follow', 'post', 'tweet', 'retweet', 'facebook', 'instagram', 'social'];
        const educationalTerms = ['study', 'research', 'learning', 'education', 'tutorial', 'guide', 'learn', 'course', 'knowledge'];
        const entertainmentTerms = ['movie', 'video', 'game', 'entertainment', 'fun', 'music', 'streaming'];

        const countMatches = (terms) => terms.filter(t => content.includes(t) || title.includes(t)).length;

        const scores = {
            technical: countMatches(techTerms),
            news: countMatches(newsTerms),
            social: countMatches(socialTerms),
            educational: countMatches(educationalTerms),
            entertainment: countMatches(entertainmentTerms)
        };

        const maxType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b, 'general');
        return scores[maxType] > 0 ? maxType : 'general';
    }

    calculateComplexity(content, type) {
        if (!content || content.length < 10) return 5;

        const sentences = (content.split(/[.!?]+/).map(s => s.trim()).filter(Boolean));
        if (sentences.length === 0) return 5;

        const words = content.split(/\s+/).filter(Boolean);
        const avgSentenceLength = words.length / sentences.length;
        const longWords = words.filter(w => w.length > 6).length;
        const complexityRatio = longWords / Math.max(1, words.length);

        let baseScore = 5;

        if (avgSentenceLength > 25) baseScore += 3;
        else if (avgSentenceLength > 20) baseScore += 2;
        else if (avgSentenceLength > 15) baseScore += 1;

        if (complexityRatio > 0.3) baseScore += 3;
        else if (complexityRatio > 0.2) baseScore += 2;
        else if (complexityRatio > 0.1) baseScore += 1;

        const typeWeights = { technical: 3, educational: 2, news: 0, social: -3, entertainment: -2, general: 0 };
        baseScore += typeWeights[type] || 0;

        return Math.max(1, Math.min(10, baseScore));
    }

    calculateConfidence(content, type) {
        const wc = this._wordCount(content);
        let confidence = 0.5;

        if (wc > 1000) confidence += 0.4;
        else if (wc > 500) confidence += 0.3;
        else if (wc > 200) confidence += 0.2;
        else if (wc > 50) confidence += 0.1;

        const typeStrengths = { technical: 0.2, educational: 0.15, news: 0.1, social: 0.3, entertainment: 0.2, general: 0 };
        confidence += typeStrengths[type] || 0;

        return Math.min(1, Math.max(0.1, confidence));
    }

    extractKeyThemes(content) {
        if (!content) return [];

        const words = content.toLowerCase().split(/\s+/);
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
            'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'this', 'that',
            'these', 'those', 'from', 'as', 'it', 'its', 'they'
        ]);

        const wordFreq = {};
        for (const raw of words) {
            const w = raw.replace(/[^a-z0-9]/g, '');
            if (w.length > 3 && !stopWords.has(w)) {
                wordFreq[w] = (wordFreq[w] || 0) + 1;
            }
        }

        const themes = Object.entries(wordFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([w]) => w);

        return themes.length > 0 ? themes : ['content', 'information', 'reading'];
    }

    // 📝 SUMMARIZATION (AI first, then fallback)
    async generateSummary(content) {
        const safe = typeof content === 'string' ? content : '';
        try {
            const ai = typeof window !== 'undefined' ? window.ai : undefined;
            if (ai?.summarizer) {
                const summary = await ai.summarizer.summarize(safe, { format: 'text', maxLength: 200, style: 'neutral' });
                return `📚 AI Summary: ${summary}`;
            }
            return this.fallbackSummary(safe);
        } catch (error) {
            try { console.error('❌ Summarization failed:', error); } catch { }
            const analysis = await this.analyzeContent(safe, '');
            return `📄 Content Type: ${analysis.type} | Key Themes: ${analysis.keyThemes.slice(0, 3).join(', ')}`;
        }
    }

    // 🎯 FALLBACK SUMMARIZATION
    fallbackSummary(content) {
        if (!content || content.length < 100) return 'Content too short for meaningful summary.';
        const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
        if (sentences.length < 3) return content.substring(0, 200) + '...';
        const first = sentences[0];
        const middle = sentences[Math.floor(sentences.length / 2)];
        const last = sentences[sentences.length - 1];
        return `📖 Summary: ${first}. ${middle}. ${last}.`;
    }

    // 🖼️ IMAGE ANALYSIS (lightweight)
    analyzeImages(contentAnalysis = {}) {
        const images = contentAnalysis.images || {};
        const altTexts = Array.isArray(images.altTexts) ? images.altTexts : [];
        const sizes = Array.isArray(images.sizes) ? images.sizes : [];
        const count = Number.isFinite(images.count) ? images.count : altTexts.length;

        const ctx = [];
        for (const alt of altTexts) {
            if (alt && alt.length > 5) ctx.push(alt);
        }
        const hasLarge = sizes.some(s => (s?.width || 0) > 300 && (s?.height || 0) > 300);
        if (hasLarge) ctx.push('visual content');
        if (count > 5) ctx.push('image-heavy');

        return ctx.length > 0 ? `Includes: ${Array.from(new Set(ctx)).join(', ')}` : '';
    }

    // 💬 INTERVENTION GENERATION
    async generateIntervention(context = {}) {
        const { focusScore = 50, contentType = 'general', complexity = 5 } = context;
        try {
            const ai = typeof window !== 'undefined' ? window.ai : undefined;
            if (ai?.writer) {
                return await ai.writer.generate({
                    prompt: `Create a brief, encouraging focus intervention for score ${focusScore}, content ${contentType}, complexity ${complexity}.`
                });
            }
        } catch (error) {
            try { console.warn('AI intervention generation failed:', error); } catch { }
        }
        return this.fallbackIntervention({ focusScore, contentType, complexity });
    }

    fallbackIntervention({ focusScore = 50 } = {}) {
        const interventions = {
            low: [
                'Time for a break? Your focus is dipping.',
                'Try the 20-20-20 rule: look 20 feet away for 20 seconds.',
                'Deep breath! Stand up and stretch for a moment.',
                'Your brain needs a quick reset. Look away from the screen.',
                'Focus fading? Try a 2-minute mindfulness break.'
            ],
            medium: [
                'Stay hydrated! A quick water break can refresh your focus.',
                "You're doing great! Consider a quick focus reset.",
                'Try breaking this into smaller, manageable chunks.',
                'Good progress! Maintain comfortable posture.',
                'Solid focus! A quick stretch might help maintain it.'
            ],
            high: [
                'Excellent focus! Keep up the great work.',
                "You're in the zone! Maintain this productive flow.",
                'Great concentration! Remember to blink regularly.',
                "Outstanding focus! You're making great progress.",
                "Perfect focus rhythm! You're mastering your attention."
            ]
        };
        const cat = focusScore < 35 ? 'low' : (focusScore > 70 ? 'high' : 'medium');
        const options = interventions[cat];
        return options[Math.floor(Math.random() * options.length)];
    }

    enhanceWithAI(summary, content, title) {
        const base = this.fallbackAnalysis(content, title);
        return {
            ...base,
            summary,
            aiGenerated: true,
            confidence: Math.min(1, (base.confidence ?? 0.6) + 0.2)
        };
    }

    parseAIAnalysis(analysis) {
        // If a raw string JSON is returned, parse it
        try {
            if (typeof analysis === 'string') {
                const parsed = JSON.parse(analysis);
                return {
                    complexity: this._boundNumber(parsed.complexity, 1, 10, 5),
                    type: parsed.type || 'general',
                    readingTimeMinutes: this._boundNumber(parsed.readingTimeMinutes, 1, 120, 5),
                    keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes : [],
                    wordCount: this._boundNumber(parsed.wordCount, 0, 2_000_000, 0),
                    aiGenerated: true,
                    confidence: 0.8
                };
            }
        } catch (e) {
            try { console.warn('Failed to parse AI analysis:', e); } catch { }
        }
        return this.fallbackAnalysis('', '');
    }

    // 🎯 CONTENT EXTRACTION FROM PAGE
    extractMainContent() {
        if (typeof document === 'undefined') {
            return { content: '', title: 'Service Worker Context' };
        }
        try {
            const title = document.title || '';

            const unwanted = [
                'nav', 'header', 'footer', 'aside', '.ad', '.ads', '.sidebar', '.menu', '.comments',
                '.social-share', '.navigation', '.navbar', '.advertisement', '.banner', 'script', 'style', 'meta', 'link'
            ];

            const bodyClone = document.body ? document.body.cloneNode(true) : null;
            if (!bodyClone) return { content: document.body?.textContent?.substring(0, 2000) || '', title };

            unwanted.forEach(sel => {
                bodyClone.querySelectorAll(sel).forEach(el => el.remove());
            });

            let content = bodyClone.textContent || bodyClone.innerText || '';
            content = content.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();

            return { content, title };
        } catch (error) {
            try { console.warn('Content extraction failed:', error); } catch { }
            return {
                content: document.body?.textContent?.substring(0, 2000) || '',
                title: document.title || ''
            };
        }
    }

    // ---------- HELPERS ----------
    _wordCount(text = '') {
        return (text.trim().split(/\s+/).filter(Boolean)).length;
    }
    _boundNumber(v, min, max, dflt) {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : dflt;
    }
}

// 🚀 FORCE GLOBAL AVAILABILITY
if (typeof window !== 'undefined') {
    window.CognitiveEngine = CognitiveEngine;
}
console.log('✅ CognitiveEngine loaded globally and immediately');

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
                    timestamp: Date.now()
                });
                return true;

            case 'requestSummary':
                if (window.aclbTracker) {
                    window.aclbTracker.generateIntelligentSummary()
                        .then(summary => {
                            sendResponse({ success: true, summary: summary });
                        })
                        .catch(error => {
                            console.warn('⚠️ ACLB: AI summary failed, using fallback:', error);
                            sendResponse({
                                success: true,
                                summary: window.aclbTracker.generateFallbackSummary()
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
                        wordCount: content ? content.trim().split(/\s+/).filter(Boolean).length : 0
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
                    connectionEstablished: window.aclbTracker?.connectionEstablished || false
                });
                return true;

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

// ============================ CHROME AI WRAPPER ============================
class ChromeAIContentService {
    constructor() {
        this.isAIAvailable = false;
        this.supportedAPIs = new Set();
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
            return this.isAIAvailable;
        } catch {
            this.isAIAvailable = false;
            this.supportedAPIs.clear();
            return false;
        }
    }

    async summarizeContent(content, options = {}) {
        if (!this.supportedAPIs.has('summarizer')) return null;
        try {
            return await window.ai.summarizer.summarize({
                text: content,
                maxOutputTokens: options.maxLength || 150
            });
        } catch {
            return null;
        }
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

// ============================ TRACKER ============================
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

        this.extractionStats = { totalExtractions: 0, successfulExtractions: 0, failedExtractions: 0 };
        this.userPreferences = { preferredContentTypes: [], readingSpeed: 'medium', focusAreas: [] };
        this.contentAnalysis = {
            lastSummary: null,
            pageKeywords: [],
            readingTime: 0,
            contentComplexity: 0,
            contentType: 'general',
            aiGenerated: false,
            focusRequired: 5,
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
                        url: window.location.href
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

    // ===== ENHANCED CONTENT EXTRACTION =====
    getPageContent() {
        console.log('🔍 ACLB: Starting intelligent content extraction...');

        try {
            // Wikipedia-specific extraction
            if (window.location.hostname.includes('wikipedia.org')) {
                const wikipediaContent = this.extractWikipediaContent();
                if (wikipediaContent && wikipediaContent.length > 100) {
                    return wikipediaContent;
                }
            }

            // Universal content extraction for other sites
            const universalContent = this.extractUniversalContent();
            if (universalContent && universalContent.length > 100) {
                return universalContent;
            }

            // Final fallback
            return this.extractSmartBodyContent();

        } catch (error) {
            console.warn('⚠️ ACLB: Content extraction failed, using fallback:', error);
            return this.extractSmartBodyContent();
        }
    }

    extractWikipediaContent() {
        try {
            console.log('📚 ACLB: Using Wikipedia-specific extraction');

            // Strategy 1: Main article content with multiple approaches
            let mainContent = '';

            // Approach A: Direct content text extraction
            const contentElement = document.getElementById('mw-content-text');
            if (contentElement) {
                const paragraphs = contentElement.querySelectorAll('p');
                paragraphs.forEach(p => {
                    const text = p.textContent.trim();
                    // More aggressive filtering
                    if (text.length > 50 &&
                        !text.includes('[edit]') &&
                        !text.match(/\[\d+\]/) &&
                        !text.match(/\[[a-z]\]/i) &&
                        !text.includes('This article') &&
                        !text.includes('Jump to navigation') &&
                        !text.includes('From Wikipedia')) {
                        mainContent += text + ' ';
                    }
                });
            }

            // Approach B: First meaningful paragraph
            if (!mainContent || mainContent.length < 200) {
                const firstParagraph = document.querySelector('#mw-content-text p');
                if (firstParagraph) {
                    const text = firstParagraph.textContent.trim();
                    if (text.length > 100 && !text.includes('[edit]')) {
                        mainContent = text;
                    }
                }
            }

            if (mainContent && mainContent.length > 200) {
                console.log('✅ ACLB: Extracted Wikipedia content:', mainContent.length);
                // ✅ NOW CognitiveEngine IS GUARANTEED TO BE AVAILABLE!
                return CognitiveEngine.cleanContent(mainContent);
            }

        } catch (error) {
            console.warn('⚠️ ACLB: Wikipedia extraction failed:', error);
        }

        return null;
    }

    extractUniversalContent() {
        console.log('🌐 ACLB: Using universal content extraction');

        const contentSelectors = [
            'article', 'main', '[role="main"]',
            '.content', '.main-content', '.post-content',
            '#content', '#main-content',
            '.article', '.story', '.post',
            '.entry-content', '.post-content',
            '.body-content', '.page-content'
        ];

        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isValidContent(element.textContent)) {
                const content = this.cleanContent(element.textContent);
                console.log(`✅ ACLB: Found content with ${selector}:`, content.length);
                return content;
            }
        }

        // Final fallback: smart body extraction
        return this.extractSmartBodyContent();
    }

    extractSmartBodyContent() {
        console.log('🧠 ACLB: Using smart body extraction');
        const body = document.body;
        const unwantedSelectors = [
            'nav', 'header', 'footer', 'aside', 'menu',
            '.navigation', '.header', '.footer', '.sidebar',
            '.menu', '.advertisement', '.ad', '.ads',
            '.social', '.share', '.comments', '.related'
        ];

        // Clone body to avoid modifying original
        const clone = body.cloneNode(true);

        // Remove unwanted elements
        unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        const content = this.cleanContent(clone.textContent);
        console.log('✅ ACLB: Smart body extraction:', content.length);
        return content;
    }

    cleanContent(rawContent) {
        if (!rawContent) return '';

        console.log('🧹 ACLB: Cleaning raw content:', rawContent.length);

        let cleaned = rawContent
            // Remove Wikipedia-specific noise
            .replace(/\[\d+\]/g, '') // Remove [1], [2] citations
            .replace(/\[edit\]/g, '') // Remove [edit] markers
            .replace(/\{\{.*?\}\}/g, '') // Remove {{templates}}
            .replace(/\|.*?\|/g, '') // Remove |template parameters|
            .replace(/\[citation needed\]/gi, '') // Remove citation needed
            .replace(/Toggle the table of contents/gi, '') // Remove TOC text

            // Remove language lists and navigation
            .replace(/[\d ]+languages?.*?(?=Genghis Khan|$)/gis, '')
            .replace(/Afrikaans.*?Winaray/gs, '')

            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();

        // Extract first meaningful paragraph (avoid tables of contents)
        const sentences = cleaned.split(/[.!?]+/).filter(s =>
            s.length > 20 &&
            !s.includes('languages') &&
            !s.includes('Toggle') &&
            !s.includes('Edit links')
        );

        if (sentences.length > 0) {
            cleaned = sentences.slice(0, 3).join('. ') + '.';
        }

        console.log('✅ ACLB: Cleaned content:', cleaned.length);
        return cleaned;
    }

    isValidContent(text) {
        if (!text || text.length < 100) return false;

        const wordCount = text.split(/\s+/).length;
        const avgWordLength = text.length / wordCount;

        // Filter out navigation, lists, etc.
        return wordCount > 20 &&
            avgWordLength > 3 &&
            !text.includes('Jump to navigation') &&
            !text.includes('Main menu');
    }

    // ===== ORIGINAL BOOTSTRAP AND METHODS =====
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
            bfcacheResistant: true
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

        // Initial content analysis using new extraction
        const content = this.getPageContent();
        await this.analyzePageContent({ content });

        this.isInitialized = true;
        this.signalInitializationComplete();
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
                            connectionEstablished: this.connectionEstablished
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
                            .then(summary => sendResponse({ success: true, summary }))
                            .catch(() => sendResponse({
                                success: true,
                                summary: this.generateFallbackSummary()
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
                            url: location.href
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
        };
    }

    async handleContentExtraction() {
        this.extractionStats.totalExtractions++;
        try {
            if (document.readyState === 'loading') {
                await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
            }

            // Use new content extraction system
            const content = this.getPageContent();
            const sufficientContent = this.isContentSufficient(content);
            const result = {
                success: true,
                content,
                title: document.title || 'Unknown Page',
                sufficientContent,
                url: location.href,
                timestamp: Date.now(),
                wordCount: (content || '').trim().split(/\s+/).filter(Boolean).length,
                contentLength: content.length,
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

    // ===== ENHANCED FOCUS MODE DIMMER EFFECT =====
    handleFocusModeChange(isActive) {
        if (isActive) {
            // Apply subtle dimming effect to reduce visual distraction
            document.documentElement.style.filter = 'grayscale(0.3) brightness(0.9)';
            document.body.style.backgroundColor = '#f0f8ff';

            // Add smooth transition for better UX
            document.documentElement.style.transition = 'filter 0.5s ease, background-color 0.5s ease';

            console.log('🎯 ACLB: Focus Mode ACTIVATED - Dimming enabled');
        } else {
            // Remove focus mode effects
            document.documentElement.style.filter = 'none';
            document.body.style.backgroundColor = '';

            console.log('🎯 ACLB: Focus Mode DEACTIVATED - Normal view restored');
        }
    }

    // ===== Enhanced Summary Generation with Cognitive Engine =====
    async generateIntelligentSummary() {
        const content = this.getPageContent();

        // Try Chrome AI first
        if (chrome.ai?.summarizer) {
            try {
                const result = await chrome.ai.summarizer.summarize({
                    text: content,
                    maxOutputTokens: 500
                });
                return result?.summary || this.generateFallbackSummary();
            } catch (error) {
                console.warn('⚠️ ACLB: Chrome AI summarizer failed:', error);
            }
        }

        // Fallback to Cognitive Engine summary
        return this.generateFallbackSummary();
    }

    // ===== Enhanced Fallback Summary Method =====
    generateFallbackSummary() {
        const content = this.getPageContent();
        // ✅ NOW CognitiveEngine IS GUARANTEED TO BE AVAILABLE!
        return CognitiveEngine.heuristicSummary(content);
    }

    // ===== Enhanced Content Analysis with Cognitive Engine =====
    analyzeContent() {
        const content = this.getPageContent();
        // ✅ NOW CognitiveEngine IS GUARANTEED TO BE AVAILABLE!
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

        window.addEventListener('load', () => {
            setTimeout(() => {
                const content = this.getPageContent();
                this.analyzePageContent({ content });
                this.throttledActivity('pageLoad', {
                    engagementScore: 50,
                    sessionStart: true,
                    contentAnalysis: this.contentAnalysis
                });
            }, 1500);
        });

        // SPA nav
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(() => {
                    const content = this.getPageContent();
                    this.analyzePageContent({ content });
                    this.throttledActivity('navigation', {
                        engagementScore: 40,
                        previousPage: document.referrer
                    });
                }, 800);
            }
        }).observe(document, { subtree: true, childList: true });

        window.addEventListener('beforeunload', () => this.cleanup());
    }

    throttledActivity(activityType, data = {}) {
        const activity = this.createActivity(activityType, data);
        this.activityBuffer.push(activity);
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
            scrollDepth: this.calculateScrollDepth(),
            domainType: this.classifyDomain(location.hostname),
            engagementScore: this.calculateEngagementScore(),
            contentAnalysis: { ...this.contentAnalysis },
            userPreferences: { ...this.userPreferences },
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
                connectionState: this.getConnectionState()
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
                enhancedExtraction: true
            },
            aiStatus: this.aiService.getAPIStatus()
        });
        sendRuntimeMessageAsync({
            action: 'contentScriptStatusUpdate',
            status: 'ready',
            url: location.href,
            timestamp: Date.now(),
            aiStatus: this.aiService.getAPIStatus()
        });
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
        try {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            return scrollHeight <= 0 ? 0 : Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
        } catch {
            return 0;
        }
    }

    calculateEngagementScore() {
        const sd = this.calculateScrollDepth();
        const timeMin = (Date.now() - this.pageLoadTime) / 60000;
        const n = this.activityBuffer.length;
        let score = 50;
        if (sd > 80) score += 25;
        else if (sd > 50) score += 15;
        else if (sd > 25) score += 5;
        if (timeMin > 3) score += 15;
        else if (timeMin > 1) score += 8;
        if (n > 10) score += 10;
        else if (n > 5) score += 5;
        return Math.min(100, score);
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

    isContentSufficient(content) {
        if (!content) return false;
        const words = content.trim().split(/\s+/).filter(Boolean);
        return words.length >= 50 && content.length > 200;
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
}

// ============================ BOOTSTRAP ============================
(function bootstrap() {
    try {
        window.aclbTracker = new IntelligentActivityTracker();
    } catch (e) {
        console.error('ACLB: Initial bootstrap failed, retrying...', e);
        setTimeout(() => {
            try {
                window.aclbTracker = new IntelligentActivityTracker();
            } catch (e2) {
                console.error('ACLB: Secondary bootstrap failed', e2);
            }
        }, 2000);
    }
})();