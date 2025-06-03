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
.msreadout-line-highlight:not(.msreadout-inactive-highlight) {
  background: linear-gradient(90deg, #ffe8a3, #fff6cc) !important;
  border-radius: 4px !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1) !important;
  transition: background 0.3s ease !important;
}

.msreadout-word-highlight {
  padding: 0 !important;
}

 h1 {
   word-spacing: 2px;
   padding: 5px;
   font-size: 20px;
   font-weight: normal;
 }
`);

(function() {
    'use strict';
    const queries = [".truyen", "#chapter-c", "#chapter-content"];
    const removeItems = ["#modal1"]
    const replacements = [
        [/!/g, '.'],
        [/\·/g, ''],
        [/-/g, '~'],
        [/\?/g, '.'],
        [/\s+/g, ' '],
        [/^\s+|\s+$/g, ' '],
        [/(?:\s*\.\s*){2,}/g, '.']
    ];


    queries.forEach(query => {
        let container = document.querySelector(query);
        if (container) {
            let content = container.innerText;
            let parts = content.split("\n").filter(Boolean)
            let sentences = parts.map((part, index) => {
                let sentence = part.trim();
                let updatedPart = /<\/?[a-z][\s\S]*>/i.test(sentence) ? sentence : sentence;
                if(updatedPart.includes("middle-content") === true) return false;
                if(updatedPart.includes("♛") === true) return false;
                if(/chương \d+/i.test(updatedPart) === true) {
                    updatedPart = `${updatedPart}.<div style="display:block;"></div>`;
                }
                replacements.forEach(([pattern, replacement]) => {
                    updatedPart = updatedPart.replace(pattern, replacement);
                });
                return updatedPart;
            }).filter(Boolean);
            let groupedParagraphs = [];
            for (let i = 0; i < sentences.length; i += 4) {
                let group = sentences.slice(i, i + 4).map(item => `${item}`).join(' ');
                groupedParagraphs.push(`<h1>${group}</h1>`);
            }
            document.querySelector('body').style.background = 'rgb(3, 12, 25)';
            document.querySelector('body').style.color = 'rgb(125 125 125)';
            container.innerHTML = groupedParagraphs.join('');
            container.setAttribute('role', 'main');
            container.parentNode.style.background = 'rgb(3, 12, 25)';
            container.parentNode.style.color = 'rgb(125 125 125)';
            container.style.padding = '20px'
            container.style.textAlign = 'justify'
        }
    })
    setTimeout(function(){
        document.querySelector('header')?.setAttribute('aria-hidden', 'true');
        document.querySelector('footer')?.setAttribute('aria-hidden', 'true');
    }, 2000)
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
            } catch (e) {
                // Bỏ qua link không hợp lệ
            }
        });
    }
    removeExternalLinks();
    const observer = new MutationObserver(removeExternalLinks);
    observer.observe(document.body, { childList: true, subtree: true });
})();
