/**
 * Corporater ClickPath - Installation Prompt
 *
 * Embed this script in a Corporater CustomVisualization object (CVO)
 * to prompt users to install the ClickPath extension.
 *
 * Usage:
 * 1. Create a CustomVisualization object in Corporater
 * 2. Paste this code in the JavaScript field
 * 3. Add the CSS below in the HTML field (inside <style> tags)
 * 4. The prompt will appear if the extension is not installed
 */

(function() {
  'use strict';

  // Configuration - update these values
  var CONFIG = {
    // Chrome Web Store URL (update when published)
    chromeStoreUrl: 'https://chrome.google.com/webstore/detail/corporater-clickpath/YOUR_EXTENSION_ID',

    // Direct download URL (for enterprise distribution)
    directDownloadUrl: '',

    // Extension ID (for detection)
    extensionId: 'YOUR_EXTENSION_ID',

    // Custom colors (leave empty to use defaults)
    primaryColor: '',  // e.g., '#0066B3'

    // Show after delay (milliseconds)
    showDelay: 2000,

    // Don't show again for N days after dismissing
    dismissDays: 7
  };

  // Check if extension is installed
  function isExtensionInstalled() {
    return new Promise(function(resolve) {
      // Method 1: Check for injected element
      if (document.querySelector('.clickpath-help-button')) {
        resolve(true);
        return;
      }

      // Method 2: Try to send message to extension
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          chrome.runtime.sendMessage(CONFIG.extensionId, { type: 'PING' }, function(response) {
            resolve(response && response.success);
          });
          return;
        } catch (e) {
          // Extension not available
        }
      }

      resolve(false);
    });
  }

  // Check if prompt was dismissed recently
  function wasRecentlyDismissed() {
    var dismissed = localStorage.getItem('clickpath_install_dismissed');
    if (!dismissed) return false;

    var dismissedDate = new Date(parseInt(dismissed, 10));
    var now = new Date();
    var daysDiff = (now - dismissedDate) / (1000 * 60 * 60 * 24);

    return daysDiff < CONFIG.dismissDays;
  }

  // Save dismissal
  function saveDismissal() {
    localStorage.setItem('clickpath_install_dismissed', Date.now().toString());
  }

  // Create and show the install banner
  function showInstallBanner() {
    var primaryColor = CONFIG.primaryColor || '#0066B3';

    var banner = document.createElement('div');
    banner.id = 'clickpath-install-banner';
    banner.innerHTML = [
      '<div class="clickpath-install-content">',
      '  <div class="clickpath-install-icon">',
      '    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">',
      '      <circle cx="16" cy="16" r="14" fill="' + primaryColor + '"/>',
      '      <text x="16" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="bold">?</text>',
      '    </svg>',
      '  </div>',
      '  <div class="clickpath-install-text">',
      '    <strong>Corporater ClickPath</strong>',
      '    <span>Install the browser extension for guided tours and documentation</span>',
      '  </div>',
      '</div>',
      '<div class="clickpath-install-actions">',
      '  <button class="clickpath-install-btn clickpath-install-btn-primary" onclick="window.clickpathInstall()">',
      '    Install Extension',
      '  </button>',
      '  <button class="clickpath-install-btn clickpath-install-btn-dismiss" onclick="window.clickpathDismiss()">',
      '    Not Now',
      '  </button>',
      '</div>'
    ].join('');

    // Add styles
    var style = document.createElement('style');
    style.textContent = [
      '#clickpath-install-banner {',
      '  position: fixed;',
      '  bottom: 0;',
      '  left: 0;',
      '  right: 0;',
      '  background: ' + primaryColor + ';',
      '  color: #ffffff;',
      '  padding: 12px 20px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 16px;',
      '  z-index: 99999;',
      '  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);',
      '  animation: clickpath-slide-up 0.3s ease;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '@keyframes clickpath-slide-up {',
      '  from { transform: translateY(100%); }',
      '  to { transform: translateY(0); }',
      '}',
      '.clickpath-install-content {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 12px;',
      '}',
      '.clickpath-install-icon { flex-shrink: 0; }',
      '.clickpath-install-text {',
      '  font-size: 14px;',
      '}',
      '.clickpath-install-text strong {',
      '  display: block;',
      '  font-size: 15px;',
      '  margin-bottom: 2px;',
      '}',
      '.clickpath-install-text span {',
      '  opacity: 0.9;',
      '}',
      '.clickpath-install-actions {',
      '  display: flex;',
      '  gap: 8px;',
      '  flex-shrink: 0;',
      '}',
      '.clickpath-install-btn {',
      '  padding: 8px 16px;',
      '  border-radius: 6px;',
      '  font-size: 14px;',
      '  font-weight: 500;',
      '  cursor: pointer;',
      '  border: none;',
      '  transition: all 0.2s;',
      '  font-family: inherit;',
      '}',
      '.clickpath-install-btn-primary {',
      '  background: #ffffff;',
      '  color: ' + primaryColor + ';',
      '}',
      '.clickpath-install-btn-primary:hover {',
      '  background: #f0f0f0;',
      '}',
      '.clickpath-install-btn-dismiss {',
      '  background: transparent;',
      '  color: rgba(255, 255, 255, 0.8);',
      '  border: 1px solid rgba(255, 255, 255, 0.3);',
      '}',
      '.clickpath-install-btn-dismiss:hover {',
      '  background: rgba(255, 255, 255, 0.1);',
      '  color: #ffffff;',
      '}'
    ].join('\n');

    document.head.appendChild(style);
    document.body.appendChild(banner);
  }

  // Hide banner
  function hideBanner() {
    var banner = document.getElementById('clickpath-install-banner');
    if (banner) {
      banner.style.animation = 'clickpath-slide-down 0.3s ease forwards';
      setTimeout(function() {
        banner.remove();
      }, 300);
    }
  }

  // Install action
  window.clickpathInstall = function() {
    var url = CONFIG.directDownloadUrl || CONFIG.chromeStoreUrl;
    window.open(url, '_blank');
    hideBanner();
  };

  // Dismiss action
  window.clickpathDismiss = function() {
    saveDismissal();
    hideBanner();
  };

  // Main initialization
  function init() {
    // Don't show if recently dismissed
    if (wasRecentlyDismissed()) {
      console.log('[ClickPath] Install prompt dismissed recently, skipping');
      return;
    }

    // Check if extension is installed
    isExtensionInstalled().then(function(installed) {
      if (installed) {
        console.log('[ClickPath] Extension already installed');
        return;
      }

      // Show banner after delay
      setTimeout(showInstallBanner, CONFIG.showDelay);
    });
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
