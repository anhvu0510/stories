// ==UserScript==
// @name         Chapter Crawler with Translation
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Crawl chapter content with Chinese and Vietnamese translation
// @author       You
// @match        https://www.alicesw.com/book/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    class ChapterCrawler {
        constructor() {
            this.chapters = [];
            this.currentChapter = null;
            this.currentChapterId = null; // Track chapter by data-chapter-id
            this.processedChapterIds = new Set(); // Tránh crawl lại chương đã xử lý
            this.isScrolling = false; // Mặc định OFF
            this.scrollProgress = 0;
            this.observerInitialized = false;
            this.scrollStep = 400; // Pixel scroll mỗi lần (tăng từ 50 lên 300)
            this.scrollDelay = 400; // Delay giữa các lần scroll (ms) (giảm từ 500 xuống 50)
            this.waitForTranslation = 500; // Thời gian chờ translation load (ms)
            this.hasReached80Percent = false;
            this.translationObserver = null;
            this.controlButton = null; // Nút điều khiển

            // API Configuration
            this.apiEndpoint = 'https://armorplated-thersa-unstained.ngrok-free.dev/v2/api/save-story'; // Thay đổi URL này
            this.apiEnabled = false; // Set true để bật gửi data đến API
            this.bookName = ''; // Tên truyện do user nhập
        }

        // Khởi tạo crawler
        init() {
            console.log('Chapter Crawler initialized');
            console.log('Settings:', {
                scrollStep: this.scrollStep,
                scrollDelay: this.scrollDelay,
                waitForTranslation: this.waitForTranslation
            });

            // Tạo nút điều khiển
            this.createControlButton();

            this.startCrawling();
        }

        // Tạo nút điều khiển on/off
        createControlButton() {
            // Tạo nút toggle nhỏ gọn với icon
            const toggleButton = document.createElement('button');
            toggleButton.id = 'crawlerToggleBtn';
            toggleButton.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div id="crawlerIconContainer" style="
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <svg id="crawlerIcon" width="16" height="16" viewBox="0 0 24 24" fill="white" style="transition: all 0.3s ease;">
                            <!-- Play Icon (default OFF) -->
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    <span style="font-size: 14px; font-weight: 500;">
                        <span id="crawlerChapterCount"></span>
                    </span>
                </div>
            `;
            toggleButton.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                padding: 10px 15px;
                background: rgba(0, 0, 0, 0.75);
                color: white;
                border: 2px solid rgba(158, 158, 158, 0.5);
                border-radius: 25px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            `;

            toggleButton.addEventListener('mouseover', () => {
                toggleButton.style.transform = 'scale(1.05)';
                toggleButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)';
            });

            toggleButton.addEventListener('mouseout', () => {
                toggleButton.style.transform = 'scale(1)';
                toggleButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            });

            toggleButton.addEventListener('click', () => {
                this.toggleScrolling();
            });

            document.body.appendChild(toggleButton);
            this.controlButton = toggleButton;
        }

        // Toggle scrolling on/off
        toggleScrolling() {
            if (this.isScrolling) {
                // Pause - Chuyển sang OFF (Play icon)
                this.isScrolling = false;

                // Đổi sang Play icon
                const icon = document.getElementById('crawlerIcon');
                icon.innerHTML = '<path d="M8 5v14l11-7z"/>';

                // Đổi border color
                this.controlButton.style.borderColor = 'rgba(158, 158, 158, 0.5)';

                console.log('🛑 Crawling STOPPED by user');
            } else {
                // Bật ON - Nhập tên truyện trước
                const bookName = prompt('📚 Nhập tên truyện:', this.bookName || '');

                // Nếu user cancel hoặc không nhập gì
                if (bookName === null || bookName.trim() === '') {
                    console.log('⚠️  Crawling cancelled - No book name provided');
                    return;
                }

                // Lưu tên truyện
                this.bookName = bookName.trim();
                console.log(`📖 Book name set: "${this.bookName}"`);

                // Resume - Chuyển sang ON (Pause icon)
                this.isScrolling = true;

                // Đổi sang Pause icon
                const icon = document.getElementById('crawlerIcon');
                icon.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>';

                // Đổi border color sang xanh
                this.controlButton.style.borderColor = 'rgba(76, 175, 80, 0.8)';

                console.log('▶️ Crawling STARTED by user');

                // Tiếp tục scroll
                this.autoScroll();
            }
        }

        // Cập nhật số lượng chapters
        updateChapterCount() {
            const countElement = document.getElementById('crawlerChapterCount');
            if (countElement) {
                countElement.textContent = this.chapters.length;
            }
        }

        // Bắt đầu quá trình crawl
        startCrawling() {
            // Kiểm tra xem có phần tử chương không
            const chapterContent = document.querySelector('#chapterContent');
            if (!chapterContent) {
                console.error('Chapter content not found');
                return;
            }

            // Lấy chapter ID hiện tại
            const chapterSection = this.getCurrentChapterSection();
            if (!chapterSection) {
                console.error('No chapter section found');
                return;
            }

            this.currentChapterId = chapterSection.getAttribute('data-chapter-id');
            console.log(`🎯 Starting crawl for chapter ID: ${this.currentChapterId}`);

            // Scroll về đầu trang instant (không animation)
            window.scrollTo(0, 0);

            // Đợi một chút để trang ổn định
            setTimeout(() => {
                console.log('Chapter crawler ready. Click the button to start crawling.');
                // KHÔNG gọi startScrolling() tự động nữa, đợi user click
            }, 1000);
        }

        // Lấy chapter section hiện tại dựa vào data-chapter-id
        getCurrentChapterSection() {
            // Nếu có currentChapterId, tìm section với ID cụ thể
            if (this.currentChapterId) {
                const specificSection = document.querySelector(`.jsChapterWrapper[data-chapter-id="${this.currentChapterId}"]`);
                if (specificSection) {
                    return specificSection;
                }
            }

            // Nếu không có hoặc không tìm thấy, tìm tất cả các chapter sections
            const allSections = document.querySelectorAll('.jsChapterWrapper[data-chapter-id]');

            // Nếu chỉ có 1 section, return luôn
            if (allSections.length === 1) {
                return allSections[0];
            }

            // Nếu có nhiều sections, tìm section chưa xử lý
            for (let section of allSections) {
                const chapterId = section.getAttribute('data-chapter-id');
                if (!this.processedChapterIds.has(chapterId)) {
                    return section;
                }
            }

            // Nếu không tìm thấy, return section đầu tiên
            return allSections[0] || null;
        }

        // Thu thập dữ liệu chương hiện tại
        collectCurrentChapter() {
            // Tìm section với ID cụ thể
            const chapterSection = document.querySelector(`.jsChapterWrapper[data-chapter-id="${this.currentChapterId}"]`);

            if (!chapterSection) {
                console.error(`❌ Chapter section with ID ${this.currentChapterId} not found`);
                return;
            }

            const chapterId = chapterSection.getAttribute('data-chapter-id');

            // Kiểm tra xem đã crawl chương này chưa
            if (this.processedChapterIds.has(chapterId)) {
                console.warn(`⚠️  Chapter ${chapterId} already processed, skipping...`);
                return;
            }

            // Lấy tiêu đề chương
            const titleElement = chapterSection.querySelector('h3');
            if (!titleElement) {
                console.error('❌ Chapter title not found');
                return;
            }

            // Tách tiêu đề tiếng Trung và tiếng Việt
            const titleCN = this.extractChineseText(titleElement);
            const titleVN = this.extractVietnameseText(titleElement);

            // Lấy số chương từ tiêu đề
            const chapterNumber = this.extractChapterNumber(titleCN);

            console.log(`📖 Collecting Chapter ${chapterNumber} (ID: ${chapterId}): ${titleCN}`);

            // Thu thập nội dung
            const contentData = this.collectContent(chapterSection);

            this.currentChapter = {
                chapterId: chapterId,
                chapterNumber: chapterNumber,
                titleCN: titleCN,
                titleVN: titleVN,
                contentCN: contentData.contentCN,
                contentVN: contentData.contentVN
            };

            // Đánh dấu chương này đã xử lý
            this.processedChapterIds.add(chapterId);

            console.log(`✓ Chapter ${chapterNumber} (ID: ${chapterId}) collected - CN: ${contentData.contentCN.length} paragraphs, VN: ${contentData.contentVN.length} paragraphs`);
        }

        // Trích xuất văn bản tiếng Trung (loại bỏ phần dịch)
        extractChineseText(element) {
            const clone = element.cloneNode(true);
            // Xóa tất cả các phần tử có class chứa 'immersive-translate'
            const translationElements = clone.querySelectorAll('[class*="immersive-translate"]');
            translationElements.forEach(el => el.remove());
            return clone.textContent.trim();
        }

        // Trích xuất văn bản tiếng Việt từ phần dịch
        extractVietnameseText(element) {
            const vnElement = element.querySelector('.immersive-translate-target-inner');
            return vnElement ? vnElement.textContent.trim() : '';
        }

        // Kiểm tra xem paragraph đã có translation chưa
        hasTranslation(element) {
            const vnElement = element.querySelector('.immersive-translate-target-inner');
            return vnElement !== null && vnElement.textContent.trim() !== '';
        }

        // Đếm số paragraph đã có translation - SỬ DỤNG CHAPTER ID
        countTranslatedParagraphs() {
            // Debug: Log current chapter ID
            if (!this.currentChapterId) {
                console.error(`⚠️  countTranslatedParagraphs: currentChapterId is NULL or undefined!`);
                return { total: 0, translated: 0, percentage: 0 };
            }

            // Tìm section với ID cụ thể
            const chapterSection = document.querySelector(`.jsChapterWrapper[data-chapter-id="${this.currentChapterId}"]`);

            if (!chapterSection) {
                // Debug: Log tất cả chapter IDs hiện có trong DOM
                const allSections = document.querySelectorAll('.jsChapterWrapper[data-chapter-id]');
                const allIds = Array.from(allSections).map(s => s.getAttribute('data-chapter-id'));
                console.warn(`⚠️  countTranslatedParagraphs: Looking for ID "${this.currentChapterId}" but not found!`);
                console.warn(`Available chapter IDs in DOM: [${allIds.join(', ')}]`);
                return { total: 0, translated: 0, percentage: 0 };
            }

            // Lấy các thẻ p trực tiếp từ chapterSection
            const paragraphs = chapterSection.querySelectorAll('p');

            if (paragraphs.length === 0) {
                console.warn(`⚠️  countTranslatedParagraphs: No paragraphs found in chapter ${this.currentChapterId}`);
                return { total: 0, translated: 0, percentage: 0 };
            }

            let translated = 0;

            paragraphs.forEach(p => {
                if (this.hasTranslation(p)) {
                    translated++;
                }
            });

            return {
                total: paragraphs.length,
                translated: translated,
                percentage: paragraphs.length > 0 ? (translated / paragraphs.length * 100).toFixed(1) : 0
            };
        }

        // Trích xuất số chương từ tiêu đề
        extractChapterNumber(titleCN) {
            const match = titleCN.match(/第(\d+)章/);
            return match ? parseInt(match[1]) : 0;
        }

        // Thu thập nội dung chương
        collectContent(chapterSection) {
            // Sử dụng Set để tránh trùng lặp
            const contentCNSet = new Set();
            const contentVNSet = new Set();

            // Lấy tất cả các thẻ p trực tiếp từ chapterSection
            const paragraphs = chapterSection.querySelectorAll('p');

            if (paragraphs.length === 0) {
                console.warn(`⚠️  No paragraphs found in chapter section`);
                return { contentCN: [], contentVN: [] };
            }

            console.log(`Processing ${paragraphs.length} paragraphs...`);

            paragraphs.forEach((p, index) => {
                // Lấy văn bản tiếng Trung
                const cnText = this.extractChineseText(p);
                if (cnText && cnText.trim() !== '') {
                    contentCNSet.add(cnText);
                }

                // Lấy văn bản tiếng Việt
                const vnText = this.extractVietnameseText(p);
                if (vnText && vnText.trim() !== '') {
                    contentVNSet.add(vnText);
                }
            });

            console.log(`Collected: ${contentCNSet.size} Chinese paragraphs, ${contentVNSet.size} Vietnamese paragraphs`);

            return {
                contentCN: Array.from(contentCNSet),
                contentVN: Array.from(contentVNSet)
            };
        }

        // Bắt đầu scroll tự động
        startScrolling() {
            // Không tự động set isScrolling = true nữa
            // User phải click nút để bật
            this.hasReached80Percent = false;

            // Chỉ bắt đầu scroll nếu isScrolling = true
            if (this.isScrolling) {
                this.autoScroll();
            } else {
                console.log('⏸️ Crawler is OFF. Click the button to start crawling.');
            }
        }

        // Scroll tự động và theo dõi tiến độ - SMOOTH SCROLL
        autoScroll() {
            if (!this.isScrolling) return;

            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            const currentScroll = window.scrollY;

            // Tính toán tiến độ scroll
            this.scrollProgress = (currentScroll / maxScroll) * 100;

            // Kiểm tra translation progress
            const translationStats = this.countTranslatedParagraphs();

            


            // Log tiến độ mỗi 10%
            const progressMark = Math.floor(this.scrollProgress / 10) * 10;
            if (this.scrollProgress >= progressMark && this.scrollProgress < progressMark + 2) {
                console.log(`📜 Scroll: ${this.scrollProgress.toFixed(1)}% | 🌐 Translation: ${translationStats.translated}/${translationStats.total} (${translationStats.percentage}%) | Chapter ID: ${this.currentChapterId}`);
            }

            // Kiểm tra nếu đã scroll được 80% và chưa xử lý
            if (this.scrollProgress >= 80 && !this.hasReached80Percent) {
                this.hasReached80Percent = true;
                console.log('✓ Reached 80% - Continue scrolling to end to ensure all translations loaded...');
            }

            // Tiếp tục scroll cho đến cuối trang
            if (currentScroll < maxScroll - 10) { // -10 để tránh lỗi làm tròn
                // Scroll smooth từng bước nhỏ
                window.scrollBy({
                    top: this.scrollStep,
                    behavior: 'smooth'
                });

                // Đợi translation load
                setTimeout(() => {
                    this.autoScroll();
                }, this.scrollDelay);
            } else {
                // Đã scroll đến cuối trang
                console.log('✓ Reached end of page (100%)');
                const finalStats = this.countTranslatedParagraphs();
                console.log(`📊 Final translation status: ${finalStats.translated}/${finalStats.total} paragraphs (${finalStats.percentage}%)`);
                this.onScrollComplete();
            }
        }

        // Xử lý khi scroll hoàn tất
        onScrollComplete(isReload) {
            console.log('⏳ Waiting for final translations to load...');

            // Đợi thêm thời gian để đảm bảo tất cả translation đã load
            setTimeout(() => {
                console.log('📊 Collecting chapter data...');
                this.collectCurrentChapter();

                // Lưu chương hiện tại vào mảng
                if (this.currentChapter) {
                    this.chapters.push(this.currentChapter);

                    // Cập nhật số lượng chapters trên UI
                    this.updateChapterCount();

                    // In ra console
                    this.printChapterData(this.currentChapter);

                    // Gửi chapter data đến API (không đợi response - chạy background)
                    this.sendChapterToAPI(this.currentChapter);

                    // Xóa chương hiện tại khỏi DOM và đợi

                    if (isReload) {
                        this.loadNextChapter(isReload);
                    } else {
                        this.removeCurrentChapter().then(() => {
                            // Kiểm tra và load chương tiếp theo
                            setTimeout(() => {
                                this.loadNextChapter();
                            }, 1000);
                        });
                    }




                } else {
                    console.error('❌ Failed to collect chapter data');
                    this.finishCrawling();
                }
            }, this.waitForTranslation * 2); // Đợi lâu hơn để đảm bảo
        }

        // Xóa chương hiện tại khỏi DOM
        removeCurrentChapter() {
            // Tìm section với ID hiện tại
            const chapterSection = document.querySelector(`.jsChapterWrapper[data-chapter-id="${this.currentChapterId}"]`);

            if (chapterSection) {
                const chapterId = chapterSection.getAttribute('data-chapter-id');
                const titleElement = chapterSection.querySelector('h3');
                const chapterTitle = titleElement ? this.extractChineseText(titleElement) : 'Unknown';
                console.log(`🗑️  Removing chapter from DOM - ID: ${chapterId}, Title: ${chapterTitle}`);
                chapterSection.remove();
                console.log('✓ Chapter removed successfully');

                // Đợi một chút để DOM update
                return new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.warn(`⚠️  Chapter section with ID ${this.currentChapterId} not found for removal`);
                return Promise.resolve();
            }
        }

        // Load chương tiếp theo
        loadNextChapter(isReload) {
            // Tìm nút load next
            const loadNextBtn = document.querySelector('#btnLoadNextChapter');
            const readLoadNext = document.querySelector('#readLoadNext');

            if (loadNextBtn) {
                console.log('🔄 Loading next chapter via button...');
                loadNextBtn.click();

                // Đợi nội dung mới load xong và kiểm tra
                this.waitForNewChapter();

                setTimeout(() => {
                    if (isReload) {
                        location.href = location.href;
                        this.isScrolling = true;
                    }
                }, 1000);

            } else {
                // Kiểm tra xem đã hết chương chưa
                const bookEndLink = document.querySelector('#aGotoBookEnd');
                if (bookEndLink && bookEndLink.style.display !== 'none') {
                    console.log('📚 Reached the last chapter!');
                    this.finishCrawling();
                } else {
                    console.log('⏳ Next chapter button not found or not ready, retrying...');
                    // Thử lại sau 2 giây
                    setTimeout(() => this.loadNextChapter(), 2000);
                }
            }
        }

        // Đợi chương mới được load vào DOM
        waitForNewChapter() {
            let attempts = 0;
            const maxAttempts = 30; // Tối đa 30 lần (15 giây)
            const previousChapterId = this.currentChapterId;

            console.log(`⏳ Waiting for new chapter (different from ID: ${previousChapterId})...`);

            const checkInterval = setInterval(() => {
                attempts++;

                // Tìm tất cả sections
                const allSections = document.querySelectorAll('.jsChapterWrapper[data-chapter-id]');

                if (allSections.length > 0) {
                    // Tìm section mới (khác với previousChapterId)
                    for (let section of allSections) {
                        const newChapterId = section.getAttribute('data-chapter-id');

                        // Kiểm tra xem có phải chương mới không
                        if (newChapterId && newChapterId !== previousChapterId && !this.processedChapterIds.has(newChapterId)) {
                            console.log(`✓ New chapter detected - ID: ${newChapterId}`);
                            this.currentChapterId = newChapterId;
                            clearInterval(checkInterval);
                            this.resetForNewChapter();
                            return;
                        }
                    }
                    console.log(`⏳ Waiting... No new chapter yet (${attempts}/${maxAttempts})`);
                } else {
                    console.log(`⏳ No chapter sections found... (${attempts}/${maxAttempts})`);
                }

                if (attempts >= maxAttempts) {
                    console.error('❌ Timeout: New chapter not loaded after 15 seconds');
                    clearInterval(checkInterval);
                    this.finishCrawling();
                }
            }, 500);
        }

        // Reset để crawl chương mới
        resetForNewChapter() {
            console.log('='.repeat(80));
            console.log(`🔄 Resetting for new chapter - ID: ${this.currentChapterId}`);
            this.observerInitialized = false;
            this.hasReached80Percent = false;
            this.scrollProgress = 0;
            // KHÔNG set isScrolling = false ở đây, giữ nguyên trạng thái pause/resume

            // Scroll về đầu trang INSTANT (không smooth)
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });

            // Đợi trang ổn định và translation bắt đầu load
            setTimeout(() => {
                // Tìm section với ID cụ thể
                const newChapterSection = document.querySelector(`.jsChapterWrapper[data-chapter-id="${this.currentChapterId}"]`);

                if (newChapterSection) {
                    const newChapterId = newChapterSection.getAttribute('data-chapter-id');
                    console.log(`✓ New chapter ready - ID: ${newChapterId}`);

                    const titleElement = newChapterSection.querySelector('h3');
                    if (titleElement) {
                        const titleCN = this.extractChineseText(titleElement);
                        console.log(`📖 Chapter title: ${titleCN}`);
                    }

                    const contentDiv = newChapterSection;
                    const paragraphCount = contentDiv ? contentDiv.querySelectorAll('p').length : 0;
                    console.log(`📄 Chapter has ${paragraphCount} paragraphs`);

                    // Chỉ bắt đầu scroll nếu đang không bị pause
                    if (this.isScrolling) {
                        this.startScrolling();
                    } else {
                        console.log('⏸️ Crawler is paused, waiting for user to resume...');
                    }
                } else {
                    console.error(`❌ Error: Chapter section with ID ${this.currentChapterId} not found after reset`);
                    console.log('Retrying in 2 seconds...');
                    setTimeout(() => this.resetForNewChapter(), 2000);
                }
            }, 3000); // Tăng thời gian chờ lên 3 giây
        }

        // In dữ liệu chương ra console
        printChapterData(chapter) {
            console.log({ chapter });
        }

        // Gửi chapter data đến API
        async sendChapterToAPI(chapter) {
            if (!this.apiEnabled) {
                console.log('📡 API is disabled. Skipping send to server.');
                return { success: false, message: 'API disabled' };
            }

            console.log(`📡 Sending chapter ${chapter.chapterNumber} to API: ${this.apiEndpoint}`);

            // Thêm tên truyện vào chapter data
            const dataToSend = {
                bookName: this.bookName,
                ...chapter
            };

            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log(`✅ Chapter ${chapter.chapterNumber} sent successfully:`, result);
                return { success: true, data: result };

            } catch (error) {
                console.error(`❌ Error sending chapter ${chapter.chapterNumber} to API:`, error);
                return { success: false, error: error.message };
            }
        }

        // Kết thúc crawling
        finishCrawling() {
            this.isScrolling = false;
            console.log('='.repeat(80));
            console.log('CRAWLING COMPLETED!');
            console.log(`Total chapters collected: ${this.chapters.length}`);
            console.log(`Processed chapter IDs: ${Array.from(this.processedChapterIds).join(', ')}`);
            console.log('='.repeat(80));
            console.log('ALL CHAPTERS DATA:');
            console.log(JSON.stringify(this.chapters, null, 2));
            console.log('='.repeat(80));
        }
    }

    // Khởi tạo crawler khi trang load xong
    window.addEventListener('load', () => {
        console.log('Page loaded, starting crawler in 3 seconds...');
        setTimeout(() => {
            const crawler = new ChapterCrawler();
            crawler.init();
        }, 3000);
    });

})();
