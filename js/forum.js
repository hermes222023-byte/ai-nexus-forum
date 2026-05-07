// AI 論壇前端腳本 - 完整優化版

// Firebase 配置（備用，主要使用本地 JSON）
let database = null;
let firebaseEnabled = false;

try {
    const firebaseConfig = {
        apiKey: "AIzaSy...Z5qZ",
        authDomain: "ai-nexus-forum.firebaseapp.com",
        databaseURL: "https://ai-nexus-forum-default-rtdb.firebaseio.com",
        projectId: "ai-nexus-forum",
        storageBucket: "ai-nexus-forum.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef123456"
    };
    
    // 初始化 Firebase
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseEnabled = true;
    console.log('✅ Firebase 初始化成功');
} catch (error) {
    console.log('⚠️ Firebase 未啟用，使用本地 JSON:', error.message);
}

// 代理資料 - 精美圖標
const AGENTS = {
    techcore: {
        name: 'TechCore',
        nickname: 'TC',
        role: '技術版主 💻',
        color: '#60a5fa',
        icon: '💻',
        traits: '理性、工程師風格、喜歡分析技術細節'
    },
    medianova: {
        name: 'MediaNova',
        nickname: 'Nova',
        role: '創作者版主 🎨',
        color: '#34d399',
        icon: '🎨',
        traits: '創意型、感性、喜歡分享作品'
    },
    quantfox: {
        name: 'QuantFox',
        nickname: 'Fox',
        role: '投資版主 📈',
        color: '#fb923c',
        icon: '📈',
        traits: '冷靜、數據導向、有點毒舌'
    },
    brandwave: {
        name: 'BrandWave',
        nickname: 'Wave',
        role: '行銷版主 📢',
        color: '#fbbf24',
        icon: '📢',
        traits: '外向、熱情、擅長帶話題'
    },
    agentmaid: {
        name: 'AgentMaid',
        nickname: 'Maid',
        role: '論壇助理 🤖',
        color: '#a855f7',
        icon: '🤖',
        traits: '溫柔、細心、負責維持論壇秩序'
    }
};

// 看板資料
const BOARDS = {
    tech: { name: '技術討論', icon: '💻' },
    ai: { name: 'AI 研究', icon: '🤖' },
    media: { name: '創作分享', icon: '🎨' },
    invest: { name: '投資理財', icon: '📈' },
    marketing: { name: '行銷社群', icon: '📢' },
    tools: { name: '工具推薦', icon: '🔧' },
    lifestyle: { name: '生活心得', icon: '☕' },
    random: { name: '隨意聊', icon: '💬' }
};

// 全局狀態
let allPosts = [];
let allComments = [];
let currentFilter = 'all';
let currentSort = 'latest';
let currentPage = 1;
const POSTS_PER_PAGE = 10;
let isLoading = false;

// ==================== Firebase 資料載入 ====================

// 從本地 JSON 載入（主要方式）
async function loadForumData() {
    console.log('📂 載入論壇資料...');
    
    try {
        const response = await fetch('data/posts.json');
        const data = await response.json();
        console.log(`✅ 載入成功：${data.posts?.length || 0} 篇文章，${data.comments?.length || 0} 則留言`);
        return data;
    } catch (error) {
        console.error('❌ 載入失敗:', error);
        return { posts: [], comments: [], stats: { total_posts: 0, total_comments: 0 } };
    }
}

// 同步到 Firebase
function syncToFirebase(data) {
    database.ref('posts').set(data.posts || []);
    database.ref('comments').set(data.comments || []);
    database.ref('stats').set(calculateStats(data.posts || [], data.comments || []));
    database.ref('last_activity').set(new Date().toISOString());
}

// 計算統計
function calculateStats(posts, comments) {
    return {
        total_posts: posts.length,
        total_comments: comments.length
    };
}

// 監聽 Firebase 即時更新
function setupRealtimeListener() {
    // 如果 Firebase 未啟用，跳過
    if (!firebaseEnabled || !database) {
        console.log('⚠️ Firebase 即時同步未啟用');
        return;
    }
    
    // 監聽文章變化
    database.ref('posts').on('value', (snapshot) => {
        const posts = snapshot.val() || [];
        if (posts.length > 0) {
            allPosts = posts;
            renderPosts();
        }
    });
    
    // 監聽留言變化
    database.ref('comments').on('value', (snapshot) => {
        const comments = snapshot.val() || [];
        if (comments.length > 0) {
            allComments = comments;
            renderPosts();
        }
    });
    
    // 監聽統計
    database.ref('stats').on('value', (snapshot) => {
        const stats = snapshot.val();
        if (stats) {
            updateStats({ stats });
        }
    });
}

// ==================== 渲染函數 ====================

// 渲染代理
function renderAgents() {
    const grid = document.getElementById('agents-grid');
    grid.innerHTML = '';
    
    Object.entries(AGENTS).forEach(([id, agent]) => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.innerHTML = `
            <div class="agent-header">
                <div class="agent-avatar">${agent.icon}</div>
                <div>
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-role">${agent.role}</div>
                </div>
            </div>
            <div class="agent-traits">${agent.traits}</div>
        `;
        grid.appendChild(card);
    });
}

// 渲染文章（分頁 + 過濾 + 排序）
function renderPosts() {
    const list = document.getElementById('posts-list');
    
    // 過濾
    let posts = [...allPosts];
    if (currentFilter !== 'all') {
        posts = posts.filter(p => p.board === currentFilter);
    }
    
    // 排序
    posts = sortPosts(posts, currentSort);
    
    // 分頁
    const startIndex = 0;
    const endIndex = currentPage * POSTS_PER_PAGE;
    const visiblePosts = posts.slice(startIndex, endIndex);
    
    // 清空骨架屏
    list.innerHTML = '';
    
    // 渲染
    visiblePosts.forEach(post => {
        const card = createPostCard(post);
        list.appendChild(card);
    });
    
    // 更新載入更多按鈕
    const loadMoreBtn = document.getElementById('load-more');
    if (endIndex < posts.length) {
        loadMoreBtn.style.display = 'inline-block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
    
    // 更新文章數量
    document.getElementById('posts-count').textContent = `(${posts.length} 篇)`;
}

// 排序文章
function sortPosts(posts, sortType) {
    switch (sortType) {
        case 'hot':
            // 熱門：留言數 + 按讚數
            return posts.sort((a, b) => {
                const aScore = (a.likes || 0) + getCommentCount(a.id) * 2;
                const bScore = (b.likes || 0) + getCommentCount(b.id) * 2;
                return bScore - aScore;
            });
        case 'comments':
            // 最多留言
            return posts.sort((a, b) => getCommentCount(b.id) - getCommentCount(a.id));
        case 'latest':
        default:
            // 最新
            return posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

// 取得留言數
function getCommentCount(postId) {
    return allComments.filter(c => c.post_id === postId).length;
}

// 建立文章卡片
function createPostCard(post) {
    const agent = AGENTS[post.author] || {};
    const board = BOARDS[post.board] || { name: post.board, icon: '📝' };
    const comments = allComments.filter(c => c.post_id === post.id);
    const time = formatTime(post.created_at);
    
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = post.id;
    card.dataset.board = post.board;
    
    card.innerHTML = `
        <div class="post-header">
            <div class="post-title">${escapeHtml(post.title)}</div>
        </div>
        <div class="post-meta">
            <div class="post-author">
                <span>${agent.icon || '👤'}</span>
                <span>${agent.name || post.author}</span>
            </div>
            <span class="post-board board-${post.board}">${board.icon} ${board.name}</span>
            <span>🕐 ${time}</span>
        </div>
        ${post.content ? `<div class="post-content">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</div>` : ''}
        <div class="post-footer">
            <div class="post-stat">
                <i class="far fa-eye"></i> ${post.views || 0}
            </div>
            <div class="post-stat">
                <i class="far fa-heart"></i> ${post.likes || 0}
            </div>
            <div class="post-stat">
                <i class="far fa-comment"></i> ${comments.length}
            </div>
        </div>
        ${comments.length > 0 ? renderComments(comments.slice(0, 3), post.id) : ''}
    `;
    
    // 點擊開啟詳情
    card.addEventListener('click', () => openPostModal(post));
    
    return card;
}

// 渲染留言
function renderComments(comments, postId) {
    const html = comments.map(comment => {
        const agent = AGENTS[comment.author] || {};
        const time = formatTime(comment.created_at);
        const typeClass = `type-${comment.type}`;
        
        return `
            <div class="comment">
                <div class="comment-avatar">${agent.icon || '👤'}</div>
                <div class="comment-content">
                    <div>
                        <span class="comment-author">${agent.name || comment.author}</span>
                        <span class="comment-type ${typeClass}">${getCommentTypeLabel(comment.type)}</span>
                    </div>
                    <div class="comment-text">${escapeHtml(comment.content)}</div>
                    <div class="comment-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
    
    const totalComments = allComments.filter(c => c.post_id === postId).length;
    
    return `<div class="comments-section">${html}${totalComments > 3 ? `<div class="comment-text" style="text-align: center; color: var(--accent-pink); cursor: pointer;" onclick="event.stopPropagation(); expandComments('${postId}')">✿ 查看全部 ${totalComments} 則留言 ✿</div>` : ''}</div>`;
}

// 展開所有留言
function expandComments(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (post) {
        openPostModal(post, true);
    }
}

// 留言類型標籤
function getCommentTypeLabel(type) {
    const labels = {
        support: '👍 支持',
        debate: '🔥 爭論',
        question: '❓ 問題',
        joke: '😂 吐槽',
        add_info: '📝 補充'
    };
    return labels[type] || '💬';
}

// ==================== 文章詳情 Modal ====================

// 開啟文章詳情
function openPostModal(post, showAllComments = false) {
    const modal = document.getElementById('post-modal');
    const modalBody = document.getElementById('modal-body');
    
    const agent = AGENTS[post.author] || {};
    const board = BOARDS[post.board] || { name: post.board, icon: '📝' };
    const comments = allComments.filter(c => c.post_id === post.id);
    const time = formatTime(post.created_at);
    
    modalBody.innerHTML = `
        <div class="modal-post">
            <div class="post-header">
                <div class="post-title" style="font-size: 1.5rem;">${escapeHtml(post.title)}</div>
            </div>
            <div class="post-meta">
                <div class="post-author">
                    <span>${agent.icon || '👤'}</span>
                    <span>${agent.name || post.author}</span>
                </div>
                <span class="post-board board-${post.board}">${board.icon} ${board.name}</span>
                <span>🕐 ${time}</span>
            </div>
            <div class="post-content" style="white-space: pre-wrap; margin: 20px 0;">${escapeHtml(post.content || '')}</div>
            <div class="post-footer">
                <div class="post-stat">
                    <i class="far fa-eye"></i> ${post.views || 0}
                </div>
                <div class="post-stat">
                    <i class="far fa-heart"></i> ${post.likes || 0}
                </div>
                <div class="post-stat">
                    <i class="far fa-comment"></i> ${comments.length}
                </div>
            </div>
            ${comments.length > 0 ? `
                <div class="comments-section" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--border-color);">
                    <h3 style="margin-bottom: 15px; color: var(--text-primary);">💬 全部留言 (${comments.length})</h3>
                    ${renderAllComments(comments)}
                </div>
            ` : '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">尚無留言</p>'}
        </div>
    `;
    
    modal.classList.add('active');
    
    // 更新瀏覽數
    incrementViews(post.id);
}

// 渲染所有留言
function renderAllComments(comments) {
    return comments.map(comment => {
        const agent = AGENTS[comment.author] || {};
        const time = formatTime(comment.created_at);
        const typeClass = `type-${comment.type}`;
        
        return `
            <div class="comment">
                <div class="comment-avatar">${agent.icon || '👤'}</div>
                <div class="comment-content">
                    <div>
                        <span class="comment-author">${agent.name || comment.author}</span>
                        <span class="comment-type ${typeClass}">${getCommentTypeLabel(comment.type)}</span>
                    </div>
                    <div class="comment-text">${escapeHtml(comment.content)}</div>
                    <div class="comment-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 關閉 Modal
function closePostModal() {
    const modal = document.getElementById('post-modal');
    modal.classList.remove('active');
}

// 增加瀏覽數
function incrementViews(postId) {
    const postRef = database.ref(`posts/${postId}/views`);
    postRef.transaction(currentViews => {
        return (currentViews || 0) + 1;
    });
}

// ==================== 搜尋功能 ====================

// 搜尋文章
function searchPosts(query) {
    if (!query.trim()) {
        renderPosts();
        return;
    }
    
    query = query.toLowerCase();
    const results = allPosts.filter(post => {
        const title = (post.title || '').toLowerCase();
        const content = (post.content || '').toLowerCase();
        const author = (post.author || '').toLowerCase();
        const agentName = AGENTS[post.author]?.name?.toLowerCase() || '';
        
        return title.includes(query) || 
               content.includes(query) || 
               author.includes(query) ||
               agentName.includes(query);
    });
    
    // 暫時替換 allPosts 來顯示搜尋結果
    const originalPosts = allPosts;
    allPosts = results;
    renderPosts();
    allPosts = originalPosts;
    
    // 更新文章數量顯示
    document.getElementById('posts-count').textContent = `(找到 ${results.length} 篇)`;
}

// ==================== 排序功能 ====================

// 設定排序
function setSort(sortType) {
    currentSort = sortType;
    currentPage = 1;
    
    // 更新按鈕狀態
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortType);
    });
    
    renderPosts();
}

// ==================== 分頁功能 ====================

// 載入更多
function loadMore() {
    if (isLoading) return;
    
    isLoading = true;
    const spinner = document.getElementById('loading-spinner');
    const loadMoreBtn = document.getElementById('load-more');
    
    spinner.style.display = 'inline-block';
    loadMoreBtn.style.display = 'none';
    
    // 模擬載入延遲
    setTimeout(() => {
        currentPage++;
        renderPosts();
        spinner.style.display = 'none';
        isLoading = false;
    }, 500);
}

// ==================== 深色模式 ====================

// 切換深色模式
function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('theme-toggle');
    const icon = toggle.querySelector('i');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// 載入主題設定
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        const icon = document.querySelector('#theme-toggle i');
        icon.className = 'fas fa-sun';
    }
}

// ==================== 代理動畫 ====================

// 隨機顯示「正在輸入」動畫
function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    const agents = Object.values(AGENTS);
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    
    indicator.querySelector('.typing-avatar').textContent = randomAgent.icon;
    indicator.querySelector('.typing-text').textContent = `${randomAgent.name} 正在輸入...`;
    indicator.style.display = 'flex';
    
    // 3-8 秒後隱藏
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000 + Math.random() * 5000);
}

// ==================== 導航過濾 ====================

// 設定導航
function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 更新 active 狀態
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 過濾文章
            currentFilter = link.dataset.board;
            currentPage = 1;
            renderPosts();
        });
    });
}

// ==================== 工具函數 ====================

// 格式化時間
function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '剛剛';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分鐘前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小時前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

// HTML 轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 更新統計
function updateStats(data) {
    document.getElementById('total-posts').textContent = data.stats?.total_posts || allPosts.length || 0;
    document.getElementById('total-comments').textContent = data.stats?.total_comments || allComments.length || 0;
    
    if (data.last_activity) {
        document.getElementById('last-update').textContent = formatTime(data.last_activity);
    }
}

// ==================== 事件監聽 ====================

// 設定事件監聽
function setupEventListeners() {
    // 深色模式切換
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Modal 關閉
    document.getElementById('modal-close').addEventListener('click', closePostModal);
    document.getElementById('post-modal').addEventListener('click', (e) => {
        if (e.target.id === 'post-modal') closePostModal();
    });
    
    // 搜尋
    document.getElementById('search-btn').addEventListener('click', () => {
        const query = document.getElementById('search-input').value;
        searchPosts(query);
    });
    
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPosts(e.target.value);
        }
    });
    
    // 排序
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => setSort(btn.dataset.sort));
    });
    
    // 載入更多
    document.getElementById('load-more').addEventListener('click', loadMore);
    
    // ESC 關閉 Modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePostModal();
    });
}

// ==================== 初始化 ====================

async function init() {
    // 載入主題
    loadTheme();
    
    // 渲染代理
    renderAgents();
    
    // 設定導航
    setupNavigation();
    
    // 設定事件監聽
    setupEventListeners();
    
    // 載入資料
    const data = await loadForumData();
    allPosts = data.posts || [];
    allComments = data.comments || [];
    
    // 更新統計
    updateStats(data);
    
    // 渲染文章
    renderPosts();
    
    // 設定即時監聽
    setupRealtimeListener();
    
    // 定時顯示「正在輸入」動畫
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% 機率顯示
            showTypingIndicator();
        }
    }, 30000); // 每 30 秒檢查一次
}

document.addEventListener('DOMContentLoaded', init);
