import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { OVERLAY_HOST_ATTRIBUTE } from '@hintora/core/distiller/selectors';
import { createCard } from '@hintora/overlay/card';
import type { CardButton } from '@hintora/overlay/card';
import { createOffscreenChip, isOffscreen } from '@hintora/overlay/offscreen';
import { createSpotlight } from '@hintora/overlay/spotlight';
import { OVERLAY_CSS } from '@hintora/overlay/styles';
import type { Overlay, OverlayHandlers, OverlayStep } from '@hintora/overlay/types';

const TOOLTIP_GAP = 12;
const VIEWPORT_PADDING = 8;

// The host sits above everything, but lets clicks through. We guide; the user
// clicks the real button underneath. Only the card opts back into pointer events.
const HOST_STYLE =
  'all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;';

function hasArea(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

export function createOverlay(handlers: OverlayHandlers = {}): Overlay {
  const host = document.createElement('div');
  host.setAttribute(OVERLAY_HOST_ATTRIBUTE, '');
  host.style.cssText = HOST_STYLE;

  // Closed: the host page cannot reach in and restyle or read our UI.
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = OVERLAY_CSS;

  const spotlight = createSpotlight();
  const card = createCard();
  const chip = createOffscreenChip();

  shadow.append(style, spotlight.element, spotlight.ring, chip.element, card.element);
  document.documentElement.append(host);

  let stopTracking: (() => void) | null = null;
  let scrollAttempted = false;

  function centreCard(): void {
    card.element.classList.add('card--centered');
    card.element.style.left = '';
    card.element.style.top = '';
  }

  function anchorCard(target: Element): void {
    card.element.classList.remove('card--centered');
    void computePosition(target, card.element, {
      placement: 'bottom',
      middleware: [offset(TOOLTIP_GAP), flip(), shift({ padding: VIEWPORT_PADDING })],
    }).then(({ x, y }) => {
      card.element.style.left = `${x}px`;
      card.element.style.top = `${y}px`;
    });
  }

  function stop(): void {
    stopTracking?.();
    stopTracking = null;
  }

  function hide(): void {
    stop();
    spotlight.clear();
    chip.hide();
    card.element.classList.add('hidden');
  }

  function stepButtons(): CardButton[] {
    return [
      { label: 'Skip step', onClick: () => handlers.onSkip?.() },
      { label: "I'm stuck", onClick: () => handlers.onStuck?.() },
      {
        label: 'Cancel',
        onClick: () => {
          handlers.onCancel?.();
          hide();
        },
      },
    ];
  }

  /**
   * The target vanished mid-step - the app re-rendered, the row was filtered
   * away, a dialog closed. Drop the highlight and keep the words.
   */
  function degrade(step: OverlayStep): void {
    stop();
    spotlight.clear();
    chip.hide();
    centreCard();
    card.render({
      counter: `${step.index}/${step.total}`,
      instruction: `${step.instruction} (that control is no longer on the page)`,
      buttons: stepButtons(),
    });
  }

  function track(target: Element, step: OverlayStep): void {
    stop();
    scrollAttempted = false;

    card.element.classList.remove('hidden');
    card.render({
      counter: `${step.index}/${step.total}`,
      instruction: step.instruction,
      buttons: stepButtons(),
    });

    const reposition = (): void => {
      const rect = target.getBoundingClientRect();
      if (!target.isConnected || !hasArea(rect)) {
        degrade(step);
        return;
      }

      if (isOffscreen(rect)) {
        spotlight.clear();
        if (!scrollAttempted) {
          scrollAttempted = true;
          // Instant, not smooth. The scroll completes inside this call, so the
          // next frame sees the settled rect and the off-screen chip never
          // flashes mid-animation. It also ignores a host page that set
          // `scroll-behavior: smooth` on the document.
          target.scrollIntoView({ block: 'center', behavior: 'instant' });
          reposition();
          return;
        }
        chip.point(rect);
        centreCard();
        return;
      }

      chip.hide();
      spotlight.focus(rect);
      anchorCard(target);
    };

    const stopPositioning = autoUpdate(target, card.element, reposition);

    // Removal is not a positioning event, so it is not the positioning library's
    // job to notice it. A stale ring pointing at a control that no longer exists
    // is the failure mode worth spending an observer on.
    const observer = new MutationObserver(() => {
      if (!target.isConnected) degrade(step);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    stopTracking = () => {
      stopPositioning();
      observer.disconnect();
    };

    reposition();
  }

  function confirmFirst(target: Element, step: OverlayStep): void {
    stop();
    spotlight.clear();
    chip.hide();
    centreCard();
    card.element.classList.remove('hidden');
    card.render({
      counter: `${step.index}/${step.total}`,
      instruction: step.instruction,
      consequence: step.consequence ?? 'This action cannot be undone.',
      buttons: [
        {
          label: 'Show me the control',
          variant: 'danger',
          onClick: () => {
            handlers.onConfirm?.();
            track(target, step);
          },
        },
        {
          label: 'Cancel',
          onClick: () => {
            handlers.onCancel?.();
            hide();
          },
        },
      ],
    });
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    handlers.onCancel?.();
    hide();
  }

  document.addEventListener('keydown', onKeyDown, true);

  return {
    showStep(target, step) {
      if (!target || !target.isConnected) {
        this.showMessage(step.instruction, step);
        return;
      }

      // Anything not classified safe gets a confirmation before we so much as
      // point at it. Highlighting is itself a nudge.
      if (step.risk && step.risk !== 'safe') {
        confirmFirst(target, step);
        return;
      }

      track(target, step);
    },

    showMessage(message, step) {
      stop();
      spotlight.clear();
      chip.hide();
      centreCard();
      card.element.classList.remove('hidden');
      const counter =
        step?.index !== undefined && step.total !== undefined
          ? `${step.index}/${step.total}`
          : undefined;

      card.render({ counter, instruction: message, buttons: stepButtons() });
    },

    showBlocked(reason) {
      stop();
      spotlight.clear();
      chip.hide();
      centreCard();
      card.element.classList.remove('hidden');
      card.render({
        instruction: `Hintora is off on this page. ${reason}`,
        buttons: [{ label: 'Dismiss', onClick: hide }],
      });
    },

    hide,

    destroy() {
      hide();
      document.removeEventListener('keydown', onKeyDown, true);
      host.remove();
    },
  };
}
