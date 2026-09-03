(function () {
    'use strict';

    const iconPaths = {
        dashboard: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 10.5v-5ZM16 5.5A1.5 1.5 0 0 1 17.5 4h5A1.5 1.5 0 0 1 24 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5ZM4 18.5A1.5 1.5 0 0 1 5.5 17h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 23.5v-5ZM16 18.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8"/>' ,
        clock: '<circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 9v5l3.5 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        wallet: '<path d="M5 7.5h15A2.5 2.5 0 0 1 22.5 10v9A2.5 2.5 0 0 1 20 21.5H6A2.5 2.5 0 0 1 3.5 19V7a2 2 0 0 1 2-2h13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 14h4.5M18 14a2 2 0 1 0 0 4h4.5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
        calendar: '<rect x="4" y="5.5" width="20" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 3.5v4M20 3.5v4M4 10h20M9 15h2M15 15h2M9 19h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        seed: '<path d="M14 23V13M14 16c-5 0-7-3-7-7 5 0 7 3 7 7ZM14 13c0-5 3-7 7-7 0 5-2 7-7 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        spark: '<path d="m14 3 1.7 7.3L23 12l-7.3 1.7L14 21l-1.7-7.3L5 12l7.3-1.7L14 3ZM22 19l.6 2.4L25 22l-2.4.6L22 25l-.6-2.4L19 22l2.4-.6L22 19Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
        moon: '<path d="M22 17.5A9 9 0 0 1 10.5 6 9.5 9.5 0 1 0 22 17.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
        download: '<path d="M14 4v13M9 12l5 5 5-5M5 21h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        upload: '<path d="M14 18V5M9 10l5-5 5 5M5 21h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        alert: '<path d="M14 4 3.7 22h20.6L14 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 10v5M14 18.5v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        leaf: '<path d="M22 5C12 5 6 9 6 16c0 3 2 5 5 5 7 0 11-6 11-16Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 23c4-7 8-10 14-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        receipt: '<path d="M6 3.5h16v21l-3-2-3 2-3-2-3 2-4-2V3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 9h8M10 13h8M10 17h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        arrow: '<path d="M5 14h17M16 8l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        plus: '<path d="M14 5v18M5 14h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        save: '<path d="M5 4h15l3 3v16H5V4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v6h8V4M9 23v-7h10v7" fill="none" stroke="currentColor" stroke-width="1.8"/>',
        train: '<path d="M7 18V8c0-3 3-4 7-4s7 1 7 4v10c0 2-2 3-7 3s-7-1-7-3Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 14h14M10 25l2-4M18 25l-2-4M11 9h.1M17 9h.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        bolt: '<path d="m15 3-9 12h7l-1 10 9-13h-7l1-9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
        info: '<circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 12v6M14 8.5v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        edit: '<path d="m5 19-.7 4.7L9 23l13.3-13.3-4-4L5 19Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m15.5 7.5 4 4" stroke="currentColor" stroke-width="1.8"/>',
        trash: '<path d="M5 7h18M10 7V4h8v3M8 7l1 16h10l1-16M12 11v8M16 11v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
    };

    function mountIcons() {
        document.querySelectorAll('[data-icon]').forEach((element) => {
            const path = iconPaths[element.getAttribute('data-icon')];
            if (path) element.innerHTML = `<svg viewBox="0 0 28 28" aria-hidden="true">${path}</svg>`;
        });
    }

    const pageNames = { dashboard: '今日驾驶舱', hourly: '我的时薪', ledger: '10 秒记账', monthly: '月度总结', fund: '自由基金', discover: '有趣发现' };
    function setView(name) {
        document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
        document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.getAttribute('data-view') === name));
        const title = document.getElementById('page-title');
        if (title) title.textContent = pageNames[name] || pageNames.dashboard;
        window.scrollTo(0, 0);
    }

    function setTheme() {
        const dark = document.body.dataset.theme === 'dark';
        document.body.dataset.theme = dark ? '' : 'dark';
        const button = document.getElementById('theme-button');
        if (button) button.setAttribute('aria-label', dark ? '切换深色' : '切换浅色');
    }

    document.addEventListener('DOMContentLoaded', () => {
        mountIcons();
        document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.getAttribute('data-view'))));
        document.getElementById('theme-button')?.addEventListener('click', setTheme);
        const today = new Date();
        const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        const dateInput = document.getElementById('quick-date');
        const ledgerDate = document.getElementById('ledger-date');
        const monthInput = document.getElementById('month-picker');
        if (dateInput) dateInput.value = iso;
        if (ledgerDate) ledgerDate.value = iso;
        if (monthInput) monthInput.value = iso.slice(0, 7);
        const todayLabel = document.getElementById('today-label');
        if (todayLabel) todayLabel.textContent = `${today.getMonth() + 1}月${today.getDate()}日`;
    });
})();
