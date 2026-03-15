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

  createTab(url = 'https://www.google.com') {
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
      document.getElementById('address-input').value = tab.url || '';
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
      document.getElementById('address-input').value = url;
    }

    // Update tab data
    if (this.tabs.has(tabId)) {
      const tab = this.tabs.get(tabId);
      tab.url = url;
      this.tabs.set(tabId, tab);
    } else {
      // Add new tab to map
      this.tabs.set(tabId, { url, title: '' });
      this.createTabElement(tabId, url);
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
    // Placeholder for share menu
    console.log('Show share menu');
  }

  showTabsOverview() {
    // Placeholder for tabs overview
    console.log('Show tabs overview');
  }
}

// Initialize browser when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Browser();
});