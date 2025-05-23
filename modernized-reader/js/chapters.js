// Chapters management functionality


/**
 * ChaptersManager handles chapter loading, parsing, and display
 */



class ChaptersManager {
    /**
     * Initialize chapters manager
     */
    constructor(data) {
        this.chapterData = [];
        this.currentIndex = 1;
        this.batchSize = CONFIG.ui.batchSize;
        this.maxElements = CONFIG.ui.maxChaptersInDom;
        this.lastScrollPosition = 0;
        this.scrollDirection = '';
        this.currentReadAloud = '';
        this.currentReadAloudChapter = ''
        this.lazyLoad = { next: 0, prev: 0 };

        // Initialize Edge Read Aloud tracking
        this.initMutationObserver();
    }

    /**
     * Process file content into chapters
     * @param {File} file - The uploaded file
     * @returns {Promise<Array>} - Array of processed chapters
     */
    async processFile(file) {
        try {
            uiManager.showLoading();
            Utils.log('Processing file', file.name);

            // Get story name from file name
            // const storyName = file.name.replace(/\.[^/.]+$/, '');

            // Check if we already have a compressed version of this story
            // if (this.checkAndLoadCompressedStory(storyName)) {
            //     Utils.log('Loaded compressed version of story', storyName);
            //     uiManager.hideLoading();
            //     return this.chapterData;
            // }

            // If no compressed version exists, process the file normally
            Utils.log('No compressed version found, processing file');

            // Read file content
            const content = await this.readFileContent(file);

            // Get lines per sentence setting
            

            // Split content into chapters
            const chapters = this.splitIntoChapters(content);
            this.chapterData = chapters;

            // Update the story name based on the file name
            const storyName = file.name.replace(/\.[^/.]+$/, '');
            uiManager.updateStoryTitle(storyName);

            // Set story context for storage
            if (storageManager) {
                storageManager.setCurrentStory(storyName);
            }

            // Clear old content
            // uiManager.clearContent();

            // Populate the chapter menu
            this.populateChapterMenu(chapters);

            // Initialize lazy loading of chapter content
            this.initLazyLoading();

            // Apply stored settings
            if (settingsManager) {
                settingsManager.applyStoredSettings();
            }

            // Restore saved scroll position
            this.restoreScrollPosition();


            Utils.log('File processing complete', chapters.length + ' chapters');
            Utils.showToast(`"${storyName}" loaded with ${chapters.length} chapters`, 'success');

            // Compress and save chapters if there are enough chapters
            // Skip compression if the story was loaded from a compressed file
            // const wasLoadedFromCompressedFile = file.name.toLowerCase().endsWith('.story.bin');
            // if (chapters.length > 5 && !wasLoadedFromCompressedFile) {
            //     // Use setTimeout to avoid blocking the UI
            //     setTimeout(() => {
            //         this.compressAndSaveChapters(chapters, storyName)
            //             .then(success => {
            //                 if (success) {
            //                     Utils.log('Story compressed and saved to storage successfully');
            //                 }
            //             })
            //             .catch(err => {
            //                 Utils.log('Error in background compression process', err);
            //             });
            //     }, 1000);
            // }

            return chapters;
        } catch (error) {
            Utils.log('Error processing file', error);
            Utils.showToast('Error processing file', 'error');
            throw error;
        } finally {
            uiManager.hideLoading();
        }
    }

    /**
     * Read the content of a file
     * @param {File} file - The file to read
     * @returns {Promise<string>} - File content as text
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Split file content into chapters
     * @param {string} content - Raw file content
     * @param {number} linesPerSentence - Number of lines to group as a sentence
     * @returns {Array} - Array of chapter objects
     */
    splitIntoChapters(content, linesPerSentence = 3) {
        const regexSplitStory = "#Chương";
        function isNumber(value) {
            return /^\d+$/.test(value);
        }

        // Pre-process content to identify chapter markers
        const storyEdited = content
            .split(/\n/)
            .filter(Boolean)
            .map((line) => {
                let lineContent = line.trim();
                const lines = line.replace(/\t/g, "").trim().split(" ");
                const firstItem = lines.shift();
                let chapterNumber = lines.shift();
                const isChapterNumber =
                    chapterNumber && isNumber(chapterNumber.replace(/\D/g, ""));
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
            let [chapterName = "", chapterNumber = "", chapterContent = ""] = [
                "",
                "",
                "",
            ];
            if (chapter.includes("_")) {
                [chapterName = "", chapterNumber = "", chapterContent = ""] =
                    chapter.split("_");
            } else {
                chapterContent = chapter;
            }

            chapterNumber = +chapterNumber.replace(/\D/g, "") || 0;

            // Use chunkArray to split content into sentences
            const contentLines = chapterContent
                .split("\n")
                .filter(Boolean)
                .map((line) => line.trim());

            // const combinedContent = Utils.chunkArray(contentLines, linesPerSentence).map((chunk) => chunk.join(""));
            return {
                chapterNumber,
                title: `Chương ${chapterNumber} ${chapterName.trim()}`,
                content: contentLines,
            };
        });
    }

    /**
     * Populate the chapter menu with links
     * @param {Array} chapters - Array of chapter objects
     */
    populateChapterMenu(chapters) {
        const menuList = document.getElementById('menu-list');
        if (!menuList) return;

        // Clear existing menu items
        menuList.innerHTML = '';

        // Add chapter items
        chapters.forEach((chapter, index) => {
            const listItem = document.createElement('li');
            listItem.id = `menu-item-${index}`;
            listItem.setAttribute('data-index', index.toString());

            const link = document.createElement('a');
            const storyName = document.getElementById('story-name').textContent
                .toLowerCase()
                .replace(/\s+/g, '_');

            link.id = `chapter-link-${storyName}-${index}`;
            link.href = `#chapter-${index}`;
            link.textContent = chapter.title;
            link.dataset.chapterIndex = index.toString();

            // Add click event to scroll to chapter
            link.addEventListener('click', (event) => {
                event.preventDefault();

                const chapterIndex = parseInt(event.currentTarget.dataset.chapterIndex, 10);

                // Remove active class from all items
                const allItems = document.querySelectorAll('#menu-list li');
                allItems.forEach(item => item.classList.remove('active'));

                // Add active class to current item
                listItem.classList.add('active');

                // Scroll to selected chapter
                this.scrollToChapter(chapterIndex);

                // Close menu
                uiManager.closeChapterMenu();
            });

            listItem.appendChild(link);
            menuList.appendChild(listItem);
        });

        Utils.log('Chapter menu populated with', chapters.length + ' chapters');
    }

    /**
     * Initialize lazy loading of chapter content
     */
    initLazyLoading() {
        const container = document.getElementById('chapter-content');
        if (!container) return;

        // Clear container
        container.innerHTML = '';
        // Load initial batch of chapters
        this.loadMoreData('down');

        // Add scroll event listener
        container.addEventListener('scroll', Utils.throttle(() => {
            // Load more chapters when scrolling down
            const chapterContent = document.getElementById('chapter-content');
            const currentChapterIndex = Utils.getVisibleChapter(chapterContent.childNodes);

            const currentScrollTop = chapterContent.scrollTop;


            let scrollDirection = '';
            let firstChild = chapterContent.firstChild
            if (firstChild.classList.contains('current-reading')) {
                firstChild = container.childNodes[1];
            }


            const firstChapter = +(firstChild.id.split('-')[1] ?? 0);
            const lastChapter = +(chapterContent.lastChild.id.split('-')[1] ?? 0);


            if (firstChapter === currentChapterIndex && currentScrollTop < this.lastScrollPosition) {
                scrollDirection = 'up';
            }

            else if (lastChapter === currentChapterIndex && currentScrollTop > this.lastScrollPosition) {
                scrollDirection = 'down'
            }


            if (scrollDirection) {
                this.scrollDirection = scrollDirection;
                this.loadMoreData(scrollDirection)
            }

            this.lastScrollPosition = chapterContent.scrollTop;

            // Save current scroll position
            // this.saveScrollPosition();
        }, 500));

        // Fix for mouse wheel scroll on desktop
        // container.addEventListener('wheel', (event) => {
        //     // Allow default wheel behavior
        //     event.stopPropagation();
        // }, { passive: true });

        Utils.log('Lazy loading initialized');
    }

    /**
     * Load more chapter data based on scroll direction
     * @param {string} direction - 'up' or 'down'
     */
    loadMoreData(direction, chapter = null) {
        const container = document.getElementById('chapter-content');
        if (!container || !this.chapterData || this.chapterData.length === 0) return;

        if (direction === 'down') {
            // Get the last chapter ID in the DOM
            const next = chapter ?? +(
                document.querySelector('#chapter-content')?.lastChild?.id?.split('-')[1] ?? 0
            ) + 1;

            // Get the next batch of chapters
            const nextBatch = this.chapterData
                .filter(
                    (chapter) =>
                        chapter.chapterNumber >= next &&
                        chapter.chapterNumber < next + this.batchSize
                )
                .sort((a, b) => a.chapterNumber - b.chapterNumber);

            // Append new chapters
            nextBatch.forEach((chapter) => {
                if (!document.getElementById(`chapter-${chapter.chapterNumber}`)) {
                    const chapterDiv = this.createChapterElement(chapter, direction);
                    container.appendChild(chapterDiv);
                    if (container.children.length > this.maxElements) {
                        const isReading = container.firstChild.classList.contains('current-reading')
                        if (isReading === false) {
                            container.removeChild(container.firstChild);
                        } else {
                            const secondChild = container.children[1]
                            container.removeChild(secondChild);
                        }
                    }
                }

            });
            container.style.height = `${container.scrollHeight}px`;
        }
        else if (direction === 'up') {
            // Get the first chapter ID in the DOM
            const isReading = container.firstChild.classList.contains('current-reading')
            let childNode = container.firstChild;
            if (isReading) {
                childNode = container.childNodes[1];
            }
            const prev = +(childNode?.id?.split('-')[1] ?? 0)
            const previousBatch = this.chapterData
                .filter(
                    (chapter) =>
                        chapter.chapterNumber >= prev - this.batchSize &&
                        chapter.chapterNumber < prev
                )
                .sort((a, b) => b.chapterNumber - a.chapterNumber);

            previousBatch.forEach((chapter) => {
                if (!document.getElementById(`chapter-${chapter.chapterNumber}`)) {
                    const chapterDiv = this.createChapterElement(chapter, direction);
                    const beforeNode = document.getElementById(`chapter-${chapter.chapterNumber + 1}`)
                    container.insertBefore(chapterDiv, beforeNode);
                    if (container.children.length > this.maxElements) {
                        const isReadingChapter = container.lastChild.classList.contains('current-reading')
                        container.removeChild(container.lastChild);
                    }
                }
            });
            // Adjust container height to match current content - this is key for lazy loading
            container.style.height = `${container.scrollHeight}px`;
        }

        // Highlight the currently visible chapter in menu
        this.highlightActiveChapter();
    }

    /**
     * Create a chapter element
     * @param {Object} chapter - Chapter data
     * @returns {HTMLElement} - Chapter div element
     */
    createChapterElement(chapter) {

        const chapterDiv = document.createElement('div');
        chapterDiv.classList.add('chapter');
        chapterDiv.id = `chapter-${chapter.chapterNumber}`;

        const title = document.createElement('div');
        title.classList.add('chapter-title');
        title.textContent = chapter.title;
        chapterDiv.appendChild(title);


        const chapterContent = document.createElement('div');
        chapterContent.classList.add('chapter-story');
        chapterDiv.appendChild(chapterContent);

        const storedReplacements = [
            ...storageManager.load('regexReplacements') ?? [],
            ...(CONFIG.defaults.regexReplacements ?? [])
        ];

        const linesPerSentence = settingsManager ? settingsManager.getSettingValue('linesPerSentence') :CONFIG.defaults.linesPerSentence;

        const paragraphs =  Utils.chunkArray(chapter.content, linesPerSentence);
        paragraphs.forEach((paragraph, index) => {
            let sentences = paragraph.join(' ').trim();
            storedReplacements.forEach(({ match, replace, isPattern }) => {
                const mathItem = match;
                const replaceItem = replace;
                if (isPattern) {
                    sentences = sentences.replace(mathItem, replaceItem);
                }
                else {
                    const regex = new RegExp(mathItem, 'gi');
                    sentences = sentences.replace(regex, replaceItem);
                }
            });

            const p = document.createElement('p');
            p.id = `items-${chapter.chapterNumber}-${index}`;
            p.textContent = sentences;      
            chapterContent.appendChild(p);
        });
        return chapterDiv;
    }

    /**
     * Ensure the chapter is loaded in the DOM before scrolling
     * @param {number} index - Chapter index
     */
    ensureChapterInDOM(index) {
        const container = document.getElementById('chapter-content');
        if (!container) return;

        if (!document.getElementById(`chapter-${index}`)) {
            // Calculate batch range
            const start = Math.max(1, index - this.batchSize);
            const end = Math.min(
                this.chapterData.length + 1,
                index + this.batchSize
            );


            // Clear container and load the required batch
            container.innerHTML = '';
            this.chapterData
                .filter(
                    (chapter) =>
                        chapter.chapterNumber >= start &&
                        chapter.chapterNumber < end
                )
                .forEach((chapter, index) => {
                    const chapterDiv = this.createChapterElement(chapter);
                    container.appendChild(chapterDiv);
                });
        }
    }

    /**
     * Scroll to a specific chapter
     * @param {number} index - Chapter index
     */
    scrollToChapter(index, chapterItem) {
        this.ensureChapterInDOM(index);

        let chapterElement = document.getElementById(`chapter-${index}`);
        if (chapterItem) {
            chapterElement = document.getElementById(chapterItem)
        }
        if (chapterElement) {
            // Sử dụng try-catch để xử lý lỗi có thể xảy ra khi scroll
            try {
                // Thử phương pháp 1: scrollIntoView
                if (!chapterItem) {
                    chapterElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    return;
                }
                chapterElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                chapterElement.style.color = '#c4831a';
                setTimeout(() => {
                    chapterElement.style = '';
                }, 3000);
            } catch (error) {
                // Nếu có lỗi, sử dụng phương pháp 2
                const container = document.getElementById('chapter-content');
                if (container) {
                    const offsetTop = chapterElement.offsetTop - container.offsetTop;
                    container.scrollTop = offsetTop;
                }
                Utils.log('Error using scrollIntoView, fallback to manual scroll', error);
            }

            // Update active menu item
            const menuItems = document.querySelectorAll('#menu-list li');
            menuItems.forEach((item) => {
                item.classList.remove('active');
            });

            const menuItem = document.getElementById(`menu-item-${index}`);
            if (menuItem) {
                menuItem.classList.add('active');
            }

            Utils.log('Scrolled to chapter', index);
        }
    }

    /**
     * Highlight the currently visible chapter in menu
     */
    highlightActiveChapter() {
        const menuItems = document.querySelectorAll('#menu-list li');
        const chapters = document.querySelectorAll('.chapter');
        const currentChapterIndex = Utils.getVisibleChapter(chapters);

        // Remove active class from all items
        menuItems.forEach((item) => item.classList.remove('active'));

        // Add active class to current chapter
        if (currentChapterIndex !== null && currentChapterIndex !== undefined) {
            const menuItem = document.getElementById(`menu-item-${currentChapterIndex}`);
            if (menuItem) {
                menuItem.classList.add('active');
            }
        }
    }

    /**
     * Save current scroll position
     */
    saveScrollPosition() {
        const container = document.getElementById('chapter-content');
        if (!container) return;

        const chapters = document.querySelectorAll('.chapter');
        this.lastScrollPosition = container.scrollTop;

        if (storageManager) {
            storageManager.saveScrollPosition(container.scrollTop);
            storageManager.saveChapterNumber(Utils.getVisibleChapter(chapters));
        }
    }

    /**
     * Restore saved scroll position
     */
    restoreScrollPosition() {
        if (!storageManager) return;

        const chapterNumber = storageManager.loadChapterNumber() ?? 1;
        if (chapterNumber === 1) {
            this.scrollToChapter(1);
            return;
        }

        const [, numberChapter, indexItem] = chapterNumber.split('-');
        if (numberChapter && indexItem) {
            this.scrollToChapter(+numberChapter, chapterNumber);
            Utils.log('Restored scroll position', { chapter: chapterNumber });
            return
        }
        this.scrollToChapter(1);
    }

    /**
     * Apply regex replacements to chapter content
     * @param {Array} regexReplacements - Array of regex replacement objects
     */
    applyRegexReplacements(regexReplacements, isRevert = false) {
        if (!regexReplacements || !Array.isArray(regexReplacements) || regexReplacements.length === 0) {
            return;
        }

        const paragraphs = document.querySelectorAll('#chapter-content p');
        if (!paragraphs.length) return;

        // Apply each regex replacement
        regexReplacements.forEach(({ match, replace }) => {
            try {
                let mathItem = match;
                let replaceItem = replace;
                if (isRevert) {
                    mathItem = replace;
                    replaceItem = match
                }
                paragraphs.forEach(p => {

                    if (mathItem.startsWith('/' && mathItem.endsWith('/'))) {
                        p.textContent = p.textContent.replace(mathItem, replaceItem);
                    } else {
                        const regex = new RegExp(mathItem, 'gi');
                        p.textContent = p.textContent.replace(regex, replaceItem);
                    }

                });
            } catch (error) {
                Utils.log('Error applying regex', { match, replace, error });
            }
        });

        Utils.log('Applied regex replacements', regexReplacements.length);
    }

    /**
     * Checks if the browser supports the compression features needed
     * @returns {boolean} - Whether compression is supported
     */
    checkCompressionSupport() {
        const hasCompressionStream = typeof CompressionStream !== 'undefined';
        const hasDecompressionStream = typeof DecompressionStream !== 'undefined';

        if (!hasCompressionStream || !hasDecompressionStream) {
            Utils.log('Compression features not supported in this browser', {
                compression: hasCompressionStream,
                decompression: hasDecompressionStream
            });
            return false;
        }

        return true;
    }

    /**
     * Compresses and saves chapters data to localStorage
     * @param {Array} chapters - Array of chapter objects from splitIntoChapters
     * @param {string} storyName - Name of the story
     * @returns {Promise<boolean>} - True if compression and saving succeeded
     */
    async compressAndSaveChapters(chapters, storyName) {
        if (!chapters || chapters.length === 0) {
            Utils.log('No chapters to compress');
            return false;
        }

        // Check browser compatibility for compression features
        if (!this.checkCompressionSupport()) {
            Utils.showToast('Story compression not supported in this browser', 'warning');
            return false;
        }

        try {
            Utils.log('Starting compression of', chapters.length, 'chapters');

            // Step 1: Build a global dictionary of words
            const allWords = new Set();
            const allTitles = [];

            // Extract all words from all chapters and collect titles
            chapters.forEach(chapter => {
                // Add title words to dictionary
                allTitles.push(chapter.title);

                // Process content
                if (Array.isArray(chapter.content)) {
                    chapter.content.forEach(text => {
                        const words = text.split(/\s+/);
                        words.forEach(word => allWords.add(word));
                    });
                }
            });

            // Convert set to array
            const dictionary = Array.from(allWords);
            Utils.log('Dictionary built with', dictionary.length, 'unique words');

            // Step 2: Replace words with dictionary indices
            const compressedChapters = chapters.map(chapter => {
                // Keep chapter number as is
                const compressedChapter = {
                    chapterNumber: chapter.chapterNumber,
                    title: chapter.title // Keep title for now, we'll compress titles separately
                };

                // Compress content by replacing words with indices
                if (Array.isArray(chapter.content)) {
                    compressedChapter.content = chapter.content.map(text => {
                        const words = text.split(/\s+/);
                        return words.map(word => {
                            const index = dictionary.indexOf(word);
                            return index;
                        });
                    });
                }

                return compressedChapter;
            });

            // Step 3: Process titles using a separate technique

            // Step 4: Structure the data for maximum compression
            const compressedData = {
                storyName,
                dictionary, // Global word dictionary
                titles: allTitles, // Array of all titles
                chapters: compressedChapters.map(chapter => ({
                    num: chapter.chapterNumber, // Use shorter key name
                    tidx: allTitles.indexOf(chapter.title), // Index to titles array
                    cont: chapter.content // Already compressed content
                }))
            };

            // Step 5: Serialize the data
            const jsonString = JSON.stringify(compressedData);

            // Step 6: Apply GZIP compression using CompressionStream
            const compressedBlob = await this._compressWithGzip(jsonString);

            // Step 7: Save the compressed file
            const fileName = `${storyName.toLowerCase().replace(/\s+/g, '_')}.story.bin`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(compressedBlob);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);

            const compressionStats = {
                storyName,
                fileName,
                size: Utils.formatFileSize(compressedBlob.size),
                originalSize: Utils.formatFileSize(jsonString.length),
                compressionRatio: `${(jsonString.length / compressedBlob.size).toFixed(2)}x`
            };

            Utils.log('Story compressed and saved', compressionStats);

            // Show more detailed success message
            Utils.showToast(`"${storyName}" compressed and saved successfully. Size: ${compressionStats.size} (${compressionStats.compressionRatio}x compression)`, 'success');

            // Show additional info about what to do with the file
            setTimeout(() => {
                Utils.showToast('You can reload this compressed story file later for faster loading', 'info');
            }, 3000);

            return true;
        } catch (error) {
            Utils.log('Error compressing chapters', error);
            Utils.showToast('Error compressing story data', 'error');
            return false;
        }
    }

    /**
     * Helper method to compress data with GZIP
     * @private
     * @param {string} data - Data to compress
     * @returns {Promise<Blob>} - Compressed data as Blob
     */
    async _compressWithGzip(data) {
        try {
            // Check for CompressionStream support
            if (typeof CompressionStream === 'undefined') {
                Utils.log('CompressionStream not supported, using fallback compression');
                return new Blob([data], { type: 'application/octet-stream' });
            }

            // Convert string to Uint8Array
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data);

            // Create a compression stream
            const cs = new CompressionStream('gzip');
            const writer = cs.writable.getWriter();
            writer.write(bytes);
            writer.close();

            // Return compressed data as blob
            return new Response(cs.readable).blob();
        } catch (error) {
            Utils.log('Compression error, using uncompressed data', error);
            return new Blob([data], { type: 'application/octet-stream' });
        }
    }

    /**
     * Loads compressed story data from a file
     * @param {File} file - Compressed story file
     * @returns {Promise<Array>} - Decompressed chapters array
     */
    async loadCompressedStory(file) {
        try {
            Utils.log('Loading compressed story file', file.name);

            // Read the file content
            const compressedData = await this._readCompressedFile(file);

            // Parse the JSON
            const parsedData = JSON.parse(compressedData);
            const { dictionary, titles, chapters, storyName } = parsedData;

            if (!dictionary || !chapters || !Array.isArray(chapters)) {
                throw new Error('Invalid compressed story format');
            }

            Utils.log('Decompressing story', storyName, 'with', chapters.length, 'chapters');

            // Rebuild chapters from compressed format
            const decompressedChapters = chapters.map(chapter => {
                // Get chapter title from titles array
                const title = titles[chapter.tidx] || `Chapter ${chapter.num}`;

                // Decompress content
                const content = chapter.cont.map(sentenceIndices => {
                    // Convert indices back to words
                    return sentenceIndices.map(index => dictionary[index] || '').join(' ');
                });

                return {
                    chapterNumber: chapter.num,
                    title,
                    content
                };
            });

            // Update UI with story name
            if (window.uiManager) {
                window.uiManager.updateStoryTitle(storyName);
            }

            Utils.log('Story decompression complete', decompressedChapters.length, 'chapters');
            Utils.showToast(`"${storyName}" loaded with ${decompressedChapters.length} chapters (compressed file)`, 'success');

            // Since this is a faster loading method, let's inform the user
            if (storyName && decompressedChapters.length > 10) {
                setTimeout(() => {
                    Utils.showToast('Using compressed file format for faster loading', 'info');
                }, 2000);
            }

            return decompressedChapters;
        } catch (error) {
            Utils.log('Error decompressing story file', error);

            // Provide more specific error messages based on the error type
            if (error.name === 'SyntaxError') {
                Utils.showToast('Error: The compressed story file is corrupted or invalid', 'error');
            } else if (error.message && error.message.includes('Invalid compressed story format')) {
                Utils.showToast('Error: The story file format is not compatible', 'error');
            } else {
                Utils.showToast('Error loading compressed story file', 'error');
            }

            throw error;
        }
    }

    /**
     * Helper to read and decompress file content
     * @private
     * @param {File} file - Compressed file
     * @returns {Promise<string>} - Decompressed string data
     */
    async _readCompressedFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;

                    // Check if we need to decompress (look for gzip magic number)
                    const firstBytes = new Uint8Array(arrayBuffer.slice(0, 2));
                    const isGzipped = firstBytes[0] === 0x1F && firstBytes[1] === 0x8B;

                    if (isGzipped && typeof DecompressionStream !== 'undefined') {
                        // Decompress using DecompressionStream
                        const ds = new DecompressionStream('gzip');
                        const writer = ds.writable.getWriter();
                        writer.write(new Uint8Array(arrayBuffer));
                        writer.close();

                        // Read decompressed data
                        const decompressedResponse = new Response(ds.readable);
                        const decompressedText = await decompressedResponse.text();
                        resolve(decompressedText);
                    } else {
                        // Not compressed or DecompressionStream not available
                        const text = new TextDecoder().decode(arrayBuffer);
                        resolve(text);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Check if a compressed version of the story exists and load it
     * @param {string} storyName - Name of the story to check for
     * @returns {boolean} - True if compressed story was found and loaded
     */
    checkAndLoadCompressedStory(storyName) {
        if (!storyName) return false;

        const storageKey = `compressed_${storyName.toLowerCase().replace(/\s+/g, '_')}`;

        try {
            // Try to get from localStorage first
            let compressedData = localStorage.getItem(storageKey);

            // If not in localStorage, check sessionStorage
            if (!compressedData) {
                compressedData = sessionStorage.getItem(storageKey);
            }

            // If still not found, return false
            if (!compressedData) {
                return false;
            }

            // Parse the compressed data
            const parsedData = JSON.parse(compressedData);

            // Validate data structure
            if (!parsedData.dictionary || !parsedData.chapters || !Array.isArray(parsedData.chapters)) {
                Utils.log('Invalid compressed story format');
                return false;
            }

            // Decompress and load the story
            this.loadDecompressedStory(parsedData);

            Utils.log('Loaded compressed story from storage', {
                storyName,
                chaptersCount: parsedData.chapters.length
            });

            return true;
        } catch (error) {
            Utils.log('Error loading compressed story', error);
            return false;
        }
    }

    /**
     * Load a story from decompressed data
     * @param {Object} decompressedData - The decompressed story data
     */
    loadDecompressedStory(decompressedData) {
        const { dictionary, titles, chapters, storyName } = decompressedData;

        // Rebuild chapters from compressed format
        this.chapterData = chapters.map(chapter => {
            // Get chapter title from titles array
            const title = titles[chapter.tidx] || `Chapter ${chapter.num}`;

            // Decompress content
            let content;

            // Check if content is array of arrays (sentence arrays)
            if (Array.isArray(chapter.cont) && Array.isArray(chapter.cont[0])) {
                content = chapter.cont.map(sentenceIndices => {
                    // Convert indices back to words
                    return sentenceIndices.map(index => dictionary[index] || '').join(' ');
                });
            } else {
                // Fallback if content format is different
                content = [`[Content for chapter ${chapter.num}]`];
            }

            return {
                chapterNumber: chapter.num,
                title,
                content
            };
        });

        // Update UI with story name
        if (window.uiManager) {
            window.uiManager.updateStoryTitle(storyName);
        }

        // Set story context for storage
        if (window.storageManager) {
            window.storageManager.setCurrentStory(storyName);
        }

        // Populate the chapter menu
        this.populateChapterMenu(this.chapterData);

        // Initialize lazy loading of chapter content
        this.initLazyLoading();

        // Apply stored settings
        if (window.settingsManager) {
            window.settingsManager.applyStoredSettings();
        }

        // Restore saved scroll position
        this.restoreScrollPosition();


        Utils.log('Story decompression complete', this.chapterData.length, 'chapters');
        Utils.showToast(`"${storyName}" loaded with ${this.chapterData.length} chapters`, 'success');
    }

    /**
     * Khởi tạo theo dõi thẻ msreadoutspan của Microsoft Edge Read Aloud
     * Được gọi trong constructor
     */
    initMutationObserver() {
        // Kiểm tra xem trình duyệt có phải là Edge không
        const isEdgeBrowser = navigator.userAgent.includes("Edg");
        if (!isEdgeBrowser) return;
        Utils.log('Microsoft Edge detected, initializing Read Aloud tracking');

        // Tạo MutationObserver để theo dõi khi thẻ msreadoutspan được thêm vào DOM
        const isReadAloud = (node) => node.nodeName === 'MSREADOUTSPAN' && node.classList.contains('msreadout-line-highlight');
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (!isReadAloud(node)) break;
                        const nodeId = node.parentElement?.id || false;
                        if (nodeId === false || this.currentReadAloud === nodeId) break;
                        const items = node.parentElement;
                        const currentRead = items.parentElement.parentElement;

                        this.currentReadAloud = nodeId
                        this.currentReadAloudChapter = currentRead.id;
                        storageManager.saveChapterNumber(nodeId);

                        if (!currentRead.classList.contains('current-reading')) {
                            document.querySelector('.current-reading')?.classList?.remove('current-reading')
                            currentRead.classList.add('current-reading')
                        }
                    }
                }
            }
        });

        // Theo dõi các thay đổi trong chapter-content
        const contentElement = document.getElementById('chapter-content');
        if (contentElement) {
            observer.observe(contentElement, {
                childList: true,
                subtree: true
            });

            Utils.log('Read Aloud tracking observer started');
        }
    }


    reloadChapterContent() {
        const chapterContent = document.getElementById("chapter-content");
          const currentChapterIndex = Utils.getVisibleChapter(chapterContent.childNodes);
          if (currentChapterIndex) {
            chapterContent.innerHTML = "";
            this.loadMoreData("down", currentChapterIndex);
          }
    }
}