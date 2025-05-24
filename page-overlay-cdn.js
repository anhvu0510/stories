/**
 * CDN Page Overlay - Main Distribution
 * Built: 2025-05-24T03:21:31.299Z
 * Usage: @require https://yourusername.github.io/cdn-page-overlay/page-overlay-cdn.js
 */

/**
 * Page Overlay CDN Script
 * Version: 1.0.0
 * Usage: Load via @require in Tampermonkey
 */

(function(global) {
    'use strict';
    
    // Prevent multiple loading
    if (global.PageOverlayCDN) {
        console.warn('PageOverlayCDN already loaded');
        return;
    }

    const VERSION = '1.0.0';
    
    class PageOverlayCDN {
        constructor() {
            this.version = VERSION;
            this.overlay = null;
            this.isLoaded = false;
            this.autoRefreshInterval = null;
            console.log(`📄 PageOverlayCDN v${VERSION} loaded`);
        }

        // Initialize the overlay system
        init() {
            if (this.isLoaded) return;
            
            this.addStyles();
            this.createOverlay();
            this.bindEvents();
            this.isLoaded = true;
            
            console.log('✅ PageOverlayCDN initialized');
            return this;
        }

        addStyles() {
            const css = `
                /* CDN Page Overlay Styles */
                .cdn-page-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.95);
                    backdrop-filter: blur(15px);
                    z-index: 999999;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    animation: cdnFadeIn 0.3s ease;
                }

                @keyframes cdnFadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }

                .cdn-modal {
                    width: 90vw;
                    height: 90vh;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 
                        0 25px 50px rgba(0, 0, 0, 0.7),
                        0 0 0 1px rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    transform: scale(0.9);
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .cdn-page-overlay.active .cdn-modal {
                    transform: scale(1);
                }

                .cdn-header {
                    background: linear-gradient(90deg, #2196F3, #21CBF3);
                    padding: 20px 25px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
                }

                .cdn-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .cdn-controls {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .cdn-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .cdn-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
                }

                .cdn-btn.danger {
                    background: rgba(244, 67, 54, 0.8);
                }

                .cdn-btn.danger:hover {
                    background: rgba(244, 67, 54, 1);
                }

                .cdn-btn.success {
                    background: rgba(76, 175, 80, 0.8);
                }

                .cdn-btn.success:hover {
                    background: rgba(76, 175, 80, 1);
                }

                .cdn-btn.active {
                    background: rgba(255, 193, 7, 0.8);
                    color: #333;
                }

                .cdn-content {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: #f5f5f5;
                }

                .cdn-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
                }

                .cdn-loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #666;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .cdn-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #2196F3;
                    border-radius: 50%;
                    animation: cdnSpin 1s linear infinite;
                }

                @keyframes cdnSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .cdn-floating-btn {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    box-shadow: 
                        0 8px 25px rgba(102, 126, 234, 0.4),
                        0 0 0 0 rgba(102, 126, 234, 0.7);
                    z-index: 999998;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    animation: cdnPulse 2s infinite;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                @keyframes cdnPulse {
                    0% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.7); }
                    70% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4), 0 0 0 10px rgba(102, 126, 234, 0); }
                    100% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0); }
                }

                .cdn-floating-btn:hover {
                    transform: scale(1.1) translateY(-3px);
                    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.6);
                }

                .cdn-floating-btn:active {
                    transform: scale(0.95);
                }

                .cdn-floating-btn.hidden {
                    transform: translateY(100px);
                    opacity: 0;
                    pointer-events: none;
                }

                /* Status indicator */
                .cdn-status {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 500;
                    backdrop-filter: blur(10px);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .cdn-status.success {
                    background: rgba(76, 175, 80, 0.8);
                }

                .cdn-status.error {
                    background: rgba(244, 67, 54, 0.8);
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .cdn-modal {
                        width: 100vw;
                        height: 100vh;
                        border-radius: 0;
                    }
                    
                    .cdn-header {
                        padding: 15px 20px;
                    }
                    
                    .cdn-title {
                        font-size: 16px;
                    }
                    
                    .cdn-controls {
                        gap: 8px;
                    }
                    
                    .cdn-btn {
                        padding: 8px 12px;
                        font-size: 13px;
                    }
                    
                    .cdn-floating-btn {
                        width: 60px;
                        height: 60px;
                        bottom: 20px;
                        right: 20px;
                        font-size: 24px;
                    }
                }

                /* Dark theme compatibility */
                @media (prefers-color-scheme: dark) {
                    .cdn-modal {
                        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                    }
                    
                    .cdn-content {
                        background: #1a1a1a;
                    }
                }

                /* Print hide */
                @media print {
                    .cdn-page-overlay,
                    .cdn-floating-btn {
                        display: none !important;
                    }
                }
            `;

            const style = document.createElement('style');
            style.id = 'cdn-page-overlay-styles';
            style.textContent = css;
            document.head.appendChild(style);
        }

        createOverlay() {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'cdn-page-overlay';
            this.overlay.innerHTML = `
                <div class="cdn-modal">
                    <div class="cdn-header">
                        <h3 class="cdn-title">
                            <span>📖</span>
                            Content Extractor v${VERSION}
                        </h3>
                        <div class="cdn-controls">
                            <button class="cdn-btn" id="cdn-auto-refresh" title="Toggle auto-refresh">
                                🔄 Auto
                            </button>
                            <button class="cdn-btn" id="cdn-refresh" title="Refresh content">
                                ↻ Refresh
                            </button>
                            <button class="cdn-btn" id="cdn-new-window" title="Open in new window">
                                🗗 New
                            </button>
                            <button class="cdn-btn danger" id="cdn-close" title="Close overlay">
                                ✕ Close
                            </button>
                        </div>
                    </div>
                    <div class="cdn-content">
                        <div class="cdn-loading" id="cdn-loading">
                            <div class="cdn-spinner"></div>
                            Extracting main content...
                        </div>
                        <div class="cdn-status" id="cdn-status" style="display: none;">Ready</div>
                        <iframe class="cdn-iframe" id="cdn-iframe"></iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(this.overlay);

            // Create floating button
            const floatingBtn = document.createElement('button');
            floatingBtn.className = 'cdn-floating-btn';
            floatingBtn.innerHTML = '📖';
            floatingBtn.title = 'Content Extractor - Extract main content from current page';
            floatingBtn.id = 'cdn-floating-btn';
            document.body.appendChild(floatingBtn);
        }

        bindEvents() {
            const floatingBtn = document.getElementById('cdn-floating-btn');
            const closeBtn = document.getElementById('cdn-close');
            const refreshBtn = document.getElementById('cdn-refresh');
            const newWindowBtn = document.getElementById('cdn-new-window');
            const autoRefreshBtn = document.getElementById('cdn-auto-refresh');

            floatingBtn?.addEventListener('click', () => this.clonePage());
            closeBtn?.addEventListener('click', () => this.close());
            refreshBtn?.addEventListener('click', () => this.refresh());
            newWindowBtn?.addEventListener('click', () => this.openNewWindow());
            autoRefreshBtn?.addEventListener('click', () => this.toggleAutoRefresh());

            // Close on overlay click
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });

            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                    this.close();
                }
                
                // Ctrl + Shift + O to open overlay
                if (e.ctrlKey && e.shiftKey && e.key === 'O') {
                    e.preventDefault();
                    if (this.overlay.classList.contains('active')) {
                        this.close();
                    } else {
                        this.clonePage();
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

        clonePage() {
            try {
                this.showLoading();
                this.show();
                
                const iframe = document.getElementById('cdn-iframe');
                
                // Extract main content from current page
                const mainContent = this.extractMainContent();
                
                // Create simple HTML with extracted content
                const contentHTML = this.createContentHTML(mainContent);
                const blob = new Blob([contentHTML], { type: 'text/html' });
                const blobURL = URL.createObjectURL(blob);
                
                iframe.src = blobURL;
                
                // Store for cleanup
                iframe.dataset.blobUrl = blobURL;
                
                // Handle iframe load
                iframe.onload = () => {
                    this.hideLoading();
                    this.showStatus('✅ Content extracted', 'success');
                };
                
                iframe.onerror = () => {
                    this.hideLoading();
                    this.showStatus('❌ Extract failed', 'error');
                    // Fallback to current URL
                    iframe.src = window.location.href;
                };
                
            } catch (error) {
                console.error('CDN Content extraction failed:', error);
                this.hideLoading();
                this.showStatus('❌ Error occurred', 'error');
                
                // Fallback to iframe with current URL
                const iframe = document.getElementById('cdn-iframe');
                iframe.src = window.location.href;
            }
        }

        extractMainContent() {
            // Try to find main content using common selectors
            const contentSelectors = [
                'main',
                '[role="main"]',
                '.main-content',
                '.content',
                '.post-content',
                '.entry-content',
                '.article-content',
                '.page-content',
                '.story-content',
                '.chapter-content',
                'article',
                '.container .content',
                '#content',
                '#main',
                '.main'
            ];

            let mainContent = null;
            
            // Try each selector until we find content
            for (const selector of contentSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim().length > 200) {
                    mainContent = element;
                    break;
                }
            }

            // If no main content found, try to get the largest text block
            if (!mainContent) {
                const allDivs = document.querySelectorAll('div, section, article');
                let largestElement = null;
                let maxTextLength = 0;

                allDivs.forEach(div => {
                    // Skip navigation, header, footer, sidebar elements
                    if (div.matches('nav, header, footer, aside, .nav, .header, .footer, .sidebar, .menu')) {
                        return;
                    }
                    
                    const textLength = div.textContent.trim().length;
                    if (textLength > maxTextLength && textLength > 200) {
                        maxTextLength = textLength;
                        largestElement = div;
                    }
                });

                mainContent = largestElement;
            }

            // If still no content, fallback to body
            if (!mainContent) {
                mainContent = document.body;
            }

            return mainContent;
        }

        createContentHTML(contentElement) {
            if (!contentElement) {
                return `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>No Content Found</title>
                    </head>
                    <body>
                        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                            <h2>⚠️ No main content found</h2>
                            <p>Could not extract main content from this page.</p>
                        </div>
                    </body>
                    </html>
                `;
            }

            // Clean the content by removing unwanted elements
            const cleanContent = contentElement.cloneNode(true);
            
            // Remove scripts, ads, navigation elements
            const unwantedSelectors = [
                'script',
                'style',
                'noscript',
                'nav',
                'header',
                'footer',
                'aside',
                '.ads',
                '.advertisement',
                '.ad',
                '.nav',
                '.navigation', 
                '.menu',
                '.sidebar',
                '.social',
                '.share',
                '.comments',
                '.comment',
                '[class*="cdn-"]',
                '[id*="cdn-"]'
            ];

            unwantedSelectors.forEach(selector => {
                const elements = cleanContent.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            // Get page title
            const pageTitle = document.title || 'Extracted Content';

            return `
                <!DOCTYPE html>
                <html lang="${document.documentElement.lang || 'en'}">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>📖 ${pageTitle}</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                            line-height: 1.6;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                            color: #333;
                            background: #fff;
                        }

                        /* CDN Header */
                        .cdn-header {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            text-align: center;
                            padding: 10px;
                            font-weight: 600;
                            font-size: 14px;
                            z-index: 999999;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }

                        .cdn-content {
                            margin-top: 60px;
                            padding: 20px 0;
                        }

                        /* Typography improvements */
                        h1, h2, h3, h4, h5, h6 {
                            color: #2c3e50;
                            margin-top: 30px;
                            margin-bottom: 15px;
                        }

                        h1 { font-size: 2.2em; }
                        h2 { font-size: 1.8em; }
                        h3 { font-size: 1.5em; }

                        p {
                            margin-bottom: 15px;
                            text-align: justify;
                        }

                        /* Remove all interactive elements */
                        button, input, select, textarea, a {
                            pointer-events: none !important;
                            cursor: default !important;
                            text-decoration: none;
                            color: inherit;
                        }

                        /* Images */
                        img {
                            max-width: 100%;
                            height: auto;
                            display: block;
                            margin: 20px auto;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }

                        /* Lists */
                        ul, ol {
                            padding-left: 30px;
                            margin-bottom: 20px;
                        }

                        li {
                            margin-bottom: 8px;
                        }

                        /* Code blocks */
                        pre, code {
                            background: #f8f9fa;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                        }

                        pre {
                            padding: 15px;
                            overflow-x: auto;
                            margin: 20px 0;
                        }

                        /* Tables */
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                        }

                        th, td {
                            border: 1px solid #ddd;
                            padding: 12px;
                            text-align: left;
                        }

                        th {
                            background: #f8f9fa;
                            font-weight: 600;
                        }

                        /* Blockquotes */
                        blockquote {
                            border-left: 4px solid #667eea;
                            padding-left: 20px;
                            margin: 20px 0;
                            font-style: italic;
                            color: #666;
                        }

                        /* Responsive */
                        @media (max-width: 768px) {
                            body {
                                padding: 15px;
                                font-size: 16px;
                            }
                            
                            .cdn-header {
                                font-size: 12px;
                                padding: 8px;
                            }
                            
                            .cdn-content {
                                margin-top: 50px;
                            }

                            h1 { font-size: 1.8em; }
                            h2 { font-size: 1.5em; }
                            h3 { font-size: 1.3em; }
                        }

                        /* Dark mode support */
                        @media (prefers-color-scheme: dark) {
                            body {
                                background: #1a1a1a;
                                color: #e0e0e0;
                            }
                            
                            h1, h2, h3, h4, h5, h6 {
                                color: #ffffff;
                            }
                            
                            pre, code {
                                background: #2d2d2d;
                                color: #e0e0e0;
                            }
                            
                            th {
                                background: #333;
                            }
                            
                            th, td {
                                border-color: #444;
                            }
                            
                            blockquote {
                                color: #aaa;
                            }
                        }

                        /* Print styles */
                        @media print {
                            .cdn-header {
                                display: none;
                            }
                            
                            .cdn-content {
                                margin-top: 0;
                            }
                            
                            body {
                                background: white;
                                color: black;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="cdn-header">
                        🌐 CDN Content Extractor - Main Content Only
                    </div>
                    <div class="cdn-content">
                        ${cleanContent.innerHTML}
                    </div>
                    
                    <script>
                        console.log('📖 CDN Content extracted and displayed');
                        
                        // Disable all forms and links
                        document.addEventListener('click', function(e) {
                            e.preventDefault();
                        });
                        
                        document.addEventListener('submit', function(e) {
                            e.preventDefault();
                        });
                        
                        // Add smooth scrolling
                        document.documentElement.style.scrollBehavior = 'smooth';
                        
                        // Auto-focus on content for better reading
                        window.addEventListener('load', function() {
                            const content = document.querySelector('.cdn-content');
                            if (content) {
                                content.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        });
                    </script>
                </body>
                </html>
            `;
        }

        show() {
            this.overlay.style.display = 'flex';
            setTimeout(() => this.overlay.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
        }

        close() {
            this.overlay.classList.remove('active');
            setTimeout(() => {
                this.overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
                
                // Cleanup
                this.clearAutoRefresh();
                const iframe = document.getElementById('cdn-iframe');
                if (iframe?.dataset.blobUrl) {
                    URL.revokeObjectURL(iframe.dataset.blobUrl);
                    iframe.src = '';
                    delete iframe.dataset.blobUrl;
                }
            }, 300);
        }

        refresh() {
            this.clonePage();
        }

        openNewWindow() {
            const newWindow = window.open(window.location.href, '_blank');
            if (newWindow) {
                newWindow.focus();
                this.showStatus('🗗 New window opened', 'success');
            } else {
                this.showStatus('❌ Popup blocked', 'error');
            }
        }

        toggleAutoRefresh() {
            const btn = document.getElementById('cdn-auto-refresh');
            
            if (this.autoRefreshInterval) {
                this.clearAutoRefresh();
                btn.classList.remove('active');
                btn.textContent = '🔄 Auto';
                this.showStatus('Auto-refresh disabled', 'success');
            } else {
                this.autoRefreshInterval = setInterval(() => {
                    if (this.overlay.classList.contains('active')) {
                        this.refresh();
                    }
                }, 5000); // Refresh every 5 seconds
                
                btn.classList.add('active');
                btn.textContent = '⏹ Stop';
                this.showStatus('Auto-refresh enabled (5s)', 'success');
            }
        }

        clearAutoRefresh() {
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }
        }

        showLoading() {
            const loading = document.getElementById('cdn-loading');
            const iframe = document.getElementById('cdn-iframe');
            if (loading) loading.style.display = 'flex';
            if (iframe) iframe.style.display = 'none';
        }

        hideLoading() {
            const loading = document.getElementById('cdn-loading');
            const iframe = document.getElementById('cdn-iframe');
            if (loading) loading.style.display = 'none';
            if (iframe) iframe.style.display = 'block';
        }

        showStatus(message, type = '') {
            const status = document.getElementById('cdn-status');
            if (status) {
                status.textContent = message;
                status.className = `cdn-status ${type}`;
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

        isVisible() {
            return this.overlay && this.overlay.classList.contains('active');
        }

        destroy() {
            this.clearAutoRefresh();
            
            // Remove event listeners
            document.removeEventListener('keydown', this.handleKeydown);
            
            // Remove elements
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            
            const floatingBtn = document.getElementById('cdn-floating-btn');
            if (floatingBtn) floatingBtn.remove();
            
            const styles = document.getElementById('cdn-page-overlay-styles');
            if (styles) styles.remove();
            
            this.isLoaded = false;
            console.log('🗑️ PageOverlayCDN destroyed');
        }
    }

    // Export to global
    global.PageOverlayCDN = PageOverlayCDN;
    
    // Auto-initialize if not in module environment
    if (typeof module === 'undefined') {
        global.pageOverlayCDN = new PageOverlayCDN().init();
        
        // Global keyboard shortcut info
        console.log('⌨️ Keyboard shortcuts:');
        console.log('  - Ctrl+Shift+O: Toggle overlay');
        console.log('  - ESC: Close overlay');
    }

})(typeof window !== 'undefined' ? window : this);
