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

            // Read file content
            const content = await this.readFileContent(file);

            // Get lines per sentence setting
            const linesPerSentence = settingsManager ?
                settingsManager.getSettingValue('linesPerSentence') :
                CONFIG.defaults.linesPerSentence;

            // Split content into chapters
            const chapters = this.splitIntoChapters(content, linesPerSentence);
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

            const combinedContent = Utils.chunkArray(contentLines, linesPerSentence).map(
                (chunk) => chunk.join("")
            );

            return {
                chapterNumber,
                title: `Chương ${chapterNumber} ${chapterName.trim()}`,
                content: combinedContent,
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
            const firstChapter = +(chapterContent.firstChild.id.split('-')[1] ?? 0);
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

            // Save current scroll position
            this.saveScrollPosition();
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
    loadMoreData(direction) {
        const container = document.getElementById('chapter-content');
        if (!container || !this.chapterData || this.chapterData.length === 0) return;

        if (direction === 'down') {
            // Get the last chapter ID in the DOM
            const next = +(
                document.querySelector('#chapter-content')?.lastChild?.id?.split('-')[1] ?? 1
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
                    const chapterDiv = this.createChapterElement(chapter);
                    container.appendChild(chapterDiv);
                }
            });


            // Remove excess chapters from the top
            while (container.children.length > this.maxElements) {
                container.removeChild(container.firstChild);
            }

            // Adjust container height to match current content - this is key for lazy loading
            container.style.height = `${container.scrollHeight}px`;
        }
        else if (direction === 'up') {
            // Get the first chapter ID in the DOM
            const prev = +(
                document.querySelector('#chapter-content').firstChild?.id?.split('-')[1] ?? 1
            );
            // Get the previous batch of chapters
            const previousBatch = this.chapterData
                .filter(
                    (chapter) =>
                        chapter.chapterNumber >= prev - this.batchSize &&
                        chapter.chapterNumber < prev
                )
                .sort((a, b) => b.chapterNumber - a.chapterNumber);

            previousBatch.forEach((chapter) => {
                if (!document.getElementById(`chapter-${chapter.chapterNumber}`)) {
                    const chapterDiv = this.createChapterElement(chapter);
                    container.insertBefore(chapterDiv, container.firstChild);
                }
            });


            // Remove excess chapters from the bottom
            while (container.children.length > this.maxElements) {
                container.removeChild(container.lastChild);
            }

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

        const storedReplacements = storageManager.load('regexReplacements') ?? [];
        chapter.content.forEach((paragraph) => {
            storedReplacements.forEach(({ match, replace }) => {
                const mathItem = match;
                const replaceItem = replace;
                if (mathItem.startsWith('/' && mathItem.endsWith('/'))) {
                    paragraph = paragraph.replace(mathItem, replaceItem);
                }
                else {
                    const regex = new RegExp(mathItem, 'gi');
                    paragraph = paragraph.replace(regex, replaceItem);
                }
            });

            const p = document.createElement('p');
            p.textContent = paragraph
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
                .forEach((chapter) => {
                    const chapterDiv = this.createChapterElement(chapter);
                    container.appendChild(chapterDiv);
                });
        }
    }

    /**
     * Scroll to a specific chapter
     * @param {number} index - Chapter index
     */
    scrollToChapter(index) {
        this.ensureChapterInDOM(index);

        const chapterElement = document.getElementById(`chapter-${index}`);
        if (chapterElement) {
            // Sử dụng try-catch để xử lý lỗi có thể xảy ra khi scroll
            try {
                // Thử phương pháp 1: scrollIntoView
                chapterElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Phương pháp dự phòng: sử dụng scrollTop trực tiếp
                setTimeout(() => {
                    const container = document.getElementById('chapter-content');
                    if (container) {
                        const offsetTop = chapterElement.offsetTop - container.offsetTop;
                        container.scrollTop = offsetTop;
                    }
                }, 100);
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

        const chapterNumber = storageManager.loadChapterNumber() ?? 0;
        if (chapterNumber !== null) {
            this.scrollToChapter(chapterNumber);
        }

        const container = document.getElementById('chapter-content');
        if (!container) return;

        const lastScrollPosition = storageManager.loadScrollPosition() ?? 0;
        if (lastScrollPosition !== null) {
            // Use setTimeout to ensure scroll position is set after rendering
            setTimeout(() => {
                container.scrollTop = lastScrollPosition;
                Utils.log('Restored scroll position delayed', { position: lastScrollPosition });
            }, 100);
        }

        Utils.log('Restored scroll position', { chapter: chapterNumber, position: lastScrollPosition });
    }

    /**
     * Apply regex replacements to chapter content
     * @param {Array} regexReplacements - Array of regex replacement objects
     */
    applyRegexReplacements(regexReplacements, isRevert = false) {
        console.log('Replacement', regexReplacements);
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
}
