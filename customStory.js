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
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans&family=Noto+Serif&family=Charter&display=swap');

.msreadout-line-highlight:not(.msreadout-inactive-highlight) {
  background: linear-gradient(90deg, #ffe8a3, #fff6cc) !important;
  border-radius: 4px !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1) !important;
  transition: background 0.3s ease !important;
}

.msreadout-word-highlight {
  padding: 0 !important;
}

`);

(function() {
    'use strict';
    const queries = [".truyen", "#chapter-c", "#chapter-content", "#chapter-content", ".entry-content", ".ndtruyen"];
    const removeItems = ["#modal1"]
    queries.forEach(query => {
        let container = document.querySelector(query);
        console.log('query', query)
        console.log('container', container)
        if (container) {

            // let content = container.innerHTML.trim().slice(0, -1);
            // let parts = content.split(/<br\s*\/?>\s*<br\s*\/?>/).map(part => part.trim()).filter(part => part !== "");
            let content = container.innerText;
            let parts = content.split("\n").filter(Boolean)

            let sentences = parts.map((part, index) => {
                let sentence = part.trim();
                let updatedPart = /<\/?[a-z][\s\S]*>/i.test(sentence) ? sentence : sentence;
                if(updatedPart.includes("middle-content") === true) return false;
                if(updatedPart.includes("♛") === true) return false;
                updatedPart = updatedPart
                    .replace(/!/g, '.')
                    .replace(/\·/g, '')
                    .replace(/\?/g, '.')
                    .replace(/\s+/g, ' ')
                    .replace(/^\s+|\s+$/g, ' ')
                    .replace(/(?:\s*\.\s*){2,}/g, '.');
                const words = updatedPart.split(' ').filter(Boolean)?.length ?? 0; // match từ
                if(/([“"])(.*?)\1/g.test(updatedPart) === false && words > 15) {
                } else {
                }

                if(/chương \d+/i.test(updatedPart) === true) {
                    updatedPart = `${updatedPart}.<div style="display:block;"></div>`;
                }
                return updatedPart;
            }).filter(Boolean);

            // Gom 5 câu vào 1 thẻ <p>
            let groupedParagraphs = [];
            for (let i = 0; i < sentences.length; i += 4) {
                let group = sentences.slice(i, i + 4).map(item => `${item}`).join(' ');
                groupedParagraphs.push(`<p style="word-spacing:1px; margin: 1em 2px;">${group}</p>`);
            }


            document.querySelector('body').style.background = 'rgb(3, 12, 25)';
            document.querySelector('body').style.color = 'rgb(125 125 125)';


            container.innerHTML = groupedParagraphs.join('');


            container.setAttribute('role', 'main');

            container.parentNode.style.background = 'rgb(3, 12, 25)';
            container.parentNode.style.color = 'rgb(125 125 125)';
            container.style.padding = '20px';
            container.style.textAlign = 'justify';
            container.style.fontFamily = '"Patrick Hand", cursive';
            container.style.fontSize = '20px'
        }
    })
    setTimeout(function(){
        document.querySelector('header')?.setAttribute('aria-hidden', 'true');
        document.querySelector('footer')?.setAttribute('aria-hidden', 'true');
    }, 2000)
    function removeExternalLinks() {
        const currentHost = location.host;
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            try {
                const url = new URL(href, location.href);
                if (url.host && url.host !== currentHost) {
                    console.log('currentHost', currentHost, href)
                    link.remove(); // xoá nếu khác domain
                }
            } catch (e) {
                // Bỏ qua nếu href không hợp lệ (vd: javascript:void(0))
            }
        });
    }
    removeExternalLinks();
    const observer = new MutationObserver(removeExternalLinks);
    observer.observe(document.body, { childList: true, subtree: true });
})();
