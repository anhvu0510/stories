// ==UserScript==
// @name         Smart Content Reader - Dark Mode
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Trích xuất và hiển thị nội dung trang web với UI đẹp và dark mode
// @author       VuLA
// @match        *://*/*
// @exclude      *://localhost*
// @exclude      *://127.0.0.1*
// @exclude      *://192.168.*
// @exclude      *://10.*
// @exclude      *://172.*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Prevent multiple loading
    if (window.SmartContentReader) {
        return;
    }

    const VERSION = '1.0.0';

    const settingConfig = {
        fontSize: 18,
        lineHeight: 1.8,
        wordSpacing: 4,
        sentencesPerParagraph: 3,
        selectors: [
            '#chapter-content',
            '.entry-content',
            '.ndtruyen'
        ]
    }
    // Replacement rules
    const replacements = [
        { search: /\."/g, replace: '".' },
        { search: /\.”/g, replace: '”.' },
        { search: /\·/g, replace: '' },
        { search: /\!/g, replace: '.' },
        { search: /\?/g, replace: ' ' },
        { search: /\s+/g, replace: ' ' },
        { search: /^\s+|\s+$/g, replace: ' ' },
        { search: /(?:\s*\.\s*){2,}/g, replace: '.' },
        { search: /tr\.a/g, replace: 'tra' },
        { search: /ɭϊếʍƈ/g, replace: 'liếm' },
        { search: /hϊế͙p͙/g, replace: 'hiếp' },
        { search: /(\p{L})\.(?=\p{L}(?![\s.!?])(?<![A-Z]))/gu, replace: '$1' },
    ];

    function processTextIntoParagraphs(text, sentencesPerParagraph = 3) {
        if (!text || typeof text !== 'string') {
            console.error('Invalid text input');
            return document.createDocumentFragment();
        }
        console.log('text', text);

        // Apply all replacements
        let processed = text;
        for (const { search, replace } of replacements) {
            processed = processed.replace(search, replace);
        }

        // Split text by newlines, trim each line, and filter out empty lines
        const lines = splitSentences(processed)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Create a container div to hold the paragraphs
        const fragment = document.createElement('div');

        // Group sentences into paragraphs and create <p> nodes
        for (let i = 0; i < lines.length; i += sentencesPerParagraph) {
            const group = lines.slice(i, i + sentencesPerParagraph).join(' ');
            const p = document.createElement('p');
            p.textContent = group;
            fragment.appendChild(p);
        }

        return fragment;
    }

    // Hàm tách câu từ text đầu vào
    function splitSentences(text) {
        if (!text || typeof text !== 'string') return [];
        const sentenceRegex = /[^.:]+[.!?…]*/g;
        const matches = text.match(sentenceRegex);
        return matches 
            ? matches
                .map(sentence => sentence.trim())
                .filter(sentence => sentence.length > 1) 
            : [];
    }

    class SmartContentReader {
        constructor() {
            this.version = VERSION;
            this.overlay = null;
            this.isLoaded = false;
            this.currentTheme = 'dark';
            this.settingConfig = settingConfig || {};
            console.log(`📖 Smart Content Reader v${VERSION} loaded`);

        }

        // Initialize the reader system
        init() {
            if (this.isLoaded) return;
            
            this.addStyles();
            this.createOverlay();
            this.bindEvents();
            this.isLoaded = true;
            
            console.log('✅ Smart Content Reader initialized');
            return this;
        }

        addStyles() {
            const css = `
                /* Smart Content Reader Styles */
                .scr-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    backdrop-filter: blur(10px);
                    z-index: 999999;
                    display: none;
                    opacity: 0;
                    transition: all 0.3s ease;
                    padding: 0;
                    // background-color: #121a26 !important;
                    color: #a0aab8 !important;
                }

                .scr-overlay.active {
                    opacity: 1;
                }

                .scr-modal {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    background: #1a1a1a;
                    border-radius: 0;
                    overflow: hidden;
                    box-shadow: none;
                    display: flex;
                    flex-direction: column;
                    border: none;
                    position: relative;
                }

                .scr-close-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    background: rgba(239, 68, 68, 0.9);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                    z-index: 1001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                }

                .scr-close-btn:hover {
                    background: rgba(239, 68, 68, 1);
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .scr-content {
                    flex: 1;
                    overflow: auto;
                    position: relative;
                    padding: 0;
                    height: 100vh;
                }

                .scr-reader {
                    font-weight: 400;
                    padding: 60px 40px 40px 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: 'Palatino Linotype','Georgia', 'Times New Roman', serif !important;
                    line-height: 1.8;
                    background: transparent !important;
                    color: #a0aab8 !important;
                    background-color: #121a26 !important;
                    min-height: calc(100vh - 100px);
                }

                .scr-reader h1, .scr-reader h2, .scr-reader h3, 
                .scr-reader h4, .scr-reader h5, .scr-reader h6 {
                    color: #ffffff;
                    margin-bottom: 15px;
                    font-weight: 600;
                }

                .scr-reader h1 { font-size: 2.2em; }
                .scr-reader h2 { font-size: 1.8em; }
                .scr-reader h3 { font-size: 1.5em; }

                .scr-reader p {
                    margin-bottom: 20px;
                    text-align: justify;
                    font-size: ${this.settingConfig.fontSize}px !important;
                    word-spacing: ${this.settingConfig.wordSpacing}px !important;
                    line-height: ${this.settingConfig.lineHeight} !important;
                }

                .scr-reader img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 30px auto;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .scr-reader blockquote {
                    border-left: 4px solid #667eea;
                    margin: 20px 0;
                    padding: 15px 20px;
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 0 8px 8px 0;
                    font-style: italic;
                }

                .scr-reader code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 0.9em;
                }

                .scr-reader pre {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 8px;
                    overflow-x: auto;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .scr-reader ul, .scr-reader ol {
                    padding-left: 30px;
                    margin-bottom: 20px;
                }

                .scr-reader li {
                    margin-bottom: 8px;
                }

                .scr-reader a {
                    color: #667eea;
                    text-decoration: none;
                    border-bottom: 1px dotted #667eea;
                    transition: color 0.2s ease;
                }

                .scr-reader a:hover {
                    color: #8b5cf6;
                    border-bottom-color: #8b5cf6;
                }

                .scr-floating-btn {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 999998;
                    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .scr-floating-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
                }

                .scr-floating-btn.hidden {
                    opacity: 0.3;
                    transform: scale(0.8);
                }

                .scr-loading {
                    display: none;
                    justify-content: center;
                    align-items: center;
                    height: 200px;
                    flex-direction: column;
                    gap: 20px;
                    color: #e5e5e5;
                }

                .scr-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(102, 126, 234, 0.3);
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .scr-status {
                    position: fixed;
                    top: 20px; /* Adjusted to be closer to the top */
                    left: 50%; /* Center horizontally */
                    transform: translateX(-50%); /* Center alignment */
                    padding: 12px 18px;
                    border-radius: 10px;
                    color: white;
                    font-size: 0.9em;
                    z-index: 1000;
                    display: none;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                }

                .scr-status.success {
                    background: rgba(34, 197, 94, 0.9);
                }

                .scr-status.error {
                    background: rgba(239, 68, 68, 0.9);
                }

                .scr-status.info {
                    background: rgba(59, 130, 246, 0.9);
                }

                /* Light theme */
                .scr-modal.light {
                    background: #ffffff;
                    border-color: #e5e5e5;
                }

                .scr-modal.light .scr-reader {
                    background: #ffffff;
                    color: #2d3748;
                }

                .scr-modal.light .scr-reader h1,
                .scr-modal.light .scr-reader h2,
                .scr-modal.light .scr-reader h3,
                .scr-modal.light .scr-reader h4,
                .scr-modal.light .scr-reader h5,
                .scr-modal.light .scr-reader h6 {
                    color: #1a202c;
                }

                .scr-modal.light .scr-reader blockquote {
                    background: rgba(102, 126, 234, 0.1);
                }

                .scr-modal.light .scr-reader code {
                    background: rgba(0, 0, 0, 0.1);
                }

                .scr-modal.light .scr-reader pre {
                    background: rgba(0, 0, 0, 0.05);
                    border-color: rgba(0, 0, 0, 0.1);
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .scr-modal {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                    }
                    .scr-content { 
                         scrollbar-width: none;
                    }

                    .scr-reader {
                           word-spacing: 4px;
                           text-align: justify;
                           line-height: 2;
                            padding: 15px;
                            min-height: calc(100vh - 120px);
                    }

                    .scr-close-btn {
                            top: 15px;
                            right: 25px;
                            width: 20px;
                            height: 20px;
                            font-size: 12px;
                            font-weight: bolder;
                    }

                    .scr-floating-btn {
                            top: 20px;
                            left: 20px;
                            width: 30px;
                            height: 30px;
                            font-size: 15px;
                    }

                    .scr-status {
                        top: 30px;
                        right: 15px;
                        padding: 10px 15px;
                        font-size: 0.8em;
                    }
                }

                /* Scrollbar styling */
                .scr-content::-webkit-scrollbar {
                    width: 8px;
                }

                .scr-content::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                }

                .scr-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                }

                .scr-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            `;

            const style = document.createElement('style');
            style.id = 'scr-styles';
            style.textContent = css;
            document.head.appendChild(style);
        }

        createOverlay() {
            // Create overlay
            this.overlay = document.createElement('main');
            this.overlay.className = 'scr-overlay';
            this.overlay.setAttribute('role', 'contents');
            this.overlay.setAttribute('aria-label', 'contents');
            this.overlay.setAttribute('aria-hidden', 'false');
           
            this.overlay.innerHTML = `
                <div class="scr-modal ${this.currentTheme}">
                    <button class="scr-close-btn" id="scr-close" title="Đóng">
                        ✕
                    </button>
                    <div class="scr-content">
                        <div class="scr-loading" id="scr-loading">
                            <div class="scr-spinner"></div>
                            <div>Đang trích xuất nội dung...</div>
                        </div>
                        <div class="scr-status" id="scr-status"></div>
                        <div class="scr-reader" id="scr-reader"></div>
                    </div>
                </div>
            `;
            document.body.insertBefore(this.overlay, document.body.firstChild);

            // Create floating button
            const floatingBtn = document.createElement('button');
            floatingBtn.className = 'scr-floating-btn';
            floatingBtn.innerHTML = '📖';
            floatingBtn.title = 'Smart Content Reader - Đọc nội dung trang hiện tại';
            floatingBtn.id = 'scr-floating-btn';
            document.body.insertBefore(floatingBtn, document.body.firstChild);
        }

        bindEvents() {
            const floatingBtn = document.getElementById('scr-floating-btn');
            const closeBtn = document.getElementById('scr-close');
            const settingsBtn = document.getElementById('scr-settings');
            const settingsModal = document.getElementById('scr-settings-modal');
            const settingsBackdrop = document.getElementById('scr-settings-backdrop');
            const saveSettingsBtn = document.getElementById('scr-save-settings');
            const cancelSettingsBtn = document.getElementById('scr-cancel-settings');

            console.log('Settings button found:', settingsBtn);
            console.log('Settings modal found:', settingsModal);

            floatingBtn?.addEventListener('click', () => this.extractContent());
            closeBtn?.addEventListener('click', () => this.close());
            settingsBtn?.addEventListener('click', () => {
                console.log('Settings button clicked!');
                this.toggleSettingsModal();
            });
            settingsBackdrop?.addEventListener('click', () => this.closeSettingsModal());
            saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
            cancelSettingsBtn?.addEventListener('click', () => this.closeSettingsModal());

            // Close on overlay click
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });

            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                    this.close();
                }
                
                // Ctrl + Shift + R to open reader
                if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                    e.preventDefault();
                    if (this.overlay.classList.contains('active')) {
                        this.close();
                    } else {
                        this.extractContent();
                    }
                }
            });

            // Auto-hide floating button on scroll
            let scrollTimeout;
            document.addEventListener('scroll', () => {
                floatingBtn?.classList.add('hidden');
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    floatingBtn?.classList.remove('hidden');
                }, 1000);
            });
        }

        extractContent() {
            try {
                this.showLoading();
                this.show();
                this.settingConfig = settingConfig || {};

                // Extract main content from current page
                const mainContent = this.findMainContent();

                if (mainContent) {
                    // Clean and display content
                    const buildHTML = processTextIntoParagraphs(mainContent.innerText, this.settingConfig.sentencesPerParagraph);
                    console.log('Processed content:', buildHTML);
                    this.displayContent(buildHTML);

                    // Set modal content as priority for read-aloud
                    const reader = document.getElementById('scr-reader');
                    if (reader) {
                        reader.setAttribute('aria-live', 'polite');
                        reader.setAttribute('role', 'document');
                    }

                    mainContent.setAttribute('aria-hidden', 'true');
                    mainContent.setAttribute('tabindex', '-1');

                    this.hideLoading();
                    this.showStatus('✅ Trích xuất thành công', 'success');
                } else {
                    this.hideLoading();
                    this.showStatus('❌ Không tìm thấy nội dung chính', 'error');
                }

            } catch (error) {
                console.error('Smart Content Reader extraction failed:', error);
                this.hideLoading();
                this.showStatus('❌ Lỗi trích xuất nội dung', 'error');
            }
        }

        findMainContent() {
            // Common selectors for main content
            const selectors = this.settingConfig.selectors || []
            // Try each selector
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && this.hasSignificantTextContent(element)) {
                    return element;
                }
            }

            // Fallback: find the largest text block
            return this.findLargestTextBlock();
        }

        hasSignificantTextContent(element) {
            const text = element.textContent || '';
            return text.trim().length > 200; // At least 200 characters
        }

        findLargestTextBlock() {
            const candidates = document.querySelectorAll('div, section, article');
            let bestCandidate = null;
            let maxTextLength = 0;

            candidates.forEach(element => {
                // Skip if element contains mostly non-text content
                const scripts = element.querySelectorAll('script, style, nav, header, footer');
                if (scripts.length > element.children.length / 2) return;

                const textLength = (element.textContent || '').trim().length;
                if (textLength > maxTextLength) {
                    maxTextLength = textLength;
                    bestCandidate = element;
                }
            });

            return bestCandidate;
        }

        cleanContent(element) {
            // Clone the element to avoid modifying the original
            const clone = element.cloneNode(true);
            console.log('🧼 Cleaning content...', clone.innerText);
            // Remove unwanted elements
            const unwantedSelectors = [
                'script', 'style', 'nav', 'header', 'footer', 'aside',
                '.advertisement', '.ads', '.ad', '.sponsor',
                '.social-share', '.comments', '.comment',
                '.sidebar', '.menu', '.navigation',
                'iframe[src*="ads"]', 'iframe[src*="doubleclick"]'
            ];

            unwantedSelectors.forEach(selector => {
                const elements = clone.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            // Clean up attributes that might interfere with styling
            const allElements = clone.querySelectorAll('*');
            allElements.forEach(el => {
                // Keep essential attributes only
                const keepAttrs = ['href', 'src', 'alt', 'title'];
                const attrs = Array.from(el.attributes);
                attrs.forEach(attr => {
                    if (!keepAttrs.includes(attr.name)) {
                        el.removeAttribute(attr.name);
                    }
                });
            });

            return clone;
        }

        displayContent(content) {
            const reader = document.getElementById('scr-reader');
            if (!reader) return;

            // Add page title if available
            const pageTitle = document.title;
            let html = '';

            if (pageTitle) {
                html += `<h1 style="text-align: center; font-size: 14px; color: #a0aab8;">${pageTitle}</h1>`;
                
            }

            html += content?.innerHTML ?? content;
            reader.innerHTML = html;

            // Scroll to top
            const contentContainer = document.querySelector('.scr-content');
            if (contentContainer) {
                contentContainer.scrollTop = 0;
            }
        }

        show() {
            this.overlay.style.display = 'flex';
            setTimeout(() => this.overlay.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '0px'; // Remove scrollbar padding
        }

        close() {
            this.overlay.classList.remove('active');
            setTimeout(() => {
                this.overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
                document.body.style.paddingRight = ''; // Reset scrollbar padding
            }, 300);
        }

        showLoading() {
            const loading = document.getElementById('scr-loading');
            const reader = document.getElementById('scr-reader');
            if (loading) loading.style.display = 'flex';
            if (reader) reader.style.display = 'none';
        }

        hideLoading() {
            const loading = document.getElementById('scr-loading');
            const reader = document.getElementById('scr-reader');
            if (loading) loading.style.display = 'none';
            if (reader) reader.style.display = 'block';
        }

        showStatus(message, type = '') {
            const status = document.getElementById('scr-status');
            if (status) {
                status.textContent = message;
                status.className = `scr-status ${type}`;
                status.style.display = 'block';
                
                
                setTimeout(() => {
                    status.style.display = 'none';
                }, 3000);
            }
        }

        // Public API
        getVersion() {
            return this.version;
        }

        isInitialized() {
            return this.isLoaded;
        }
    }

    // Create global instance
    window.SmartContentReader = new SmartContentReader();

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SmartContentReader.init();
        });
    } else {
        window.SmartContentReader.init();
    }

    // Debug info
    console.log('🚀 Smart Content Reader script loaded');
    console.log('💡 Shortcuts:');
    console.log('  - Click floating button (📖) to extract content');
    console.log('  - Ctrl + Shift + R: Toggle reader');
    console.log('  - ESC: Close reader');

})();
