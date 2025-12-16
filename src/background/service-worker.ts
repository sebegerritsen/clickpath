/**
 * Corporater ClickPath - Background Service Worker
 * Simplified - most work is done by content script directly calling Corporater API
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ClickPath] Extension installed:', details.reason);
});

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-tour') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'START_TOUR', tourId: '' });
      }
    });
  }
});

// Handle external connections (for install detection from CVO)
chrome.runtime.onMessageExternal.addListener((
  message: { type: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: { success: boolean; data?: unknown }) => void
) => {
  if (message.type === 'PING') {
    sendResponse({
      success: true,
      data: {
        installed: true,
        version: chrome.runtime.getManifest().version
      }
    });
  }
  return true;
});

// Simple message relay
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ClickPath] Background received:', message.type);

  if (message.type === 'PING') {
    sendResponse({ success: true, data: { installed: true } });
  }

  return true;
});

console.log('[ClickPath] Service worker started');
