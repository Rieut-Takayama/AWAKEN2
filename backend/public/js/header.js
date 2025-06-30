// 共通ヘッダーコンポーネント
function createHeader() {
    const currentPath = window.location.pathname;
    const isLoggedIn = localStorage.getItem('token');
    
    // ログインページの場合はヘッダーを表示しない
    if (currentPath === '/' || currentPath === '/login' || currentPath === '/index.html') {
        return '';
    }
    
    return `
        <a href="/dashboard.html" class="logo">AWAKEN2</a>
        
        <div class="header-info">
            <nav class="nav-menu">
                <a href="/dashboard.html" class="nav-item ${currentPath.includes('dashboard') ? 'active' : ''}">
                    ダッシュボード
                </a>
                <a href="/settings.html" class="nav-item ${currentPath.includes('settings') ? 'active' : ''}">
                    設定
                </a>
                <a href="/guide.html" class="nav-item ${currentPath.includes('guide') ? 'active' : ''}">
                    ガイド
                </a>
                <a href="/faq.html" class="nav-item ${currentPath.includes('faq') ? 'active' : ''}">
                    FAQ
                </a>
            </nav>
            
            ${isLoggedIn ? `
                <button class="logout-btn" onclick="logout()">
                    ログアウト
                </button>
            ` : ''}
        </div>
        
        <!-- モバイル用ハンバーガーメニュー -->
        <div class="hamburger-menu" onclick="toggleMobileMenu()">
            <span></span>
            <span></span>
            <span></span>
        </div>
        
        <!-- モバイルメニュー -->
        <div class="mobile-menu" id="mobileMenu">
            <a href="/dashboard.html" class="mobile-nav-item ${currentPath.includes('dashboard') ? 'active' : ''}">
                🏠 ダッシュボード
            </a>
            <a href="/settings.html" class="mobile-nav-item ${currentPath.includes('settings') ? 'active' : ''}">
                ⚙️ 設定
            </a>
            <a href="/guide.html" class="mobile-nav-item ${currentPath.includes('guide') ? 'active' : ''}">
                📖 ガイド
            </a>
            <a href="/faq.html" class="mobile-nav-item ${currentPath.includes('faq') ? 'active' : ''}">
                ❓ FAQ
            </a>
            ${isLoggedIn ? `
                <button class="mobile-logout-btn" onclick="logout()">
                    🚪 ログアウト
                </button>
            ` : ''}
        </div>
    `;
}

// ログアウト関数
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// モバイルメニューのトグル
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger-menu');
    menu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// ヘッダーのスタイルを追加
const headerStyles = `
    <style>
        /* ヘッダー基本スタイル */
        .header {
            background: rgba(0, 0, 0, 0.9);
            border-bottom: 2px solid #00ff41;
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .logo {
            font-family: 'Orbitron', monospace;
            font-size: 1.8rem;
            font-weight: 900;
            color: #00ff41;
            text-decoration: none;
            text-shadow: 0 0 10px #00ff41;
            animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
            from { text-shadow: 0 0 10px #00ff41; }
            to { text-shadow: 0 0 20px #00ff41, 0 0 30px #00ff41; }
        }

        .header-info {
            display: flex;
            align-items: center;
            gap: 2rem;
        }

        .nav-menu {
            display: flex;
            gap: 2rem;
            align-items: center;
        }

        .nav-item {
            color: #00ff41;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            text-transform: uppercase;
            padding: 0.5rem 1rem;
            border: 1px solid transparent;
            border-radius: 4px;
        }

        .nav-item:hover {
            border-color: #00ff41;
            background: rgba(0, 255, 65, 0.1);
            box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
        }

        .nav-item.active {
            border-color: #00ff41;
            background: rgba(0, 255, 65, 0.1);
        }

        .logout-btn {
            background: rgba(0, 255, 65, 0.1);
            color: #00ff41;
            border: 1px solid #00ff41;
            padding: 0.5rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            font-family: 'Roboto Mono', monospace;
            text-transform: uppercase;
            transition: all 0.3s ease;
        }

        .logout-btn:hover {
            background: rgba(0, 255, 65, 0.2);
            box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
        }

        /* ハンバーガーメニュー */
        .hamburger-menu {
            display: none;
            flex-direction: column;
            cursor: pointer;
            padding: 5px;
            z-index: 1001;
        }
        
        .hamburger-menu span {
            width: 25px;
            height: 3px;
            background: var(--matrix-green, #00ff41);
            margin: 3px 0;
            transition: 0.3s;
            border-radius: 2px;
            box-shadow: 0 0 5px #00ff41;
        }
        
        .hamburger-menu.active span:nth-child(1) {
            transform: rotate(-45deg) translate(-6px, 6px);
        }
        
        .hamburger-menu.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger-menu.active span:nth-child(3) {
            transform: rotate(45deg) translate(-6px, -6px);
        }
        
        .mobile-menu {
            display: none;
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.98);
            border-bottom: 2px solid var(--matrix-green, #00ff41);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.9);
            z-index: 999;
            padding: 0;
            transform: translateY(-100%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .mobile-menu.active {
            transform: translateY(0);
        }
        
        .mobile-nav-item {
            display: block;
            color: var(--matrix-green, #00ff41);
            text-decoration: none;
            padding: 1.2rem 1.5rem;
            margin: 0;
            border: none;
            border-bottom: 1px solid rgba(0, 255, 65, 0.1);
            transition: all 0.3s ease;
            font-size: 1.1rem;
            font-weight: 500;
        }
        
        .mobile-nav-item:hover,
        .mobile-nav-item.active {
            background: rgba(0, 255, 65, 0.1);
            padding-left: 2rem;
        }
        
        .mobile-nav-item.active {
            border-left: 3px solid var(--matrix-green, #00ff41);
        }
        
        .mobile-logout-btn {
            width: 100%;
            background: rgba(255, 0, 64, 0.1);
            color: #ff0040;
            border: none;
            border-top: 2px solid rgba(255, 0, 64, 0.3);
            padding: 1.2rem;
            margin: 0;
            cursor: pointer;
            font-weight: 600;
            text-transform: uppercase;
            transition: all 0.3s ease;
            font-size: 1rem;
        }
        
        .mobile-logout-btn:hover {
            background: rgba(255, 0, 64, 0.2);
        }
        
        @media (max-width: 768px) {
            .nav-menu {
                display: none !important;
            }
            
            .logout-btn {
                display: none !important;
            }
            
            .hamburger-menu {
                display: flex !important;
            }
            
            .mobile-menu {
                display: block;
            }
            
            .header {
                padding: 1rem !important;
            }
            
            .header-info {
                gap: 1rem !important;
            }
            
            .logo {
                font-size: 1.5rem !important;
            }
        }
    </style>
`;

// DOMContentLoadedイベントでヘッダーを挿入
document.addEventListener('DOMContentLoaded', function() {
    // スタイルを追加
    if (!document.querySelector('#header-styles')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'header-styles';
        styleElement.innerHTML = headerStyles;
        document.head.appendChild(styleElement);
    }
    
    // ヘッダーを挿入
    const headerContainer = document.querySelector('.header');
    if (headerContainer) {
        // 既存のヘッダーの中身を置き換え
        headerContainer.innerHTML = createHeader();
    }
});