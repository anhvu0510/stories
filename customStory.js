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
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

.msreadout-line-highlight:not(.msreadout-inactive-highlight) { background: linear-gradient(90deg, #ffe8a3, #fff6cc) !important; border-radius: 4px !important; box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1) !important; transition: background 0.3s ease !important; }
.msreadout-word-highlight { padding: 0 !important; }
 .story { display: block; word-spacing: 0.5rem !important; margin-bottom: 30px !important; font-size: 35px !important; font-weight: bold !important; font-family: fantasy, "MedievalSharp", fantasy !important; line-height: 1.6em; }
`);

(function() {
    'use strict';
    const groupLine = 8;
    const queries = [".truyen", "#chapter-c", "#chapter-content" ,'.ndtruyen', '.entry-content', '.entry-content single-page', '.chapter-c'];
    const removeItems = ["#modal1"]


    function formatText(str) {
        let output = str
        .replace(/\!/g, '')
        .replace(/\?/g, '')
        .replace(/–/g, '~')
        .replace(/“\s+/g, " “")
        .replace(/\.\s+/g, ". ")

        return output.trim();
    }







    queries.forEach(query => {
        let container = document.querySelector(query);
        console.log('container', container, query)
        if (container) {
            const nav = document.querySelector('.wp-pagenavi');
            let content = container.innerText;
            console.log(content)
            // content = content.replace(/(?<!\.)\.(?!\.)(\s)?/g, '.\n').replace(/\bhttps?:\/\/[^\s]+/gi, '')
            let parts = content.split("\n").filter(Boolean)
            let sentences = parts.map((part, index) => {
                let sentence = part.trim();
                let updatedPart = /<\/?[a-z][\s\S]*>/i.test(sentence) ? sentence : sentence;


                updatedPart = formatText(updatedPart);
                return updatedPart;
            }).filter(Boolean);
            let groupedParagraphs = [];
            for (let i = 0; i < sentences.length; i += groupLine) {
                let group = sentences.slice(i, i + groupLine).map(item => `${item}`).join(' ');
                groupedParagraphs.push(`<section class="story">${group}</section>`);
            }
            document.querySelector('body').style.background = 'rgb(3, 12, 25)';
            document.querySelector('body').style.color = 'rgb(125 125 125)';
            container.innerHTML = groupedParagraphs.join('')
            if(nav) container.append(nav)
            container.setAttribute('role', 'main');
            container.style.padding = '20px'
            container.style.textAlign = 'justify'
            container.style['-webkit-user-select'] = 'text';
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
