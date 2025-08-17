// ==UserScript==
// @name         MeTruyenHot
// @namespace    http://tampermonkey.net/
// @version      2025-01-21
// @description  Extract raw text (kể cả text giấu trong attribute) và render lại trang đọc sạch, đẹp
// @author       You
// @match        https://metruyenhot.me/*
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

.msreadout-line-highlight:not(.msreadout-inactive-highlight) { background: linear-gradient(90deg, #ffe8a3, #fff6cc) !important; border-radius: 4px !important; box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1) !important; transition: background 0.3s ease !important; }
.msreadout-word-highlight { padding: 0 !important; }
.story {
display: block;
word-spacing: 0.1rem !important;
margin-bottom: 30px !important;
font-size: 20px !important;
font-weight: bold !important;
font-family: fantasy !important;
line-height: 1.6em;
}
`);

(function () {
    'use strict';

    const groupLine = 8;
    // Thêm nhiều selector phổ biến để bắt trúng vùng chương
    const queries = [".book-list.full-story.content.chapter-c", ".truyen", "#chapter-c", "#chapter-content", ".ndtruyen", ".entry-content", ".chapter-c"];
    const removeItems = ["#modal1"]; // (chưa dùng)

    // ===== Helpers =====
    const decodeHTML = (html) => {
        const span = document.createElement('span');
        span.innerHTML = html || '';
        return (span.textContent || '').replace(/\u00A0/g, ' '); // &nbsp; -> space
    };

    // Những attribute không phải nội dung
    const SKIP_ATTR = new Set([
        'class','style','id','href','src','alt','title','target','rel',
        'onmousedown','onmouseup','onclick','onselectstart','oncopy','oncut','oncontextmenu','onkeydown','onkeyup','onkeypress',
    ]);

    // Lấy text giấu trong attribute lạ (kiểu vfmxwyozsu, ghiueqlfvp…)
    const pickHiddenAttrText = (el) => {
        if (!el || !el.attributes) return '';
        for (const attr of el.attributes) {
            const name = attr.name;
            if (SKIP_ATTR.has(name)) continue;
            const val = (attr.value || '').trim();
            // Ưu tiên attribute có nội dung dài có ký tự chữ/dấu câu
            if (val.length > 10 && /[A-Za-zÀ-ỹ“”"'.…,!?0-9]/.test(val)) {
                return decodeHTML(val).trim();
            }
        }
        return '';
    };

    // Trích xuất RAW text từ container: ưu tiên innerText, rỗng thì đọc attribute ẩn
    const extractRawText = (container) => {
        const blocks = [];
        const nodes = container.querySelectorAll('p, div, span');

        nodes.forEach(el => {
            let t = (el.innerText || '').trim();
            if (!t) t = pickHiddenAttrText(el);
            if (!t) return;

            // Gọn nhẹ khoảng trắng nhưng giữ xuống dòng giữa các block
            t = t.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

            // Ưu tiên mỗi <p> là 1 block
            if (el.tagName.toLowerCase() === 'p') {
                blocks.push(t);
            } else {
                blocks.push(t);
            }
        });

        // Ghép block bằng xuống dòng kép để sau còn chia nhóm
        return blocks.join('\n\n');
    };

    // Format nhanh (nhẹ tay, giữ \n)
    function formatText(str) {
        let output = str

        // Sửa số tiền: 600. 000 / 600.\n000 => 600.000
        .replace(/(\d)\.\s+(\d)/g, '$1.$2')
        .replace(/(\d)\.\n+(\d)/g, '$1.$2')

        // Dấu chấm: bỏ space trước \n, chuẩn 1 space sau .
        .replace(/\.\s+\n/g, '.\n')
        .replace(/\.\s+(?=\S)/g, '. ')
        .replace(/\.\s+”/g, '.”')

        // Dấu khác (nhẹ tay, không đổi nghĩa): chuẩn hóa space sau dấu
        .replace(/\s+([,!?:;])/g, '$1')
        .replace(/([,!?:;])(?=\S)/g, '$1 ')

        // Ngoặc kép: bỏ space thừa ngoài/ trong
        .replace(/“\s+/g, '“')
        .replace(/\s+”/g, '”')
        .replace(/“\s*(.*?)\s*”/g, '“$1”');

        return output.trim();
    }

    // Xóa link mở tab mới (ad/external) – giữ của bạn
    function removeExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            try {
                const href = link.getAttribute('href') || '';
                const isAdLink = /ad|quangcao|affiliate|tracking|utm_|click/i.test(href);
                const isExternal = (new URL(href, location.href)).host !== location.host;
                if (isAdLink || isExternal) {
                    link.remove();
                }
            } catch (e) {}
        });
    }

    // ===== Main =====
    queries.forEach(query => {
        const container = document.querySelector(query);
        if (!container) return;

        const nav = document.querySelector('.wp-pagenavi');

        // 1) Lấy RAW text: ưu tiên clean toàn vùng
        let raw = extractRawText(container);
        if (!raw) {
            // fallback nếu site không có p/div/span con
            raw = container.innerText || '';
        }

        // 2) Tách đoạn theo dòng rỗng / xuống dòng, giữ thứ tự
        let parts = raw.split(/\n{2,}|\r?\n/).map(s => s.trim()).filter(Boolean);

        // 3) Áp format nhẹ từng đoạn
        let sentences = parts.map(part => formatText(part)).filter(Boolean);

        // 4) Gom nhóm theo groupLine rồi render
        const groupedParagraphs = [];
        for (let i = 0; i < sentences.length; i += groupLine) {
            const group = sentences.slice(i, i + groupLine).join(' ');
            groupedParagraphs.push(`<section class="story">${group}</section>`);
        }

        // 5) Render lại trang sạch
        document.body.style.background = 'rgb(3, 12, 25)';
        document.body.style.color = 'rgb(125 125 125)';
        container.innerHTML = groupedParagraphs.join('');
        if (nav) container.append(nav);
        container.setAttribute('role', 'main');
        container.style.padding = '20px';
        container.style.textAlign = 'justify';
        container.style['-webkit-user-select'] = 'text';
    });

    // Ẩn header/footer sau một nhịp
    setTimeout(function () {
        document.querySelector('header')?.setAttribute('aria-hidden', 'true');
        document.querySelector('footer')?.setAttribute('aria-hidden', 'true');
    }, 2000);

    // Quan sát và dọn quảng cáo mở tab mới
    removeExternalLinks();
    const observer = new MutationObserver(removeExternalLinks);
    observer.observe(document.body, { childList: true, subtree: true });
})();
