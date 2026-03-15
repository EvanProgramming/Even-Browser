class Browser {
  constructor() {
    this.tabs = new Map();
    this.currentTabId = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupLiquidGlassMouseTracking();
    this.registerShortcuts();
  }

  bindEvents() {
    // Window control buttons
    document.getElementById('minimize-btn').addEventListener('click', () => {
      window.electron.minimizeWindow();
    });

    document.getElementById('maximize-btn').addEventListener('click', () => {
      window.electron.maximizeWindow();
    });

    document.getElementById('close-btn').addEventListener('click', () => {
      window.electron.closeWindow();
    });

    // New tab button
    document.getElementById('new-tab-btn').addEventListener('click', () => {
      this.createTab();
    });

    // Address bar events
    const addressInput = document.getElementById('address-input');
    addressInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.loadUrl(addressInput.value);
      }
    });

    // Navigation buttons
    document.getElementById('back-btn').addEventListener('click', () => {
      if (this.currentTabId) {
        window.electron.goBack(this.currentTabId);
      }
    });

    document.getElementById('forward-btn').addEventListener('click', () => {
      if (this.currentTabId) {
        window.electron.goForward(this.currentTabId);
      }
    });

    document.getElementById('reload-btn').addEventListener('click', () => {
      if (this.currentTabId) {
        window.electron.reload(this.currentTabId);
      }
    });

    // Toolbar buttons
    document.getElementById('share-btn').addEventListener('click', () => {
      this.showShareMenu();
    });

    document.getElementById('tabs-btn').addEventListener('click', () => {
      this.showTabsOverview();
    });

    // IPC events
    window.electron.onTabTitleUpdated((data) => {
      this.updateTabTitle(data.tabId, data.title);
    });

    window.electron.onTabFaviconUpdated((data) => {
      this.updateTabFavicon(data.tabId, data.favicon);
    });

    window.electron.onTabLoading((data) => {
      this.updateTabLoading(data.tabId, data.loading);
    });

    window.electron.onTabUrlUpdated((data) => {
      this.updateTabUrl(data.tabId, data.url);
    });

    window.electron.onTabSwitched((tabId) => {
      this.switchTab(tabId);
    });

    window.electron.onTabClosed((tabId) => {
      this.removeTab(tabId);
    });
  }

  setupLiquidGlassMouseTracking() {
    const liquidGlassElements = document.querySelectorAll('.liquid-glass');
    liquidGlassElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        element.style.setProperty('--mouse-x', `${x}%`);
        element.style.setProperty('--mouse-y', `${y}%`);
      });
    });
  }

  registerShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl+T: New tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        this.createTab();
      }
      
      // Cmd+W: Close tab
      if (e.metaKey && e.key === 'w') {
        e.preventDefault();
        if (this.currentTabId) {
          this.closeTab(this.currentTabId);
        }
      }
      
      // Cmd+L: Focus address bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        document.getElementById('address-input').focus();
      }
      
      // Cmd+R: Reload
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        if (this.currentTabId) {
          window.electron.reload(this.currentTabId);
        }
      }
      
      // Cmd+[: Back
      if (e.metaKey && e.key === '[') {
        e.preventDefault();
        if (this.currentTabId) {
          window.electron.goBack(this.currentTabId);
        }
      }
      
      // Cmd+]: Forward
      if (e.metaKey && e.key === ']') {
        e.preventDefault();
        if (this.currentTabId) {
          window.electron.goForward(this.currentTabId);
        }
      }
      
      // Cmd+Tab: Next tab
      if (e.metaKey && e.key === 'Tab') {
        e.preventDefault();
        this.nextTab();
      }
      
      // Cmd+Shift+Tab: Previous tab
      if (e.metaKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        this.previousTab();
      }
      
      // Cmd+1-9: Switch to tab
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        this.switchToTabByIndex(index);
      }
      
      // Cmd+Shift+T: Reopen closed tab
      if (e.metaKey && e.shiftKey && e.key === 't') {
        e.preventDefault();
        this.reopenClosedTab();
      }
    });
  }

  createTab(url = '') {
    window.electron.createTab(url);
  }

  switchTab(tabId) {
    this.currentTabId = tabId;
    
    // Update active tab UI
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
      if (parseInt(tab.dataset.tabId) === tabId) {
        tab.classList.add('active');
      }
    });

    // Update address bar with current tab URL
    const tab = this.tabs.get(tabId);
    if (tab) {
      // Check if it's the home page
      if (tab.url.startsWith('file://') && tab.url.includes('src/pages/home.html')) {
        document.getElementById('address-input').value = '';
        document.getElementById('address-input').placeholder = '搜索或输入网址';
      } else {
        document.getElementById('address-input').value = tab.url || '';
      }
    }
  }

  closeTab(tabId) {
    window.electron.closeTab(tabId);
  }

  removeTab(tabId) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.classList.add('fade-out');
      setTimeout(() => {
        tabElement.remove();
      }, 350);
    }
    this.tabs.delete(tabId);
  }

  loadUrl(input) {
    let url = input.trim();
    
    // Smart URL detection
    if (url.includes('://')) {
      // Already has protocol
    } else if (url.includes('.') && !url.includes(' ')) {
      // Add https:// prefix
      url = `https://${url}`;
    } else {
      // Search query
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    if (this.currentTabId) {
      window.electron.loadUrl(this.currentTabId, url);
    }
  }

  updateTabTitle(tabId, title) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
      const titleElement = tabElement.querySelector('.tab-title');
      if (titleElement) {
        titleElement.textContent = title;
      }
    }

    // Update tab data
    if (this.tabs.has(tabId)) {
      const tab = this.tabs.get(tabId);
      tab.title = title;
      this.tabs.set(tabId, tab);
    }
  }

  updateTabFavicon(tabId, favicon) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
      const iconElement = tabElement.querySelector('.tab-icon');
      if (iconElement) {
        iconElement.innerHTML = favicon ? `<img src="${favicon}" width="14" height="14" alt="">` : '🌐';
      }
    }
  }

  updateTabLoading(tabId, loading) {
    const loadingBar = document.querySelector('.loading-bar');
    if (loadingBar) {
      if (loading) {
        loadingBar.classList.add('indeterminate');
      } else {
        loadingBar.classList.remove('indeterminate');
        loadingBar.style.width = '100%';
        setTimeout(() => {
          loadingBar.style.width = '0';
        }, 300);
      }
    }
  }

  updateTabUrl(tabId, url) {
    if (tabId === this.currentTabId) {
      // Check if it's the home page
      if (url.startsWith('file://') && url.includes('src/pages/home.html')) {
        document.getElementById('address-input').value = '';
        document.getElementById('address-input').placeholder = '搜索或输入网址';
      } else {
        document.getElementById('address-input').value = url;
      }
    }

    // Update tab data
    if (this.tabs.has(tabId)) {
      const tab = this.tabs.get(tabId);
      tab.url = url;
      this.tabs.set(tabId, tab);
    } else {
      // Add new tab to map
      this.tabs.set(tabId, { url, title: '' });
      // For home page, show a better title in tab
      const displayUrl = url.startsWith('file://') && url.includes('src/pages/home.html') ? '主页' : url;
      this.createTabElement(tabId, displayUrl);
    }
  }

  createTabElement(tabId, url) {
    const tabsContainer = document.getElementById('tabs-container');
    const tabElement = document.createElement('div');
    tabElement.className = 'tab tab-create';
    tabElement.dataset.tabId = tabId;
    
    tabElement.innerHTML = `
      <div class="tab-icon">🌐</div>
      <div class="tab-title">${url}</div>
      <button class="tab-close">×</button>
    `;

    // Tab click event
    tabElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.switchTab(tabId);
        window.electron.switchTab(tabId);
      }
    });

    // Close button event
    const closeButton = tabElement.querySelector('.tab-close');
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });

    tabsContainer.appendChild(tabElement);
  }

  nextTab() {
    const tabIds = Array.from(this.tabs.keys());
    if (tabIds.length === 0) return;
    
    const currentIndex = tabIds.indexOf(this.currentTabId);
    const nextIndex = (currentIndex + 1) % tabIds.length;
    const nextTabId = tabIds[nextIndex];
    this.switchTab(nextTabId);
    window.electron.switchTab(nextTabId);
  }

  previousTab() {
    const tabIds = Array.from(this.tabs.keys());
    if (tabIds.length === 0) return;
    
    const currentIndex = tabIds.indexOf(this.currentTabId);
    const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    const prevTabId = tabIds[prevIndex];
    this.switchTab(prevTabId);
    window.electron.switchTab(prevTabId);
  }

  switchToTabByIndex(index) {
    const tabIds = Array.from(this.tabs.keys());
    if (index < tabIds.length) {
      const tabId = tabIds[index];
      this.switchTab(tabId);
      window.electron.switchTab(tabId);
    }
  }

  reopenClosedTab() {
    // Placeholder for reopen closed tab functionality
    console.log('Reopen closed tab');
  }

  showShareMenu() {
    if (!this.currentTabId) return;
    
    const tab = this.tabs.get(this.currentTabId);
    if (!tab || !tab.url) return;
    
    // Hide BrowserView temporarily
    window.electron.hideBrowserView();
    
    // Create share menu
    const shareMenu = document.createElement('div');
    shareMenu.className = 'share-menu';
    shareMenu.style.cssText = `
      position: fixed;
      top: 60px;
      right: 16px;
      background: var(--bg-secondary);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      box-shadow: var(--shadow-medium);
      z-index: 9999;
      min-width: 200px;
      animation: dropdown-appear var(--duration-normal) var(--ease-out-apple);
    `;
    
    shareMenu.innerHTML = `
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--text-primary);">分享链接</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="share-option" data-action="copy">
          <span style="margin-right: 8px;">📋</span> 复制链接
        </button>
        <button class="share-option" data-action="email">
          <span style="margin-right: 8px;">📧</span> 通过邮件发送
        </button>
        <button class="share-option" data-action="twitter">
          <span style="margin-right: 8px;">🐦</span> 分享到 X
        </button>
      </div>
    `;
    
    // Add share menu to body
    document.body.appendChild(shareMenu);
    
    // Add event listeners
    shareMenu.querySelectorAll('.share-option').forEach(button => {
      button.style.cssText = `
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--text-primary);
        font-size: 13px;
        cursor: pointer;
        transition: background var(--duration-fast) var(--ease-out-apple);
        width: 100%;
        text-align: left;
      `;
      
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(0, 0, 0, 0.05)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'transparent';
      });
      
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        switch (action) {
          case 'copy':
            navigator.clipboard.writeText(tab.url).then(() => {
              this.showNotification('链接已复制到剪贴板');
            });
            break;
          case 'email':
            window.open(`mailto:?subject=Check this out&body=${encodeURIComponent(tab.url)}`);
            break;
          case 'twitter':
            window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(tab.url)}`);
            break;
        }
        shareMenu.remove();
        // Show BrowserView again
        window.electron.showBrowserView();
      });
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!shareMenu.contains(e.target) && e.target.id !== 'share-btn') {
          shareMenu.remove();
          document.removeEventListener('click', closeMenu);
          // Show BrowserView again
          window.electron.showBrowserView();
        }
      });
    }, 100);
  }

  showTabsOverview() {
    // Hide BrowserView temporarily
    window.electron.hideBrowserView();
    
    // Create tabs overview
    const tabsOverview = document.createElement('div');
    tabsOverview.className = 'tabs-overview';
    tabsOverview.style.cssText = `
      position: fixed;
      top: 60px;
      right: 16px;
      background: var(--bg-secondary);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      box-shadow: var(--shadow-medium);
      z-index: 9999;
      min-width: 300px;
      max-height: 400px;
      overflow-y: auto;
      animation: dropdown-appear var(--duration-normal) var(--ease-out-apple);
    `;
    
    const tabs = Array.from(this.tabs.entries());
    if (tabs.length === 0) {
      tabsOverview.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 14px;">没有打开的标签页</div>';
    } else {
      tabsOverview.innerHTML = `
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--text-primary);">标签页</div>
        <div class="tabs-list" style="display: flex; flex-direction: column; gap: 4px;"></div>
      `;
      
      const tabsList = tabsOverview.querySelector('.tabs-list');
      tabs.forEach(([tabId, tab]) => {
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';
        tabItem.style.cssText = `
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out-apple);
          ${tabId === this.currentTabId ? 'background: rgba(0, 122, 255, 0.1);' : 'background: transparent;'}
        `;
        
        tabItem.innerHTML = `
          <div class="tab-item-icon" style="width: 16px; height: 16px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">🌐</div>
          <div class="tab-item-title" style="flex: 1; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${tab.title || tab.url}</div>
          <button class="tab-item-close" data-tab-id="${tabId}" style="width: 16px; height: 16px; border: none; border-radius: 50%; background: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
        `;
        
        tabItem.addEventListener('mouseenter', () => {
          tabItem.style.background = 'rgba(0, 0, 0, 0.05)';
        });
        
        tabItem.addEventListener('mouseleave', () => {
          tabItem.style.background = tabId === this.currentTabId ? 'rgba(0, 122, 255, 0.1)' : 'background: transparent;';
        });
        
        tabItem.addEventListener('click', (e) => {
          if (!e.target.closest('.tab-item-close')) {
            this.switchTab(tabId);
            window.electron.switchTab(tabId);
            tabsOverview.remove();
            // Show BrowserView again
            window.electron.showBrowserView();
          }
        });
        
        const closeButton = tabItem.querySelector('.tab-item-close');
        closeButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const closeTabId = parseInt(closeButton.dataset.tabId);
          this.closeTab(closeTabId);
          tabItem.remove();
          if (tabsList.children.length === 0) {
            tabsOverview.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 14px;">没有打开的标签页</div>';
          }
        });
        
        tabsList.appendChild(tabItem);
      });
    }
    
    // Add tabs overview to body
    document.body.appendChild(tabsOverview);
    
    // Close overview when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeOverview(e) {
        if (!tabsOverview.contains(e.target) && e.target.id !== 'tabs-btn') {
          tabsOverview.remove();
          document.removeEventListener('click', closeOverview);
          // Show BrowserView again
          window.electron.showBrowserView();
        }
      });
    }, 100);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 16px;
      background: var(--bg-secondary);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      box-shadow: var(--shadow-medium);
      z-index: 9999;
      font-size: 14px;
      color: var(--text-primary);
      animation: dropdown-appear var(--duration-normal) var(--ease-out-apple);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
      notification.style.animation = 'window-fade-in var(--duration-normal) var(--ease-in-apple) reverse';
      setTimeout(() => {
        notification.remove();
      }, 250);
    }, 2000);
  }
}

// Initialize browser when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Browser();
});