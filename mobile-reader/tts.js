// Text-to-Speech enhanced functionality
// This file extends the TTS capabilities of the mobile reader

document.addEventListener('DOMContentLoaded', function() {
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
        console.warn("Speech synthesis not supported in this browser");
        return;
    }
    
    // DOM elements
    const ttsBtn = document.getElementById('tts-btn');
    const chapterContent = document.getElementById('chapter-content');
    
    // TTS state
    let ttsQueue = [];
    let currentUtterance = null;
    let isPaused = false;
    let activeParagraph = null;
    
    // Get available voices
    let voices = [];
    
    function loadVoices() {
        voices = speechSynthesis.getVoices();
    }
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
    console.log({voices});
    // Get the best voice for a given language
    function getBestVoice(lang) {
        // Default to first available voice if none match
        if (voices.length === 0) return null;
        
        // Try to find an exact match
        let exactMatch = voices.find(voice => voice.lang === lang);
        if (exactMatch) return exactMatch;
        
        // Try to find a partial match (e.g., 'en-US' for 'en')
        let partialMatch = voices.find(voice => voice.lang.startsWith(lang.split('-')[0]));
        if (partialMatch) return partialMatch;
        
        // Fall back to first voice
        return voices[0];
    }
    
    // Detect language from text
    function detectLanguage(text) {
        // Vietnamese detection - checks for Vietnamese-specific characters
        if (/[áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựđ]/i.test(text)) {
            return 'vi-VN';
        }
        
        // Simple language detection for common languages
        // Count characters typical of different languages
        
        // Chinese characters
        const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF]/;
        if (chinesePattern.test(text)) {
            return 'zh-CN';
        }
        
        // Japanese specific characters (hiragana, katakana)
        const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
        if (japanesePattern.test(text)) {
            return 'ja-JP';
        }
        
        // Korean Hangul
        const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
        if (koreanPattern.test(text)) {
            return 'ko-KR';
        }
        
        // Thai characters
        const thaiPattern = /[\u0E00-\u0E7F]/;
        if (thaiPattern.test(text)) {
            return 'th-TH';
        }
        
        // Russian Cyrillic
        const russianPattern = /[\u0400-\u04FF]/;
        if (russianPattern.test(text)) {
            return 'ru-RU';
        }
        
        // Arabic characters
        const arabicPattern = /[\u0600-\u06FF]/;
        if (arabicPattern.test(text)) {
            return 'ar-SA';
        }
        
        // Default to English
        return 'en-US';
    }
    
    // Split text into manageable chunks for better TTS performance
    function splitTextIntoChunks(text, maxLength = 200) {
        if (text.length <= maxLength) return [text];
        
        const chunks = [];
        let currentChunk = '';
        
        // Split by sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length <= maxLength) {
                currentChunk += sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            }
        }
        
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }
    
    // Create utterance with appropriate settings
    function createUtterance(text, settings) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Detect language from text
        const lang = detectLanguage(text);
        utterance.lang = lang;
        
        // Set voice if available
        const voice = getBestVoice(lang);
        if (voice) utterance.voice = voice;
        
        // Apply settings
        utterance.rate = settings.ttsSpeed || 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        return utterance;
    }
    
    // Speak all paragraphs in the chapter
    function speakAllParagraphs(startIndex = 0) {
        // Get all paragraphs
        const paragraphs = chapterContent.querySelectorAll('p');
        if (paragraphs.length === 0) return;
        
        // Clear any existing queue
        stopSpeaking();
        ttsQueue = [];
        
        // Get settings
        const settings = {
            ttsSpeed: parseFloat(document.getElementById('tts-speed').value) || 1,
            ttsHighlight: document.getElementById('tts-highlight').checked
        };
        
        // Queue up all paragraphs from the starting index
        for (let i = startIndex; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            const text = paragraph.textContent.trim();
            
            if (!text) continue;
            
            // Split long paragraphs into chunks
            const chunks = splitTextIntoChunks(text);
            
            for (const chunk of chunks) {
                const utterance = createUtterance(chunk, settings);
                
                // Store reference to paragraph for highlighting
                utterance.paragraph = paragraph;
                
                // Set up utterance events
                setupUtteranceEvents(utterance, settings);
                
                // Add to queue
                ttsQueue.push(utterance);
            }
        }
        
        // Start speaking
        speakNext();
    }
    
    // Set up events for an utterance
    function setupUtteranceEvents(utterance, settings) {
        // Start event - highlight paragraph
        utterance.onstart = function() {
            currentUtterance = utterance;
            
            if (settings.ttsHighlight && utterance.paragraph) {
                // Remove existing highlights
                const highlighted = document.querySelectorAll('.highlight-tts');
                highlighted.forEach(el => el.classList.remove('highlight-tts'));
                
                // Highlight current paragraph
                utterance.paragraph.classList.add('highlight-tts');
                activeParagraph = utterance.paragraph;
                
                // Scroll paragraph into view
                utterance.paragraph.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center'
                });
            }
        };
        
        // End event - move to next utterance
        utterance.onend = function() {
            currentUtterance = null;
            speakNext();
        };
        
        // Error handling
        utterance.onerror = function(event) {
            console.error('SpeechSynthesis error:', event.error);
            currentUtterance = null;
            speakNext();
        };
    }
    
    // Speak the next utterance in the queue
    function speakNext() {
        if (ttsQueue.length === 0 || isPaused) {
            if (ttsQueue.length === 0) {
                // End of queue reached
                resetTTS();
            }
            return;
        }
        
        const utterance = ttsQueue.shift();
        speechSynthesis.speak(utterance);
    }
    
    // Stop all speaking
    function stopSpeaking() {
        speechSynthesis.cancel();
        currentUtterance = null;
        
        // Remove highlights
        const highlighted = document.querySelectorAll('.highlight-tts');
        highlighted.forEach(el => el.classList.remove('highlight-tts'));
        activeParagraph = null;
    }
    
    // Reset TTS state
    function resetTTS() {
        stopSpeaking();
        ttsQueue = [];
        isPaused = false;
        
        // Update button appearance
        ttsBtn.innerHTML = '<i class="fas fa-headphones"></i>';
    }
    
    // Pause or resume speaking
    function togglePause() {
        if (isPaused) {
            // Resume speaking
            isPaused = false;
            if (ttsQueue.length > 0) {
                speakNext();
            }
            ttsBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            // Pause speaking
            isPaused = true;
            speechSynthesis.pause();
            ttsBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    // Enhanced TTS toggle function
    window.enhancedToggleTTS = function() {
        if (speechSynthesis.speaking || ttsQueue.length > 0) {
            if (isPaused) {
                togglePause(); // Resume if paused
            } else {
                togglePause(); // Pause if speaking
            }
        } else {
            // Start new TTS session
            
            // Find starting paragraph (if a paragraph is in view)
            let startIndex = 0;
            const paragraphs = Array.from(chapterContent.querySelectorAll('p'));
            
            // Find the first paragraph that's currently visible
            const viewportHeight = window.innerHeight;
            const viewportMiddle = window.scrollY + (viewportHeight / 2);
            
            for (let i = 0; i < paragraphs.length; i++) {
                const rect = paragraphs[i].getBoundingClientRect();
                const elemTop = rect.top + window.scrollY;
                const elemBottom = elemTop + rect.height;
                
                if (elemTop <= viewportMiddle && elemBottom >= viewportMiddle) {
                    startIndex = i;
                    break;
                } else if (elemTop > viewportMiddle) {
                    startIndex = Math.max(0, i - 1);
                    break;
                }
            }
            
            speakAllParagraphs(startIndex);
            ttsBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    };
    
    // Expose functions globally for use in main script
    window.ttsHelper = {
        speakAllParagraphs,
        stopSpeaking,
        togglePause,
        resetTTS
    };
});
