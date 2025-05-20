// Mobile-optimized reader script
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const container = document.getElementById('container');
    const chapterContent = document.getElementById('chapter-content');
    const chapterMenu = document.getElementById('chapter-menu');
    const menuList = document.getElementById('menu-list');
    const settingsPanel = document.getElementById('settings-panel');
    const advancedSettings = document.getElementById('advanced-settings');
    const overlay = document.getElementById('overlay');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    // Buttons
    const toggleChaptersBtn = document.getElementById('toggle-chapters-btn');
    const closeChaptersBtn = document.getElementById('close-chapters');
    const regexSettingsBtn = document.getElementById('regex-settings-btn');
    const themeSettingsBtn = document.getElementById('theme-settings-btn');
    const ttsBtn = document.getElementById('tts-btn');
    const moreOptionsBtn = document.getElementById('more-options-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const closeAdvancedSettingsBtn = document.getElementById('close-advanced-settings');
    const saveSettingsBtn = document.getElementById('save-settings');
    const saveAdvancedSettingsBtn = document.getElementById('save-advanced-settings');
    
    // File input
    const fileInput = document.getElementById('file-input');
    
    // Global variables
    let chapterData = [];
    let currentChapterIndex = 0;
    let currentTtsIndex = -1;
    let isSpeaking = false;
    let regexReplaceList = [];
    
    // Initialize settings with default values
    let settings = {
        fontSize: 18,
        lineHeight: 1.8,
        fontFamily: "'Crimson Pro', serif",
        sentenceGroup: 3,
        theme: 'dark',
        ttsSpeed: 1,
        ttsHighlight: true
    };
    
    // ===== Event Listeners =====
    
    // Chapter menu toggle
    toggleChaptersBtn.addEventListener('click', () => {
        chapterMenu.classList.toggle('open');
        overlay.classList.toggle('active');
    });
    
    closeChaptersBtn.addEventListener('click', () => {
        chapterMenu.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    // Settings panels
    regexSettingsBtn.addEventListener('click', () => {
        // Populate regex fields with existing settings
        updateRegexReplaceList();
        
        // Show regex modal
        document.getElementById('regex-modal').classList.add('open');
        overlay.classList.add('active');
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    moreOptionsBtn.addEventListener('click', () => {
        settingsPanel.classList.add('open');
        overlay.classList.add('active');
    });
    
    closeAdvancedSettingsBtn.addEventListener('click', () => {
        advancedSettings.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    // Theme toggle
    themeSettingsBtn.addEventListener('click', () => {
        // Cycle through themes: dark → black → sepia → dark
        const themes = ['dark', 'black', 'sepia'];
        const currentIndex = themes.indexOf(settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        settings.theme = themes[nextIndex];
        
        applyTheme(settings.theme);
        saveSettings();
    });
    
    // Overlay click to close menus
    overlay.addEventListener('click', () => {
        chapterMenu.classList.remove('open');
        settingsPanel.classList.remove('open');
        advancedSettings.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    // File input change
    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            processFile(file);
        }
    });
    
    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        saveSettings();
        settingsPanel.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    saveAdvancedSettingsBtn.addEventListener('click', () => {
        saveSettings();
        advancedSettings.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    // Settings controls
    
    // Font size slider
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeDisplay = document.getElementById('font-size-display');
    const decreaseFontSizeBtn = document.getElementById('decrease-font-size');
    const increaseFontSizeBtn = document.getElementById('increase-font-size');
    
    fontSizeSlider.addEventListener('input', () => {
        settings.fontSize = parseInt(fontSizeSlider.value);
        fontSizeDisplay.textContent = settings.fontSize + 'px';
        applyFontSize();
    });
    
    decreaseFontSizeBtn.addEventListener('click', () => {
        if (settings.fontSize > parseInt(fontSizeSlider.min)) {
            settings.fontSize--;
            fontSizeSlider.value = settings.fontSize;
            fontSizeDisplay.textContent = settings.fontSize + 'px';
            applyFontSize();
        }
    });
    
    increaseFontSizeBtn.addEventListener('click', () => {
        if (settings.fontSize < parseInt(fontSizeSlider.max)) {
            settings.fontSize++;
            fontSizeSlider.value = settings.fontSize;
            fontSizeDisplay.textContent = settings.fontSize + 'px';
            applyFontSize();
        }
    });
    
    // Line height slider
    const lineHeightSlider = document.getElementById('line-height-slider');
    const lineHeightDisplay = document.getElementById('line-height-display');
    const decreaseLineHeightBtn = document.getElementById('decrease-line-height');
    const increaseLineHeightBtn = document.getElementById('increase-line-height');
    
    lineHeightSlider.addEventListener('input', () => {
        settings.lineHeight = parseFloat(lineHeightSlider.value);
        lineHeightDisplay.textContent = settings.lineHeight.toFixed(1);
        applyLineHeight();
    });
    
    decreaseLineHeightBtn.addEventListener('click', () => {
        if (settings.lineHeight > parseFloat(lineHeightSlider.min)) {
            settings.lineHeight = Math.max(
                parseFloat(lineHeightSlider.min), 
                (settings.lineHeight - 0.1).toFixed(1)
            );
            lineHeightSlider.value = settings.lineHeight;
            lineHeightDisplay.textContent = settings.lineHeight.toFixed(1);
            applyLineHeight();
        }
    });
    
    increaseLineHeightBtn.addEventListener('click', () => {
        if (settings.lineHeight < parseFloat(lineHeightSlider.max)) {
            settings.lineHeight = Math.min(
                parseFloat(lineHeightSlider.max), 
                (parseFloat(settings.lineHeight) + 0.1).toFixed(1)
            );
            lineHeightSlider.value = settings.lineHeight;
            lineHeightDisplay.textContent = settings.lineHeight.toFixed(1);
            applyLineHeight();
        }
    });
    
    // Font family options
    const fontOptions = document.querySelectorAll('.font-option');
    
    fontOptions.forEach(option => {
        option.addEventListener('click', () => {
            fontOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            settings.fontFamily = option.getAttribute('data-font');
            applyFontFamily();
        });
    });
    
    // Theme options
    const themeOptions = document.querySelectorAll('.theme-option');
    
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            themeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            settings.theme = option.getAttribute('data-theme');
            applyTheme(settings.theme);
        });
    });
    
    // Sentence group controls
    const sentenceGroupDisplay = document.getElementById('sentence-group-display');
    const decreaseSentenceGroupBtn = document.getElementById('decrease-sentence-group');
    const increaseSentenceGroupBtn = document.getElementById('increase-sentence-group');
    
    decreaseSentenceGroupBtn.addEventListener('click', () => {
        if (settings.sentenceGroup > 1) {
            settings.sentenceGroup--;
            sentenceGroupDisplay.textContent = settings.sentenceGroup;
        }
    });
    
    increaseSentenceGroupBtn.addEventListener('click', () => {
        if (settings.sentenceGroup < 10) {
            settings.sentenceGroup++;
            sentenceGroupDisplay.textContent = settings.sentenceGroup;
        }
    });
    
    // TTS controls
    const ttsSpeedSlider = document.getElementById('tts-speed');
    const ttsSpeedDisplay = document.getElementById('tts-speed-display');
    const ttsHighlightCheckbox = document.getElementById('tts-highlight');
    
    ttsSpeedSlider.addEventListener('input', () => {
        settings.ttsSpeed = parseFloat(ttsSpeedSlider.value);
        ttsSpeedDisplay.textContent = settings.ttsSpeed.toFixed(1) + 'x';
    });
    
    ttsHighlightCheckbox.addEventListener('change', () => {
        settings.ttsHighlight = ttsHighlightCheckbox.checked;
    });
    
    // Regex replace controls
    const regexReplaceListEl = document.getElementById('regex-replace-list');
    const regexCountEl = document.getElementById('regex-count');
    // const regexMatchInput = document.getElementById('regex-match');
    // const regexReplaceInput = document.getElementById('regex-replace');
    // const addRegexReplaceBtn = document.getElementById('add-regex-replace');
    
    // addRegexReplaceBtn.addEventListener('click', () => {
    //     const matchPattern = regexMatchInput.value.trim();
    //     const replaceText = regexReplaceInput.value;
        
    //     if (matchPattern) {
    //         regexReplaceList.push({
    //             match: matchPattern,
    //             replace: replaceText
    //         });
            
    //         updateRegexReplaceList();
    //         regexMatchInput.value = '';
    //         regexReplaceInput.value = '';
    //     }
    // });
    
    // TTS button
    ttsBtn.addEventListener('click', toggleTextToSpeech);
    
    // ===== Core functions =====
    
    // Process uploaded file
    async function processFile(file) {
        try {
            showLoadingSpinner();
            console.log("Starting to process file:", file);
            
            // Update story name
            const storyName = document.getElementById('story-name');
            storyName.textContent = file.name.replace(/\.[^/.]+$/, "");
            
            const content = await readFileContent(file); // Read file content async

            const lineSentence = loadFromLocalStorage("linesPerSentence") || settings.sentenceGroup;
            const chapters = parseContentToChapters(content, lineSentence); // Split content into chapters
            window.chapterData = chapters; // Save chapters globally
            chapterData = chapters;
            
            console.log("Processed chapters:", chapters.length);
            
            // Clear old content and initialize lazy loading
            chapterContent.innerHTML = "";
            
            // Initialize lazy loading
            initLazyLoading();
            
            // Update chapter menu
            populateChapterMenu();
            
            // Update the stats in chapter menu
            updateChapterStats();
            
            // Load saved settings
            loadStoredSettings();
            
            // Restore reading position
            restoreReadingPosition();
            
            // Close menu after loading
            chapterMenu.classList.remove('open');
            overlay.classList.remove('active');
        } catch (error) {
            console.error("Error processing file:", error);
        } finally {
            hideLoadingSpinner();
        }
    }
    
    // Split content into chapters
    function splitIntoChapters(content, linesPerSentence) {
        // Simple chapter detection based on common patterns
        const chapterPatterns = [
            /Chapter\s+\d+/gi,                    // "Chapter X"
            /Chương\s+\d+/gi,                     // Vietnamese "Chương X"
            /\n\s*\d+\s*\n/g,                     // Number on its own line
            /\n\s*Phần\s+\d+/gi,                  // Vietnamese "Phần X" (Part X)
            /\n\s*Part\s+\d+/gi,                  // "Part X"
            /\n\s*Book\s+\d+/gi,                  // "Book X"
            /\n\s*Section\s+\d+/gi,               // "Section X"
            /\n\s*Episode\s+\d+/gi,               // "Episode X"
            /\n\s*Act\s+\d+/gi,                   // "Act X"
            /\n\s*Volume\s+\d+/gi                 // "Volume X"
        ];
        
        let chapters = [];
        let chapterMarkers = [];
        
        // Find all potential chapter starting points
        chapterPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                chapterMarkers.push({
                    index: match.index,
                    title: match[0].trim()
                });
            }
        });
        
        // Sort markers by their position in the text
        chapterMarkers.sort((a, b) => a.index - b.index);
        
        // If no chapter markers found, treat the whole content as one chapter
        if (chapterMarkers.length === 0) {
            chapters.push({
                title: "Chapter 1",
                content: formatContent(content, linesPerSentence)
            });
            return chapters;
        }
        
        // Extract content between each chapter marker
        for (let i = 0; i < chapterMarkers.length; i++) {
            const currentMarker = chapterMarkers[i];
            const nextMarker = chapterMarkers[i + 1];
            
            let chapterContent;
            if (nextMarker) {
                chapterContent = content.substring(currentMarker.index, nextMarker.index);
            } else {
                chapterContent = content.substring(currentMarker.index);
            }
            
            chapters.push({
                title: currentMarker.title,
                content: formatContent(chapterContent, linesPerSentence)
            });
        }
        
        return chapters;
    }
    
    // Format content into paragraph groups
    function formatContent(content, linesPerSentence) {
        // Apply regex replacements
        content = applyRegexReplacements(content);
        
        // Split by paragraphs
        let paragraphs = content.split(/\n+/).filter(p => p.trim());
        
        // Group paragraphs
        let formattedContent = "";
        for (let i = 0; i < paragraphs.length; i += linesPerSentence) {
            let group = paragraphs.slice(i, i + linesPerSentence);
            let groupHtml = group.map((p, idx) => 
                `<p class="tts-paragraph" data-paragraph-index="${Math.floor(i / linesPerSentence) + idx}" 
                    style="--animation-order: ${Math.floor(i / linesPerSentence) + idx};">
                    ${p.trim()}
                </p>`).join('');
            formattedContent += groupHtml;
        }
        
        return formattedContent;
    }
    
    // Apply regex replacements to content
    function applyRegexReplacements(content) {
        regexReplaceList.forEach(item => {
            try {
                const regex = new RegExp(item.match, 'g');
                content = content.replace(regex, item.replace);
            } catch (e) {
                console.error("Invalid regex:", e);
            }
        });
        return content;
    }
    
    // ===== Chapter parsing and rendering functions =====
    
    // Hàm đọc nội dung từ file
    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
    
    // Lưu dữ liệu vào Local Storage
    function saveToLocalStorage(key, data) {
        const storeName = document
            .getElementById("story-name")
            .textContent.toLowerCase()
            .replace(/\s+/g, "_");
        let dataStore = {};
        if (!localStorage.getItem(storeName)) {
            dataStore[key] = data;
        } else {
            const oldData = JSON.parse(localStorage.getItem(storeName));
            dataStore = { ...oldData, [key]: data };
        }
        localStorage.setItem(storeName, JSON.stringify(dataStore));
    }
    
    // Tải dữ liệu từ Local Storage
    function loadFromLocalStorage(key) {
        const storeName = document
            .getElementById("story-name")
            .textContent.toLowerCase()
            .replace(/\s+/g, "_");
        const data = localStorage.getItem(storeName);
        if (!data) return null;
        try {
            const obj = JSON.parse(data);
            return obj[key] !== undefined ? obj[key] : null;
        } catch (e) {
            return null;
        }
    }
    
    // Save current reading position
    function saveReadingPosition() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const currentChapter = getVisibleChapter();
        
        if (currentChapter) {
            saveToLocalStorage("lastScrollPosition", scrollTop);
            saveToLocalStorage("chapterNumber", currentChapter);
            console.log(`Saved reading position: Chapter ${currentChapter}, Scroll ${scrollTop}`);
        }
    }
    
    // Restore previously saved reading position
    function restoreReadingPosition() {
        const chapterNumber = loadFromLocalStorage("chapterNumber");
        const lastScrollPosition = loadFromLocalStorage("lastScrollPosition");
        
        console.log(`Restoring reading position: Chapter ${chapterNumber}, Scroll ${lastScrollPosition}`);
        
        if (chapterNumber !== null) {
            // First ensure the chapter is in the DOM
            ensureChapterInDOM(chapterNumber);
            
            // Then restore the scroll position with a slight delay to allow DOM rendering
            if (lastScrollPosition !== null) {
                setTimeout(() => {
                    window.scrollTo({
                        top: lastScrollPosition,
                        behavior: 'auto'
                    });
                    console.log(`Restored scroll position: ${lastScrollPosition}`);
                }, 300);
            }
        }
    }
    
    // Utility function to chunk an array into smaller arrays of a specified size
    function chunkArray(array, size) {
        if (!Array.isArray(array) || size <= 0) {
            throw new Error("Invalid input: array must be an array and size must be a positive number.");
        }
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }
    
    // Hàm tách nội dung thành các chương
    function parseContentToChapters(content, linesPerSentence = 3) {
        const regexSplitStory = "#Chương";
        function isNumber(value) {
            return /^\d+$/.test(value);
        }
        
        const storyEdited = content
            .split(/\n/)
            .filter(Boolean)
            .map((line) => {
                let lineContent = line.trim();
                const lines = line.replace(/\t/g, "").trim().split(" ");
                const firstItem = lines.shift();
                let chapterNumber = lines.shift();
                const isChapterNumber = chapterNumber && isNumber(chapterNumber.replace(/\D/g, ""));
                if (
                    isChapterNumber &&
                    lines.length < 20 &&
                    ["chương", "thứ"].includes(firstItem.toLowerCase()) === true
                ) {
                    lineContent = `#Chương ${lines.join(" ")}_${chapterNumber}_`;
                }
                return lineContent;
            })
            .join("\n");
        
        const chapters = storyEdited.split(regexSplitStory).filter(Boolean);
        
        return chapters.map((chapter) => {
            let [chapterName = "", chapterNumber = "", chapterContent = ""] = ["", "", ""];
            if (chapter.includes("_")) {
                [chapterName = "", chapterNumber = "", chapterContent = ""] = chapter.split("_");
            } else {
                chapterContent = chapter;
            }
            
            chapterNumber = +chapterNumber.replace(/\D/g, "") || 0;
            
            // Use chunkArray to split content into sentences
            const contentLines = chapterContent
                .split("\n")
                .filter(Boolean)
                .map((line) => line.trim());
            
            const combinedContent = chunkArray(contentLines, linesPerSentence).map(
                (chunk) => chunk.join("")
            );
            
            return {
                chapterNumber,
                title: `Chương ${chapterNumber} ${chapterName.trim()}`,
                content: combinedContent,
            };
        });
    }
    
    // Khởi tạo hệ thống lazy loading
    function initLazyLoading() {
        const batchSize = 2; // Số lượng chương tải mỗi lần
        const maxElements = 6; // Số lượng chương tối đa trong DOM
        let currentIndex = 1;
        
        // Tải chương đầu tiên
        loadMoreChapters("down");
        
        // Setup sticky titles for the loaded chapters
        
        // Theo dõi sự kiện scroll để tải thêm chương
        window.addEventListener("scroll", () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            
            // Cập nhật thông tin chương hiện tại trong menu
            updateChapterStats();
            
            // Highlight the current chapter in the menu
            highlightCurrentChapter();
            
            // Lưu vị trí sau khi dừng cuộn (sử dụng debounce)
            clearTimeout(window.scrollEndTimer);
            window.scrollEndTimer = setTimeout(saveReadingPosition, 500);
            
            // Tải thêm chương khi cuộn gần đến cuối
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                loadMoreChapters("down");
            } 
            // Tải thêm chương khi cuộn lên đầu
            else if (scrollTop <= 200 && currentIndex > batchSize) {
                loadMoreChapters("up");
            }
        });
        
        // Hàm tải thêm chương
        function loadMoreChapters(direction) {
            if (!window.chapterData || window.chapterData.length === 0) return;
            
            if (direction === "down") {
                const next = +(document.querySelector("#chapter-content").lastChild?.id?.split("-")[1] ?? 1);
                const nextBatch = window.chapterData
                    .filter(
                        (chapter) => chapter.chapterNumber >= next && chapter.chapterNumber < next + batchSize
                    )
                    .sort((a, b) => a.chapterNumber - b.chapterNumber);
                
                nextBatch.forEach((chapter) => {
                    if (!document.getElementById(`chapter-${chapter.chapterNumber}`)) {
                        renderChapter(chapter);
                    }
                });
                
                currentIndex += batchSize;
                
                // Xóa các chương ở đầu khi vượt quá số lượng tối đa
                const chapters = document.querySelectorAll(".chapter");
                if (chapters.length > maxElements) {
                    for (let i = 0; i < chapters.length - maxElements; i++) {
                        chapterContent.removeChild(chapters[i]);
                    }
                }
            } 
            else if (direction === "up" && currentIndex > batchSize) {
                const prev = +(document.querySelector("#chapter-content").firstChild?.id?.split("-")[1] ?? 1);
                const previousBatch = window.chapterData
                    .filter(
                        (chapter) => chapter.chapterNumber >= prev - batchSize && chapter.chapterNumber < prev
                    )
                    .sort((a, b) => b.chapterNumber - a.chapterNumber);
                
                previousBatch.forEach((chapter) => {
                    if (!document.getElementById(`chapter-${chapter.chapterNumber}`)) {
                        const chapterDiv = createChapterElement(chapter);
                        chapterContent.insertBefore(chapterDiv, chapterContent.firstChild);
                    }
                });
                
                currentIndex -= batchSize;
                
                // Xóa các chương ở cuối khi vượt quá số lượng tối đa
                const chapters = document.querySelectorAll(".chapter");
                if (chapters.length > maxElements) {
                    for (let i = maxElements; i < chapters.length; i++) {
                        chapterContent.removeChild(chapters[i]);
                    }
                }
            }
        }
    }
    
    // Tạo phần tử HTML cho một chương
    function createChapterElement(chapter) {
        const chapterDiv = document.createElement("div");
        chapterDiv.classList.add("chapter");
        chapterDiv.id = `chapter-${chapter.chapterNumber}`;
        chapterDiv.setAttribute("data-chapter-number", chapter.chapterNumber);
        
        // Add chapter title
        const title = document.createElement("h4");
        title.classList.add("chapter-title-main");
        
        // Create title text span for better control
        const titleText = document.createElement('span');
        titleText.classList.add('chapter-title-text');
        titleText.textContent = chapter.title;
        
        // Create chapter number badge
        const chapterNumBadge = document.createElement('span');
        chapterNumBadge.classList.add('chapter-badge');
        chapterNumBadge.textContent = chapter.chapterNumber;
        
        // Append elements to title
        title.appendChild(titleText);
        title.appendChild(chapterNumBadge);
        chapterDiv.appendChild(title);
        
        // Add paragraphs directly to chapter content without grouping
        chapter.content.forEach((paragraph, index) => {
            const p = document.createElement("p");
            p.innerHTML = paragraph; // Use innerHTML to preserve any formatting
            
            // Add class for text-to-speech highlighting if needed
            p.classList.add("tts-paragraph");
            p.setAttribute("data-paragraph-index", index);
            
            // Set animation order for staggered entrance
            p.style.setProperty('--animation-order', index);
            
            chapterDiv.appendChild(p);
        });
        
        return chapterDiv;
    }
    
    // Render một chương vào DOM
    function renderChapter(chapter) {
        const chapterElement = createChapterElement(chapter);
        chapterContent.appendChild(chapterElement);
        
        // Setup sticky titles after rendering
        setupStickyChapterTitles();
    }
    
    // Scroll to a specific chapter
    function scrollToChapter(chapterNumber) {
        // Ensure the chapter is in the DOM
        ensureChapterInDOM(chapterNumber);
        
        // Find the chapter element
        const chapterElement = document.getElementById(`chapter-${chapterNumber}`);
        if (chapterElement) {
            // Smooth scroll to the chapter
            chapterElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the chapter in the menu
            highlightCurrentChapter();
            
            // Update chapter stats
            updateChapterStats();
            
            // Close the menu after navigation
            chapterMenu.classList.remove('open');
            overlay.classList.remove('active');
            
            return true;
        }
        return false;
    }
    
    // Ensure a chapter is loaded in the DOM
    function ensureChapterInDOM(chapterNumber) {
        if (!window.chapterData) return false;
        
        // Check if the chapter is already in the DOM
        if (document.getElementById(`chapter-${chapterNumber}`)) {
            return true;
        }
        
        // Find the chapter data
        const chapter = window.chapterData.find(c => c.chapterNumber === chapterNumber);
        if (!chapter) return false;
        
        // Clear the chapter content
        chapterContent.innerHTML = "";
        
        // Render the requested chapter
        renderChapter(chapter);
        
        // Render surrounding chapters for smooth navigation
        const prevChapter = window.chapterData.find(c => c.chapterNumber === chapterNumber - 1);
        const nextChapter = window.chapterData.find(c => c.chapterNumber === chapterNumber + 1);
        
        if (prevChapter) {
            const prevElement = createChapterElement(prevChapter);
            chapterContent.insertBefore(prevElement, chapterContent.firstChild);
        }
        
        if (nextChapter) {
            renderChapter(nextChapter);
        }
        
        return true;
    }
    
    // Highlight the current chapter in the chapter menu
    function highlightCurrentChapter() {
        const visibleChapter = getCurrentChapterInView();
        if (visibleChapter) {
            // Remove highlight from all chapter items
            const allChapterItems = document.querySelectorAll('#menu-list li');
            allChapterItems.forEach(item => item.classList.remove('active'));
            
            // Add highlight to current chapter
            const currentChapterItem = document.querySelector(`#menu-list li[data-chapter="${visibleChapter}"]`);
            if (currentChapterItem) {
                currentChapterItem.classList.add('active');
                
                // Scroll the menu to make the active chapter visible if needed
                if (chapterMenu.classList.contains('open') && !isElementInViewport(currentChapterItem)) {
                    currentChapterItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // Update chapter count display
                const currentChapterDisplay = document.getElementById('current-chapter-display');
                if (currentChapterDisplay) {
                    currentChapterDisplay.textContent = visibleChapter;
                }
            }
        }
    }
    
    // Get the currently visible chapter
    function getVisibleChapter() {
        const chapters = document.querySelectorAll('.chapter');
        if (!chapters || chapters.length === 0) return null;
        
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const windowCenter = windowHeight / 2;
        let visibleChapterIndex = null;
        let bestVisibility = 0;
        
        // Find the chapter with the most visibility in the viewport
        chapters.forEach((chapter) => {
            const rect = chapter.getBoundingClientRect();
            const chapterTop = Math.max(0, rect.top);
            const chapterBottom = Math.min(windowHeight, rect.bottom);
            const visibleHeight = Math.max(0, chapterBottom - chapterTop);
            
            // If this chapter is more visible than the previous best, update
            if (visibleHeight > bestVisibility) {
                bestVisibility = visibleHeight;
                visibleChapterIndex = parseInt(chapter.id.split("-")[1]);
            }
            
            // If the chapter center is close to the window center, immediately select it
            const chapterCenter = rect.top + (rect.height / 2);
            if (Math.abs(chapterCenter - windowCenter) < 100) {
                visibleChapterIndex = parseInt(chapter.id.split("-")[1]);
                bestVisibility = Infinity; // Ensure this is selected
            }
        });
        
        return visibleChapterIndex;
    }
    
    // Populate chapter menu
    function populateChapterMenu() {
        menuList.innerHTML = '';
        
        // Update total chapters count
        const totalChaptersEl = document.getElementById('total-chapters');
        if (totalChaptersEl) {
            totalChaptersEl.textContent = chapterData.length;
        }
        
        // Update current reading progress
        updateChapterStats();
        
        chapterData.forEach((chapter, index) => {
            const li = document.createElement('li');
            
            // Create left content container for better layout
            const leftContent = document.createElement('div');
            leftContent.className = 'left-content';
            
            // Create chapter number element with proper formatting
            const chapterNum = document.createElement('span');
            chapterNum.className = 'chapter-number';
            chapterNum.textContent = chapter.chapterNumber.toString().padStart(2, '0');
            
            // Create chapter title element
            const chapterTitle = document.createElement('span');
            chapterTitle.className = 'chapter-title';
            
            // No need to truncate the title as we now handle long text with CSS
            chapterTitle.textContent = chapter.title;
            
            // Add elements to left content
            leftContent.appendChild(chapterNum);
            leftContent.appendChild(chapterTitle);
            
            // Add left content to list item
            li.appendChild(leftContent);
            
            // Add unread indicator for chapters that haven't been read yet
            const currentChapterNum = getCurrentChapter();
            if (chapter.chapterNumber > currentChapterNum) {
                const unreadIndicator = document.createElement('span');
                unreadIndicator.className = 'unread-indicator';
                li.appendChild(unreadIndicator);
            }
            
            // Add data attributes for easier selection
            li.setAttribute('data-chapter', chapter.chapterNumber);
            
            // Add animation order for staggered entrance
            li.style.setProperty('--animation-order', index);
            
            // Mark the active chapter
            if (chapter.chapterNumber === currentChapterNum) {
                li.classList.add('active');
            }
            
            // Add click event listener for navigation
            li.addEventListener('click', () => {
                scrollToChapter(chapter.chapterNumber);
                chapterMenu.classList.remove('open');
                overlay.classList.remove('active');
            });
            
            menuList.appendChild(li);
        });
        
        // Highlight the current chapter
        highlightCurrentChapter();
    }
    
    // Update chapter statistics in the chapter menu
    function updateChapterStats() {
        const totalChaptersElement = document.getElementById('total-chapters');
        const currentProgressElement = document.getElementById('current-progress');
        
        if (window.chapterData && window.chapterData.length > 0) {
            // Update total chapters
            totalChaptersElement.textContent = window.chapterData.length;
            
            // Get current chapter and calculate progress
            const currentChapter = getVisibleChapter();
            if (currentChapter) {
                const progress = Math.round((currentChapter / window.chapterData.length) * 100);
                currentProgressElement.textContent = `${progress}%`;
            } else {
                currentProgressElement.textContent = '0%';
            }
        } else {
            totalChaptersElement.textContent = '0';
            currentProgressElement.textContent = '0%';
        }
    }
    
    // Show loading spinner
    function showLoadingSpinner() {
        loadingSpinner.style.display = 'flex';
    }
    
    // Hide loading spinner
    function hideLoadingSpinner() {
        loadingSpinner.style.display = 'none';
    }
    
    // ===== Settings functions =====
    
    // Apply settings to UI
    function applyAllSettings() {
        applyFontSize();
        applyLineHeight();
        applyFontFamily();
        applyTheme(settings.theme);
        
        // Update controls to reflect current settings
        fontSizeSlider.value = settings.fontSize;
        fontSizeDisplay.textContent = settings.fontSize + 'px';
        
        lineHeightSlider.value = settings.lineHeight;
        lineHeightDisplay.textContent = settings.lineHeight.toFixed(1);
        
        sentenceGroupDisplay.textContent = settings.sentenceGroup;
        
        // Update font family selection
        fontOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-font') === settings.fontFamily) {
                option.classList.add('selected');
            }
        });
        
        // Update theme selection
        themeOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-theme') === settings.theme) {
                option.classList.add('selected');
            }
        });
        
        // Update TTS controls
        ttsSpeedSlider.value = settings.ttsSpeed;
        ttsSpeedDisplay.textContent = settings.ttsSpeed.toFixed(1) + 'x';
        ttsHighlightCheckbox.checked = settings.ttsHighlight;
    }
    
    // Apply font size
    function applyFontSize() {
        document.documentElement.style.setProperty('--base-font-size', `${settings.fontSize}px`);
    }
    
    // Apply line height
    function applyLineHeight() {
        document.documentElement.style.setProperty('--line-height', settings.lineHeight);
    }
    
    // Apply font family
    function applyFontFamily() {
        document.documentElement.style.setProperty('--font-family', settings.fontFamily);
    }
    
    // Apply theme
    function applyTheme(theme) {
        document.body.classList.remove('theme-dark', 'theme-black', 'theme-sepia');
        document.body.classList.add(`theme-${theme}`);
        
        // Update theme icon
        if (theme === 'dark' || theme === 'black') {
            themeSettingsBtn.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            themeSettingsBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // Update regex replace list
    function updateRegexReplaceList() {
        regexReplaceListEl.innerHTML = '';
        regexCountEl.textContent = `(${regexReplaceList.length})`;
        
        regexReplaceList.forEach((item, index) => {
            const li = document.createElement('li');
            
            const regexText = document.createElement('div');
            regexText.className = 'regex-text';
            regexText.textContent = `/${item.match}/ → "${item.replace}"`;
            li.appendChild(regexText);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-regex';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => {
                regexReplaceList.splice(index, 1);
                updateRegexReplaceList();
            });
            li.appendChild(deleteBtn);
            
            regexReplaceListEl.appendChild(li);
        });
    }
    
    // DOM elements for regex modal
    const regexModal = document.getElementById('regex-modal');
    const closeRegexModalBtn = document.getElementById('close-regex-modal');
    const regexMatchInput = document.getElementById('regex-match-input');
    const regexReplaceInput = document.getElementById('regex-replace-input');
    const addRegexRuleBtn = document.getElementById('add-regex-rule');
    const regexRulesList = document.getElementById('regex-rules-list');
    const regexCountDisplay = document.getElementById('regex-count-display');
    const saveRegexSettingsBtn = document.getElementById('save-regex-settings');
    
    // Regex settings handling
    regexSettingsBtn.addEventListener('click', () => {
        regexModal.classList.add('open');
        overlay.classList.add('active');
        updateRegexCountDisplay();
    });
    
    closeRegexModalBtn.addEventListener('click', () => {
        regexModal.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    // Add regex rule
    addRegexRuleBtn.addEventListener('click', () => {
        const matchPattern = regexMatchInput.value.trim();
        const replaceWith = regexReplaceInput.value;
        
        if (matchPattern) {
            addRegexRule(matchPattern, replaceWith);
            regexMatchInput.value = '';
            regexReplaceInput.value = '';
            saveSettings();
        }
    });
    
    // Handle enter key in inputs
    regexReplaceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addRegexReplaceBtn.click();
        }
    });
    
    regexMatchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && regexReplaceInput.value.trim() !== '') {
            addRegexReplaceBtn.click();
        } else if (e.key === 'Enter') {
            regexReplaceInput.focus();
        }
    });
    
    // Save regex settings
    saveRegexSettingsBtn.addEventListener('click', () => {
        saveSettings();
        regexModal.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    // Add a regex replacement rule
    function addRegexRule(matchPattern, replaceWith) {
        // Add to the regexReplaceList array
        regexReplaceList.push({
            match: matchPattern,
            replace: replaceWith
        });
        
        // Update the UI
        updateRegexRulesList();
    }
    
    // Update the list of regex rules in the UI
    function updateRegexRulesList() {
        regexRulesList.innerHTML = '';
        
        regexReplaceList.forEach((rule, index) => {
            const li = document.createElement('li');
            
            const pattern = document.createElement('span');
            pattern.className = 'pattern';
            pattern.textContent = rule.match;
            
            const replacement = document.createElement('span');
            replacement.className = 'replacement';
            replacement.textContent = '→ ' + rule.replace;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-rule';
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            removeBtn.addEventListener('click', () => {
                regexReplaceList.splice(index, 1);
                updateRegexRulesList();
                updateRegexCountDisplay();
                saveSettings();
            });
            
            li.appendChild(pattern);
            li.appendChild(replacement);
            li.appendChild(removeBtn);
            regexRulesList.appendChild(li);
        });
        
        updateRegexCountDisplay();
    }
    
    // Update the regex count display
    function updateRegexCountDisplay() {
        regexCountDisplay.textContent = `(${regexReplaceList.length})`;
    }
    
    // Save settings to local storage
    function saveSettings() {
        const storyName = document.getElementById('story-name').textContent
            .toLowerCase().replace(/\s+/g, '_');
        
        if (!storyName) return;
        
        const savedData = {
            settings: settings,
            regexReplaceList: regexReplaceList,
            currentChapterIndex: currentChapterIndex,
            scrollPosition: window.scrollY || document.documentElement.scrollTop
        };
        
        localStorage.setItem(`story_${storyName}`, JSON.stringify(savedData));
    }
    
    // Load settings from local storage
    function loadStoredSettings() {
        const storyName = document.getElementById('story-name').textContent
            .toLowerCase().replace(/\s+/g, '_');
        
        if (!storyName) return;
        
        const savedData = localStorage.getItem(`story_${storyName}`);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // Apply saved settings
                if (data.settings) {
                    settings = { ...settings, ...data.settings };
                }
                
                // Apply saved regex replacements
                if (data.regexReplaceList) {
                    regexReplaceList = data.regexReplaceList;
                    updateRegexReplaceList();
                }
                
                // Load saved chapter and scroll position
                if (data.currentChapterIndex !== undefined) {
                    // Use the scrollToChapter function for chapter navigation
                    scrollToChapter(data.currentChapterIndex);
                    
                    // Restore scroll position after a delay to ensure content is rendered
                    if (data.scrollPosition) {
                        setTimeout(() => {
                            window.scrollTo({
                                top: data.scrollPosition,
                                behavior: 'auto'
                            });
                        }, 200);
                    }
                }
                
                // Apply all settings to UI
                applyAllSettings();
                
            } catch (e) {
                console.error("Error loading saved settings:", e);
            }
        }
    }
    
    // Save current position
    function saveCurrentPosition() {
        saveSettings();
    }
    
    // ===== Text-to-Speech functions =====
    
    // Toggle Text-to-Speech functionality
    function toggleTextToSpeech() {
        // Use the enhanced TTS functionality from tts.js
        if (window.enhancedToggleTTS) {
            window.enhancedToggleTTS();
        }
    }
    
    // ===== Reading progress tracking =====
    
    // Update position on scroll
    window.addEventListener('scroll', () => {
        // Save position after scroll stops (debounce)
        clearTimeout(window.scrollEndTimer);
        window.scrollEndTimer = setTimeout(saveCurrentPosition, 500);
    });
    
    // ===== Tap and swipe handling for mobile =====
    
    // Add tap zones for navigation
    const tapLeft = document.createElement('div');
    tapLeft.className = 'tap-left';
    document.body.appendChild(tapLeft);
    
    const tapRight = document.createElement('div');
    tapRight.className = 'tap-right';
    document.body.appendChild(tapRight);
    
    // Visual feedback element
    const tapFeedback = document.createElement('div');
    tapFeedback.className = 'tap-feedback';
    document.body.appendChild(tapFeedback);
    
    // Tap handlers
    tapLeft.addEventListener('click', (e) => {
        showTapFeedback(e.clientX, e.clientY);
        window.scrollBy({ top: -window.innerHeight * 0.9, behavior: 'smooth' });
    });
    
    tapRight.addEventListener('click', (e) => {
        showTapFeedback(e.clientX, e.clientY);
        window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
    });
    
    // Show visual feedback for taps
    function showTapFeedback(x, y) {
        tapFeedback.style.left = x + 'px';
        tapFeedback.style.top = y + 'px';
        tapFeedback.style.animation = 'none';
        
        // Trigger reflow
        void tapFeedback.offsetWidth;
        
        tapFeedback.style.animation = 'tapFeedback 0.5s ease-out';
    }
    
    // ===== Initialize =====
    
    // Apply initial settings
    applyAllSettings();
    
    // Chapter search functionality
    const chapterSearch = document.getElementById('chapter-search');
    
    chapterSearch.addEventListener('input', () => {
        const searchTerm = chapterSearch.value.toLowerCase();
        const menuItems = menuList.querySelectorAll('li');
        
        menuItems.forEach(item => {
            const chapterTitle = item.textContent.toLowerCase();
            if (chapterTitle.includes(searchTerm) || searchTerm === '') {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // Prevent zoom on double tap
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // Prevent pull-to-refresh on mobile
    document.body.addEventListener('touchmove', (e) => {
        if (window.scrollY === 0 && e.touches[0].clientY > 0) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Check if an element is in the viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Handle chapter count indicator
    function updateChapterIndicator(currentChapterNum) {
        const indicator = document.getElementById('chapter-count-indicator');
        const currentChapterDisplay = document.getElementById('current-chapter-display');
        const totalChaptersDisplay = document.getElementById('total-chapters-display');
        
        if (indicator && currentChapterDisplay && totalChaptersDisplay) {
            currentChapterDisplay.textContent = currentChapterNum;
            totalChaptersDisplay.textContent = chapterData.length;
            
            // Show indicator briefly
            indicator.classList.add('visible');
            
            // Hide after 2 seconds
            clearTimeout(window.chapterIndicatorTimeout);
            window.chapterIndicatorTimeout = setTimeout(() => {
                indicator.classList.remove('visible');
            }, 2000);
        }
    }
    
    // Update getVisibleChapter function to also update the indicator
    function getVisibleChapter() {
        const chapters = document.querySelectorAll('.chapter');
        if (!chapters || chapters.length === 0) return null;
        
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const windowCenter = windowHeight / 2;
        let visibleChapterIndex = null;
        let bestVisibility = 0;
        
        // Find the chapter with the most visibility in the viewport
        chapters.forEach((chapter) => {
            const rect = chapter.getBoundingClientRect();
            const chapterTop = Math.max(0, rect.top);
            const chapterBottom = Math.min(windowHeight, rect.bottom);
            const visibleHeight = Math.max(0, chapterBottom - chapterTop);
            
            // If this chapter is more visible than the previous best, update
            if (visibleHeight > bestVisibility) {
                bestVisibility = visibleHeight;
                visibleChapterIndex = parseInt(chapter.id.split("-")[1]);
            }
            
            // If the chapter center is close to the window center, immediately select it
            const chapterCenter = rect.top + (rect.height / 2);
            if (Math.abs(chapterCenter - windowCenter) < 100) {
                visibleChapterIndex = parseInt(chapter.id.split("-")[1]);
                bestVisibility = Infinity; // Ensure this is selected
            }
        });
        
        // Update the chapter indicator
        updateChapterIndicator(visibleChapterIndex);
        
        return visibleChapterIndex;
    }
    
    // Helper function to get current chapter number
    function getCurrentChapter() {
        // Try to get from localStorage first
        const savedPosition = localStorage.getItem('currentReading');
        if (savedPosition) {
            try {
                const reading = JSON.parse(savedPosition);
                if (reading.currentChapter) {
                    return reading.currentChapter;
                }
            } catch (e) {
                console.error('Error parsing saved position:', e);
            }
        }
        
        // Fallback to the visible chapter in viewport
        return getVisibleChapter() || 1;
    }
    
    
    


    
});



function navigateToPreviousChapter() {
    // Get the current chapter number
    const currentChapter = getCurrentChapterInView();
    if (!currentChapter) return;
    
    // Find the previous chapter number
    const prevChapterIdx = window.chapterData.findIndex(c => c.chapterNumber === currentChapter) - 1;
    if (prevChapterIdx >= 0) {
        const prevChapterNum = window.chapterData[prevChapterIdx].chapterNumber;
        scrollToChapter(prevChapterNum);
        showNavigationFeedback('prev');
    }
}

function navigateToNextChapter() {
    // Get the current chapter number
    const currentChapter = getCurrentChapterInView();
    if (!currentChapter) return;
    
    // Find the next chapter number
    const nextChapterIdx = window.chapterData.findIndex(c => c.chapterNumber === currentChapter) + 1;
    if (nextChapterIdx < window.chapterData.length) {
        const nextChapterNum = window.chapterData[nextChapterIdx].chapterNumber;
        scrollToChapter(nextChapterNum);
        showNavigationFeedback('next');
    }
}

// Function to get the current chapter in view
function getCurrentChapterInView() {
    // Check if we have a sticky title from IntersectionObserver
    if (window.currentStickyTitle) {
        const chapterDiv = window.currentStickyTitle.closest('.chapter');
        if (chapterDiv) {
            return parseInt(chapterDiv.getAttribute('data-chapter-number'));
        }
    }
    
    // Otherwise calculate based on scroll position
    const chapters = document.querySelectorAll('.chapter');
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;
    const middleOfViewport = scrollY + (viewportHeight / 3); // Check 1/3 down the viewport
    
    for (const chapter of chapters) {
        const rect = chapter.getBoundingClientRect();
        const offsetTop = rect.top + scrollY;
        const offsetBottom = offsetTop + rect.height;
        
        if (middleOfViewport >= offsetTop && middleOfViewport < offsetBottom) {
            return parseInt(chapter.getAttribute('data-chapter-number'));
        }
    }
    
    // Fallback to first visible chapter
    for (const chapter of chapters) {
        const rect = chapter.getBoundingClientRect();
        if (rect.top < viewportHeight && rect.bottom > 0) {
            return parseInt(chapter.getAttribute('data-chapter-number'));
        }
    }
    
    // If no chapter is in view, return the first chapter number
    return window.chapterData && window.chapterData.length > 0 ? 
        window.chapterData[0].chapterNumber : null;
}

// Add scroll event for chapter-title-main sticky behavior
document.addEventListener('scroll', function() {
    const chapterTitles = document.querySelectorAll('.chapter-title-main');
    if (chapterTitles.length > 0) {
        chapterTitles.forEach(title => {
            const rect = title.getBoundingClientRect();
            if (rect.top <= 0) {
                title.classList.add('sticky');
            } else {
                title.classList.remove('sticky');
            }
        });
    }
});

// Setup sticky behavior for chapter titles
    function setupStickyChapterTitles() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.target.classList.contains('chapter-title-main')) {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('sticky');
                    } else {
                        // Check if the title is above the viewport
                        if (entry.boundingClientRect.top < 0) {
                            entry.target.classList.add('sticky');
                        } else {
                            entry.target.classList.remove('sticky');
                        }
                    }
                }
            });
        }, { threshold: [0], rootMargin: "-1px 0px 0px 0px" });

        // Observe all chapter titles
        document.querySelectorAll('.chapter-title-main').forEach(title => {
            observer.observe(title);
        });
    }
