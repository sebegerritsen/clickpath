/**
 * Tour Engine - Core tour rendering and navigation
 * Based on ui-patterns.json onboarding tour pattern
 */

import type { TourDefinition, TourStep, TourState, TourPage } from '../shared/types';

export class TourEngine {
  private tour: TourDefinition;
  private currentPageIndex: number;
  private currentStepIndex: number = 0;
  private overlay: HTMLElement | null = null;
  private state: TourState;

  constructor(tour: TourDefinition, startPageIndex: number = 0) {
    this.tour = tour;
    this.currentPageIndex = startPageIndex;
    this.state = {
      tourId: tour.id,
      currentPageIndex: startPageIndex,
      currentStepIndex: 0,
      startedAt: Date.now(),
      lastActivityAt: Date.now()
    };
  }

  public start(): void {
    console.log(`[ClickPath] Starting tour: ${this.tour.name}`);
    this.createOverlay();
    this.showStep();
  }

  public stop(): void {
    console.log(`[ClickPath] Stopping tour: ${this.tour.name}`);
    this.removeOverlay();
  }

  public getState(): TourState {
    return { ...this.state };
  }

  private get currentPage(): TourPage {
    return this.tour.pages[this.currentPageIndex];
  }

  private get currentStep(): TourStep {
    return this.currentPage.steps[this.currentStepIndex];
  }

  private get totalSteps(): number {
    return this.currentPage.steps.length;
  }

  private createOverlay(): void {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.className = 'clickpath-overlay';
    this.overlay.innerHTML = `
      <div class="clickpath-highlight" id="clickpathHighlight"></div>
      <div class="clickpath-tooltip" id="clickpathTooltip">
        <div class="clickpath-step-indicator"></div>
        <h4 class="clickpath-title"></h4>
        <p class="clickpath-content"></p>
        <div class="clickpath-buttons">
          <button class="clickpath-btn clickpath-btn-skip">Skip Tour</button>
          <div class="clickpath-nav-buttons">
            <button class="clickpath-btn clickpath-btn-back">Back</button>
            <button class="clickpath-btn clickpath-btn-next clickpath-btn-primary">Next</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.overlay.querySelector('.clickpath-btn-skip')?.addEventListener('click', () => this.skip());
    this.overlay.querySelector('.clickpath-btn-back')?.addEventListener('click', () => this.prevStep());
    this.overlay.querySelector('.clickpath-btn-next')?.addEventListener('click', () => this.nextStep());

    document.body.appendChild(this.overlay);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private showStep(): void {
    if (!this.overlay) return;

    const step = this.currentStep;
    const highlight = this.overlay.querySelector('#clickpathHighlight') as HTMLElement;
    const tooltip = this.overlay.querySelector('#clickpathTooltip') as HTMLElement;

    // Check step condition
    if (step.condition?.elementExists) {
      const exists = document.querySelector(step.condition.elementExists);
      if (!exists) {
        this.nextStep();
        return;
      }
    }

    // Find target element
    let targetElement: Element | null = null;
    if (step.element) {
      targetElement = document.querySelector(step.element);

      // Try fallback selectors if primary fails
      if (!targetElement && step.elementFallback) {
        for (const fallback of step.elementFallback) {
          targetElement = document.querySelector(fallback);
          if (targetElement) break;
        }
      }
    }

    // Update highlight position
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const padding = this.tour.settings.spotlightPadding ?? 8;

      highlight.style.display = 'block';
      highlight.style.top = `${rect.top + window.scrollY - padding}px`;
      highlight.style.left = `${rect.left + window.scrollX - padding}px`;
      highlight.style.width = `${rect.width + padding * 2}px`;
      highlight.style.height = `${rect.height + padding * 2}px`;

      // Scroll element into view
      if (this.tour.settings.scrollBehavior !== 'none') {
        targetElement.scrollIntoView({
          behavior: this.tour.settings.scrollBehavior ?? 'smooth',
          block: 'center'
        });
      }

      // Set click-through if enabled
      if (step.interaction?.clickThrough) {
        highlight.style.pointerEvents = 'none';
      } else {
        highlight.style.pointerEvents = 'auto';
      }
    } else {
      // No target element - center tooltip
      highlight.style.display = 'none';
    }

    // Update tooltip content
    const titleEl = tooltip.querySelector('.clickpath-title') as HTMLElement;
    const contentEl = tooltip.querySelector('.clickpath-content') as HTMLElement;
    const indicatorEl = tooltip.querySelector('.clickpath-step-indicator') as HTMLElement;

    titleEl.textContent = step.title;
    contentEl.innerHTML = step.content; // Allow basic HTML in content
    indicatorEl.textContent = `Step ${this.currentStepIndex + 1} of ${this.totalSteps}`;

    // Position tooltip
    this.positionTooltip(tooltip, targetElement, step.position);

    // Update button visibility
    const backBtn = tooltip.querySelector('.clickpath-btn-back') as HTMLElement;
    const nextBtn = tooltip.querySelector('.clickpath-btn-next') as HTMLElement;
    const skipBtn = tooltip.querySelector('.clickpath-btn-skip') as HTMLElement;

    backBtn.style.display = this.currentStepIndex > 0 ? 'block' : 'none';
    nextBtn.textContent = this.currentStepIndex === this.totalSteps - 1 ? 'Finish' : 'Next';
    skipBtn.style.display = this.tour.settings.allowSkip ? 'block' : 'none';

    // Update state
    this.state.currentStepIndex = this.currentStepIndex;
    this.state.lastActivityAt = Date.now();
  }

  private positionTooltip(
    tooltip: HTMLElement,
    target: Element | null,
    preferredPosition?: string
  ): void {
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;

    if (!target) {
      // Center in viewport
      tooltip.style.top = `${(viewportHeight - tooltipRect.height) / 2}px`;
      tooltip.style.left = `${(viewportWidth - tooltipRect.width) / 2}px`;
      return;
    }

    const targetRect = target.getBoundingClientRect();
    let position = preferredPosition || 'auto';

    // Auto-detect best position
    if (position === 'auto') {
      const spaceAbove = targetRect.top;
      const spaceBelow = viewportHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;

      if (spaceBelow >= tooltipRect.height + margin) {
        position = 'bottom';
      } else if (spaceAbove >= tooltipRect.height + margin) {
        position = 'top';
      } else if (spaceRight >= tooltipRect.width + margin) {
        position = 'right';
      } else if (spaceLeft >= tooltipRect.width + margin) {
        position = 'left';
      } else {
        position = 'bottom'; // Default fallback
      }
    }

    let top: number;
    let left: number;

    switch (position) {
      case 'top':
        top = targetRect.top + window.scrollY - tooltipRect.height - margin;
        left = targetRect.left + window.scrollX + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + window.scrollY + margin;
        left = targetRect.left + window.scrollX + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + window.scrollY + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left + window.scrollX - tooltipRect.width - margin;
        break;
      case 'right':
        top = targetRect.top + window.scrollY + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + window.scrollX + margin;
        break;
      default:
        top = targetRect.bottom + window.scrollY + margin;
        left = targetRect.left + window.scrollX;
    }

    // Keep tooltip in viewport
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipRect.width - margin));
    top = Math.max(margin, Math.min(top, viewportHeight - tooltipRect.height - margin + window.scrollY));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  private nextStep(): void {
    if (this.currentStepIndex < this.totalSteps - 1) {
      this.currentStepIndex++;
      this.showStep();
    } else {
      this.complete();
    }
  }

  private prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.showStep();
    }
  }

  private skip(): void {
    console.log(`[ClickPath] Tour skipped: ${this.tour.name}`);
    this.saveProgress('skipped');
    this.stop();
  }

  private complete(): void {
    console.log(`[ClickPath] Tour completed: ${this.tour.name}`);
    this.saveProgress('completed');
    this.stop();
  }

  private saveProgress(status: 'completed' | 'skipped'): void {
    const key = `tour_completed_${this.tour.id}`;
    chrome.storage.local.set({
      [key]: {
        status,
        completedAt: Date.now(),
        version: this.tour.version
      }
    });
  }
}
