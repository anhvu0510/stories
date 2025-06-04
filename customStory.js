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
    font-family: math;
    word-spacing: 1px;
    padding: 10px 15px;
    font-size: 20px;
    font-weight: normal;
    line-height: 1.8;
 }
`);

(function() {
    'use strict';
    const groupLine = 4;
    const queries = [".truyen", "#chapter-c", "#chapter-content" ,'.ndtruyen', '.entry-content'];
    const removeItems = ["#modal1"]
    const replacements = [
        [/!/g, '.'],
        [/\·/g, ''],
        [/–/g, '~'],
        [/\?/g, '.'],
        [/\s+/g, ' '],
        [/^\s+|\s+$/g, ' '],
        [/(?:\s*\.\s*){2,}/g, '.']
    ];


    queries.forEach(query => {
        let container = document.querySelector(query);
        console.log('container', container, query)
        if (container) {

            const nav = document.querySelector('.wp-pagenavi');
            let content = container.innerText;

            content = content
                .replace(/([“"])([^“”"]*?)(\.)(["”])/g, '$1$2$4.\n')
                .replace(/(?<!\.)\.(?!\.)(?![^"“”]*["”])/g,'.\n')
                .replace(/\bhttps?:\/\/[^\s]+/gi, '')

            let parts = content.split("\n").filter(Boolean)
            let sentences = parts.map((part, index) => {
                let sentence = part.trim();
                let updatedPart = /<\/?[a-z][\s\S]*>/i.test(sentence) ? sentence : sentence;
                if(updatedPart.includes("middle-content") === true) return false;
                if(updatedPart.includes("♛") === true) return false;
                if(/chương \d+/i.test(updatedPart) === true) {
                    updatedPart = `${updatedPart}</br>`;
                }

                replacements.forEach(([pattern, replacement]) => {
                    updatedPart = updatedPart.replace(pattern, replacement);
                });
                return updatedPart;
            }).filter(Boolean);
            let groupedParagraphs = [];
            for (let i = 0; i < sentences.length; i += groupLine) {
                let group = sentences.slice(i, i + groupLine).map(item => `${item}`).join(' ');
                // groupedParagraphs.push(`<h1>${group}</h1>`);
                // groupedParagraphs.push(`<h4 class="story">${group}</h4>`);
                groupedParagraphs.push(`<p class="story">${group}</p>`);
            }
            document.querySelector('body').style.background = 'rgb(3, 12, 25)';
            document.querySelector('body').style.color = 'rgb(125 125 125)';
            container.innerHTML = groupedParagraphs.join('')

            if(nav) container.append(nav)

            container.setAttribute('role', 'main');

            container.parentNode.style.background = 'rgb(3, 12, 25)';
            container.parentNode.style.color = 'rgb(125 125 125)';

            container.style.background = 'rgb(3, 12, 25)';
            container.style.color = 'rgb(125 125 125)';
        }
    })
    setTimeout(function(){
        document.querySelector('body')?.setAttribute('role', 'main');
        document.querySelector('main')?.setAttribute('role', 'main');

        document.querySelector('header')?.setAttribute('aria-hidden', 'true');
        document.querySelector('footer')?.setAttribute('aria-hidden', 'true');
    }, 500)
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
