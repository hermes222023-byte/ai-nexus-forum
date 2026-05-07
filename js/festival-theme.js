// 節日主題配置
const FESTIVALS = {
    // 春節
    'chinese_new_year': {
        name: '春節',
        dates: [[1, 20], [2, 10]], // 1/20-2/10（農曆年前後）
        theme: {
            primary: '#dc2626', // 紅色
            secondary: '#fbbf24', // 金色
            accent: '#ef4444',
            bg1: '#fef2f2',
            bg2: '#fff7ed',
            bg3: '#fefce8',
            decorations: ['🧧', '🧨', '🎊', '🏮', '💰', '🐉']
        }
    },
    // 情人節
    'valentine': {
        name: '情人節',
        dates: [[2, 14], [2, 14]],
        theme: {
            primary: '#ec4899',
            secondary: '#f472b6',
            accent: '#db2777',
            bg1: '#fdf2f8',
            bg2: '#fce7f3',
            bg3: '#fbcfe8',
            decorations: ['💕', '💖', '💗', '💘', '💝', '🌹']
        }
    },
    // 清明節
    'qingming': {
        name: '清明節',
        dates: [[4, 4], [4, 6]],
        theme: {
            primary: '#10b981',
            secondary: '#34d399',
            accent: '#059669',
            bg1: '#ecfdf5',
            bg2: '#d1fae5',
            bg3: '#a7f3d0',
            decorations: ['🌸', '🍃', '🌿', '🌱', '🦋', '🌺']
        }
    },
    // 端午節
    'dragon_boat': {
        name: '端午節',
        dates: [[6, 1], [6, 15]], // 農曆五月初五前後
        theme: {
            primary: '#059669',
            secondary: '#10b981',
            accent: '#047857',
            bg1: '#ecfdf5',
            bg2: '#d1fae5',
            bg3: '#a7f3d0',
            decorations: ['🐉', '🚣', '🎋', '🍃', '🌿', '🎐']
        }
    },
    // 中秋節
    'mid_autumn': {
        name: '中秋節',
        dates: [[9, 10], [9, 25]], // 農曆八月十五前後
        theme: {
            primary: '#f59e0b',
            secondary: '#fbbf24',
            accent: '#d97706',
            bg1: '#fffbeb',
            bg2: '#fef3c7',
            bg3: '#fde68a',
            decorations: ['🌕', '🥮', '🏮', '🌟', '✨', '🐰']
        }
    },
    // 萬聖節
    'halloween': {
        name: '萬聖節',
        dates: [[10, 25], [11, 1]],
        theme: {
            primary: '#f97316',
            secondary: '#fb923c',
            accent: '#ea580c',
            bg1: '#1f2937',
            bg2: '#111827',
            bg3: '#0f172a',
            decorations: ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀']
        }
    },
    // 聖誕節
    'christmas': {
        name: '聖誕節',
        dates: [[12, 20], [12, 26]],
        theme: {
            primary: '#dc2626',
            secondary: '#16a34a',
            accent: '#b91c1c',
            bg1: '#fef2f2',
            bg2: '#f0fdf4',
            bg3: '#fff7ed',
            decorations: ['🎄', '🎅', '⭐', '🎁', '❄️', '🔔']
        }
    },
    // 跨年
    'new_year_eve': {
        name: '跨年',
        dates: [[12, 30], [1, 2]],
        theme: {
            primary: '#8b5cf6',
            secondary: '#a855f7',
            accent: '#7c3aed',
            bg1: '#faf5ff',
            bg2: '#f3e8ff',
            bg3: '#e9d5ff',
            decorations: ['🎆', '🎇', '✨', '🎉', '🎊', '🥂']
        }
    }
};

// 檢查是否在節日日期範圍內
function isFestivalActive(festival) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    const [startMonth, startDay] = festival.dates[0];
    const [endMonth, endDay] = festival.dates[1];
    
    // 處理跨年情況
    if (startMonth > endMonth) {
        return (month === startMonth && day >= startDay) || 
               (month === endMonth && day <= endDay) ||
               (month > startMonth || month < endMonth);
    }
    
    // 同月份
    if (month === startMonth && month === endMonth) {
        return day >= startDay && day <= endDay;
    }
    
    // 跨月份
    if (month === startMonth) {
        return day >= startDay;
    }
    if (month === endMonth) {
        return day <= endDay;
    }
    if (month > startMonth && month < endMonth) {
        return true;
    }
    
    return false;
}

// 取得當前節日
function getCurrentFestival() {
    for (const [key, festival] of Object.entries(FESTIVALS)) {
        if (isFestivalActive(festival)) {
            return { key, ...festival };
        }
    }
    return null;
}

// 應用節日主題
function applyFestivalTheme(festival) {
    if (!festival) return;
    
    const theme = festival.theme;
    const root = document.documentElement;
    
    // 更新 CSS 變數
    root.style.setProperty('--accent-pink', theme.primary);
    root.style.setProperty('--accent-blue', theme.secondary);
    root.style.setProperty('--accent-purple', theme.accent);
    
    // 更新背景漸層
    root.style.setProperty('--bg-gradient-1', theme.bg1);
    root.style.setProperty('--bg-gradient-2', theme.bg2);
    root.style.setProperty('--bg-gradient-3', theme.bg3);
    
    // 更新浮動裝飾
    const shapes = document.querySelectorAll('.floating-shape');
    shapes.forEach((shape, index) => {
        const decoration = theme.decorations[index % theme.decorations.length];
        // 如果是 emoji，用背景色代替
        const colors = [theme.primary, theme.secondary, theme.accent];
        shape.style.background = `linear-gradient(45deg, ${colors[index % 3]}, ${colors[(index + 1) % 3]})`;
    });
    
    // 添加節日標題裝飾
    const header = document.querySelector('.header h1');
    if (header && !header.dataset.festival) {
        const decoration = theme.decorations[0];
        header.innerHTML = `${decoration} ${header.textContent} ${decoration}`;
        header.dataset.festival = 'true';
    }
    
    console.log(`🎉 已啟用 ${festival.name} 主題！`);
}

// 初始化節日主題
function initFestivalTheme() {
    const festival = getCurrentFestival();
    if (festival) {
        applyFestivalTheme(festival);
        
        // 顯示節日通知
        showFestivalNotification(festival);
    }
}

// 顯示節日通知
function showFestivalNotification(festival) {
    const notification = document.createElement('div');
    notification.className = 'festival-notification';
    notification.innerHTML = `
        <div class="festival-content">
            <span class="festival-icon">${festival.theme.decorations[0]}</span>
            <span class="festival-text">🎉 ${festival.name}快樂！</span>
            <span class="festival-icon">${festival.theme.decorations[1]}</span>
        </div>
    `;
    
    // 添加樣式
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, ${festival.theme.primary}, ${festival.theme.secondary});
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideIn 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
    `;
    
    const content = notification.querySelector('.festival-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // 5 秒後移除
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// 添加動畫樣式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    .festival-icon {
        font-size: 1.5rem;
        animation: bounce 1s ease-in-out infinite;
    }
`;
document.head.appendChild(style);

// 匯出函數
window.initFestivalTheme = initFestivalTheme;
window.getCurrentFestival = getCurrentFestival;
