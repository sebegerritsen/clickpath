/**
 * ClickPath Popup Script
 * Tour selection and management UI
 */

interface TourInfo {
  id: string;
  name: string;
  description?: string;
}

class ClickPathPopup {
  private tourList: HTMLElement;
  private statusMessage: HTMLElement;

  constructor() {
    this.tourList = document.getElementById('tourList')!;
    this.statusMessage = document.getElementById('statusMessage')!;
    this.init();
  }

  private async init() {
    this.loadTours();
  }

  private async loadTours() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        this.showStatus('No active tab found', 'error');
        return;
      }

      // Check if we're on a Corporater page
      if (!tab.url?.includes('corporater')) {
        this.showStatus('Navigate to a Corporater page to use tours', 'info');
        return;
      }

      // Request tours from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_TOURS' });

      if (response?.success && response.data?.length > 0) {
        this.renderTours(response.data);
      } else {
        this.showStatus('No tours available for this page', 'info');
      }
    } catch (error) {
      console.error('[ClickPath] Failed to load tours:', error);
      this.showStatus('Could not connect to page. Try refreshing.', 'error');
    }
  }

  private renderTours(tours: TourInfo[]) {
    this.tourList.innerHTML = '';

    tours.forEach(tour => {
      const item = document.createElement('div');
      item.className = 'tour-item';
      item.innerHTML = `
        <div class="tour-info">
          <div class="tour-name">${tour.name}</div>
          ${tour.description ? `<div class="tour-description">${tour.description}</div>` : ''}
        </div>
        <button class="start-btn" data-tour-id="${tour.id}">Start</button>
      `;

      item.querySelector('.start-btn')?.addEventListener('click', () => {
        this.startTour(tour.id);
      });

      this.tourList.appendChild(item);
    });
  }

  private async startTour(tourId: string) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, { type: 'START_TOUR', tourId });
        window.close(); // Close popup after starting tour
      }
    } catch (error) {
      console.error('[ClickPath] Failed to start tour:', error);
      this.showStatus('Failed to start tour', 'error');
    }
  }

  private showStatus(message: string, type: 'info' | 'error') {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    this.statusMessage.style.display = 'block';
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new ClickPathPopup();
});
