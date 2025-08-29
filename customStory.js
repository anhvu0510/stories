// ==UserScript==
// @name         Custom Story
// @namespace    http://tampermonkey.net/
// @version      2025-01-21
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
 * { -webkit-user-select: text !important; user-select: text !important; }
.msreadout-line-highlight:not(.msreadout-inactive-highlight) {
  background: linear-gradient(90deg, #ffe8a3, #fff6cc) !important;
  border-radius: 4px !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1) !important;
  transition: background 0.3s ease !important;
  padding: 5px 0px;
}

.msreadout-word-highlight {
  padding: 0 !important;
}

 h1 {
    text-align: justify;
    margin: 0;
    font-family: "Open Sans", sans-serif;
    word-spacing: 1px;
    padding: 2px 10px;
    font-size: 24px;
    font-weight: normal;
 }

 .story {
    text-align: justify;
    margin: 0 !important;
    font-family: monospace;
    word-spacing: 0px;
    padding: 10px 15px;
    font-size: 20px;
    font-weight: normal;
    line-height: 1.8;
 }
`);

(function() {
    'use strict';
    const groupLine = 6;
    const queries = [".truyen", "#chapter-c", "#chapter-content" ,'.ndtruyen', '.entry-content'];
    const removeHTMLs = ["#modal1", "#flyer", ".book-relate", 'footer']

    const replacements = [
        [/!/g, '.'],
        [/\·/g, ''],
        [/–/g, '~'],
        [/\?/g, '.'],
        [/\s+/g, ' '],
        [/^\s+|\s+$/g, ' '],
        [/(?:\s*\.\s*){2,}/g, '.'],
        [/и/gi, 'n'],
        [/ɭ/gi, 'l'],
    ];


    function formatText(input, opts = {}) {
        // opts.keepSpaceBeforeQuote:
        //   true  => kiểu 'hắc tuyến: "Ta...' (có 1 space sau :)
        //   false => kiểu 'hắc tuyến:"Ta...' (không space sau :)
        const keepSpaceBeforeQuote = opts.keepSpaceBeforeQuote ?? true;

        let s = String(input);

        // 1) Chuẩn hoá xuống dòng & bỏ space dôi quanh \n
        s = s.replace(/\r\n?/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n[ \t]+/g, '\n');

        // 2) Bỏ khoảng trắng thừa đầu/cuối, gom nhiều space (không đụng \n)
        s = s.trim().replace(/[ \t]{2,}/g, ' ');

        // 3) Dấu ba chấm: gom về "..." và dọn khoảng trắng quanh
        s = s.replace(/\.{2,}/g, '...')
            .replace(/\s*\.\.\.\s*/g, ' ... ');

        // 4) Bỏ khoảng trắng THỪA trước dấu câu , . ! ? ; :
        s = s.replace(/\s+([,.!?;:])/g, '$1');

        // 5) Đảm bảo 1 khoảng trắng SAU dấu câu (trừ khi tiếp theo là khoảng trắng, xuống dòng, dấu ngoặc kép hoặc hết chuỗi)
        s = s.replace(/([,.!?;:])(?!["\s\n]|$)/g, '$1 ');

        // 6) Chuẩn hoá ngoặc kép:
        //    6.1) Sau các dấu mở trích dẫn (như : ; , . ! ? ( [ { - – —) + dấu "
        //         -> hoặc có 1 space (mặc định) hoặc không space tuỳ opts
        s = s.replace(
            /([:;,.!?(\[\{\-–—])\s*"/g,
            keepSpaceBeforeQuote ? '$1 "' : '$1"'
        );

        //    6.2) Không để space NGAY SAU dấu mở "
        s = s.replace(/"\s+/g, '"');

        //    6.3) Không để space NGAY TRƯỚC dấu đóng "
        s = s.replace(/\s+"/g, '"');

        //    6.4) Sau dấu đóng " nếu sau đó là chữ/số, chèn 1 space
        s = s.replace(/"(?=[^\s",.!?;:\n])/g, '" ');

        // 7) Xử lý cặp dấu câu kép kiểu ", ." hoặc ". ," -> giữ dấu sau (hợp lý hơn)
        s = s.replace(/([,.!?;:])\s*([,.!?;:])/g, (m, a, b) => b);

        // 8) Viết hoa chữ đầu câu (đơn giản): đầu chuỗi hoặc sau ., !, ?
        s = s.replace(
            /(^|[.!?]\s+|\n)(["(«“']?\s*)([a-zà-ỹ])/gimu,
            (m, p1, p2, p3) => p1 + p2 + p3.toLocaleUpperCase('vi')
        );

        // 9) Dọn lại space dôi lần cuối
        s = s.replace(/[ \t]{2,}/g, ' ').trim();
        s = s.replace(/^"\s+/g, '"').trim();
        s = s.replace(/\."/g, '".').trim();

        return s;
    }

    function removeExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            try {
                const href = link.getAttribute('href') || '';
                // Nếu link có chứa từ khóa quảng cáo phổ biến hoặc không cùng domain
                const isAdLink = /ad|quangcao|affiliate|tracking|utm_|click/i.test(href);
                const isExternal = (new URL(href, location.href)).host !== location.host;
                if (isAdLink || isExternal) {
                    console.log('🧹 Removed ad link in new tab:', href);
                    link.remove();
                }

                document.querySelectorAll('[style*="display: none"]').forEach(el => {
                    el.remove();
                });

            } catch (e) {
                // Bỏ qua link không hợp lệ
            }
        });
    }

    setTimeout(function(){
        const directChapter = [
            '.chapter_wrap'
        ].map(query => document.querySelector(query)) ?? [];


        queries.forEach(query => {
            let container = document.querySelector(query);
            if (container) {

                const nav = document.querySelector('.wp-pagenavi');

                let content = container.innerText;
                console.log(content)

                let parts = content.split("\n").filter(Boolean)

                let sentences = parts.map((part, index) => {
                    let sentence = part.trim().trimEnd();
                    let updatedPart = formatText(sentence);
                    replacements.forEach(([pattern, replacement]) => {
                        updatedPart = updatedPart.replace(pattern, replacement);
                    });


                    if(updatedPart.match(/\S+/g)?.length < 10) {
                        updatedPart = updatedPart.replace(/\./g, ' ... ')
                    }

                    return updatedPart;
                }).filter(Boolean);


                let groupedParagraphs = [];
                for (let i = 0; i < sentences.length; i += groupLine) {
                    let group = sentences.slice(i, i + groupLine).map(item => `${item}`).join(' ');
                    groupedParagraphs.push(`<div class="story">${group}</div>`);
                }


                document.querySelector('body').style.background = 'rgb(3, 12, 25)';
                document.querySelector('body').style.color = 'rgb(125 125 125)';
                container.innerHTML = groupedParagraphs.join(' ')

                container.setAttribute('role', 'main');

                container.parentNode.style.background = 'rgb(3, 12, 25)';
                container.parentNode.style.color = 'rgb(125 125 125)';

                container.style.background = 'rgb(3, 12, 25)';
                container.style.color = 'rgb(125 125 125)';
            }
        })






        document.querySelector('body')?.setAttribute('role', 'main');
        document.querySelector('main')?.setAttribute('role', 'main');

        document.querySelector('header')?.setAttribute('aria-hidden', 'true');
        document.querySelector('footer')?.setAttribute('aria-hidden', 'true');
        document.querySelector('#site-setting')?.setAttribute('aria-hidden', 'true');

        removeHTMLs.forEach(item => document.querySelector(item)?.remove())
    }, 1000)

    setTimeout(function(){

        removeExternalLinks();
        const observer = new MutationObserver(removeExternalLinks);
        observer.observe(document.body, { childList: true, subtree: true });

    }, 500)
})();
