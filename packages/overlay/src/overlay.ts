import { autoUpdate } from '@floating-ui/dom';
import { OVERLAY_HOST_ATTRIBUTE } from '@signpost/core/distiller/selectors';
import { createAnnotation } from '@signpost/overlay/annotation';
import type { AnnotationAction } from '@signpost/overlay/annotation';
import { createCommandBar } from '@signpost/overlay/commandBar';
import { contentCentreX } from '@signpost/overlay/contentArea';
import { createOffscreenChip, isOffscreen } from '@signpost/overlay/offscreen';
import { createSpotlight } from '@signpost/overlay/spotlight';
import { overlayCss } from '@signpost/overlay/styles';
import { resolveAccent } from '@signpost/overlay/theme';
import type { Overlay, OverlayOptions, OverlayStep } from '@signpost/overlay/types';

const COMPLETE_LINGER_MS = 2600;

// Above everything, but transparent to clicks. We guide; the user clicks the
// real control underneath. Only our own surfaces opt back in.
const HOST_STYLE =
  'all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;';

/**
 * Matched on the physical key rather than the character it produces.
 *
 * `key` reports what the active layout types, so on a non-Latin layout Ctrl+K
 * arrives as a letter we do not recognise. The handler then never fires, never
 * calls preventDefault, and the browser's own Ctrl+K is the only thing that
 * happens. `code` is the same value on every layout.
 *
 * Slash is offered alongside it because some browsers and some host
 * applications have already claimed Ctrl+K for themselves.
 */
const HOTKEY_CODES = new Set(['KeyK', 'Slash']);

function hasArea(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

export function createOverlay(options: OverlayOptions = {}): Overlay {
  const handlers = options.handlers ?? {};
  const suggestions = options.suggestions ?? [];
  const hotkey = options.hotkey ?? true;

  const host = document.createElement('div');
  host.setAttribute(OVERLAY_HOST_ATTRIBUTE, '');
  host.style.cssText = HOST_STYLE;

  // Closed: the host page cannot reach in to restyle or read the guide.
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = overlayCss(resolveAccent(document, options.accent));

  const layer = document.createElement('div');
  layer.className = 'layer';

  const spotlight = createSpotlight();
  const chip = createOffscreenChip();
  const note = createAnnotation();
  const bar = createCommandBar({
    onSubmit: (intent) => {
      bar.close();
      handlers.onIntent?.(intent);
    },
    // The same exit as the Escape key, not just hiding the bar. Closing the bar
    // on its own would leave the page dimmed with nothing on it to explain why.
    onDismiss: () => endSession(),
  });

  layer.append(...spotlight.nodes, chip.element, ...note.nodes, bar.element);
  shadow.append(style, layer);
  document.documentElement.append(host);

  let stopTracking: (() => void) | null = null;
  let scrollAttempted = false;
  let sessionActive = false;
  let lingerTimer = 0;

  function detach(): void {
    stopTracking?.();
    stopTracking = null;
  }

  function clearStage(): void {
    window.clearTimeout(lingerTimer);
    detach();
    spotlight.clear();
    chip.hide();
  }

  function endSession(): void {
    handlers.onCancel?.();
    api.hide();
  }

  function stepActions(): AnnotationAction[] {
    return [
      { label: "I've done this", onClick: () => handlers.onAlreadyDone?.() },
      { label: 'This is not it', onClick: () => handlers.onWrongStep?.() },
      { label: 'Stop', onClick: endSession },
    ];
  }

  function viewOf(step: OverlayStep, instruction = step.instruction) {
    return {
      index: step.index,
      total: step.total,
      instruction,
      tier: step.tier,
      actions: stepActions(),
    };
  }

  /**
   * The target vanished mid-step: the app re-rendered, the row was filtered out,
   * a dialog closed. Drop the beam, keep the words.
   */
  function degrade(step: OverlayStep): void {
    clearStage();
    note.render(viewOf(step, `${step.instruction} That control just left the page.`));
    note.centre(contentCentreX(document));
  }

  function track(target: Element, step: OverlayStep): void {
    clearStage();
    scrollAttempted = false;
    sessionActive = true;
    note.render(viewOf(step));

    let landed = false;

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
          // Instant, not smooth: the scroll finishes inside this call, so the
          // next frame sees a settled rect and the off-screen chip never flashes
          // mid-animation. It also ignores a host that set `scroll-behavior`.
          target.scrollIntoView({ block: 'center', behavior: 'instant' });
          reposition();
          return;
        }
        chip.point(rect);
        note.centre(contentCentreX(document));
        return;
      }

      chip.hide();
      // Travel once, on arrival. Everything after is scroll and resize, where the
      // beam has to stay welded rather than chase.
      if (landed) spotlight.snapTo(rect);
      else {
        spotlight.moveTo(rect);
        landed = true;
      }
      note.place(rect);
    };

    const stopPositioning = autoUpdate(target, note.noteElement, reposition);

    // Removal is not a positioning event, so it is not the positioning library's
    // job to notice it. A stale beam on a control that no longer exists is the
    // failure worth spending an observer on.
    const observer = new MutationObserver(() => {
      if (!target.isConnected) degrade(step);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Capture phase, because the application re-renders on its own click handler
    // and the element may be gone by the time bubbling reaches us.
    const onActivated = (event: Event): void => {
      const node = event.target;
      if (!(node instanceof Node) || !target.contains(node)) return;
      // No ghost pin yet. The route is a record of what the user achieved, and a
      // click on a control that does nothing has achieved nothing.
      handlers.onTargetActivated?.();
    };
    document.addEventListener('click', onActivated, true);

    stopTracking = () => {
      stopPositioning();
      observer.disconnect();
      document.removeEventListener('click', onActivated, true);
    };

    reposition();
  }

  function confirmFirst(target: Element, step: OverlayStep): void {
    clearStage();
    sessionActive = true;
    note.render({
      index: step.index,
      total: step.total,
      instruction: step.instruction,
      tier: step.tier,
      consequence: step.consequence ?? 'This cannot be undone.',
      actions: [
        {
          label: 'Show me where',
          variant: 'danger',
          onClick: () => {
            handlers.onConfirm?.();
            track(target, step);
          },
        },
        { label: 'Not now', onClick: endSession },
      ],
    });
    note.centre(contentCentreX(document));
    spotlight.dimOnly();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (hotkey && (event.ctrlKey || event.metaKey) && HOTKEY_CODES.has(event.code)) {
      event.preventDefault();
      api.ask();
      return;
    }
    if (event.key === 'Escape' && (bar.isOpen() || sessionActive)) endSession();
  }

  document.addEventListener('keydown', onKeyDown, true);

  const api: Overlay = {
    ask() {
      clearStage();
      note.hide();
      note.clearRoute();
      // The page recedes the moment the guide is in use, question included. The
      // layer either has the screen or it does not; half of it is neither.
      spotlight.dimOnly();
      bar.open(suggestions, contentCentreX(document));
    },

    thinking(message) {
      sessionActive = true;
      clearStage();
      bar.close();
      note.render({
        index: 0,
        total: 0,
        instruction: message ?? 'Reading the page…',
        actions: [{ label: 'Stop', onClick: endSession }],
      });
      note.centre(contentCentreX(document));
      // The page recedes for a message too. Without it the note reads as a stray
      // card the application grew rather than as the guide speaking.
      spotlight.dimOnly();
    },

    clearRoute() {
      note.clearRoute();
    },

    confirmStep() {
      note.completeCurrent();
    },

    showStep(target, step) {
      if (!target || !target.isConnected) {
        api.showMessage(step.instruction, step);
        return;
      }

      // Anything not classified safe is confirmed before we so much as point at
      // it. Highlighting is itself a nudge towards pressing the thing.
      if (step.risk && step.risk !== 'safe') {
        confirmFirst(target, step);
        return;
      }

      track(target, step);
    },

    showMessage(message, step) {
      clearStage();
      sessionActive = true;
      note.render({
        index: step?.index ?? 0,
        total: step?.total ?? 0,
        instruction: message,
        tier: step?.tier,
        actions: [{ label: 'Close', onClick: endSession }],
      });
      note.centre(contentCentreX(document));
      // The page recedes for a message too. Without it the note reads as a stray
      // card the application grew rather than as the guide speaking.
      spotlight.dimOnly();
    },

    complete(message) {
      clearStage();
      note.render({
        index: 0,
        total: 0,
        instruction: message,
        actions: [],
      });
      note.centre(contentCentreX(document));
      spotlight.dimOnly();
      // Say it, then get off the screen. A guide that stays open after the job
      // is done has turned back into a widget.
      lingerTimer = window.setTimeout(() => api.hide(), COMPLETE_LINGER_MS);
    },

    showBlocked(reason) {
      clearStage();
      note.render({
        index: 0,
        total: 0,
        instruction: `Signpost stays off here. ${reason}`,
        actions: [{ label: 'Close', onClick: endSession }],
      });
      note.centre(contentCentreX(document));
      // The page recedes for a message too. Without it the note reads as a stray
      // card the application grew rather than as the guide speaking.
      spotlight.dimOnly();
    },

    hide() {
      clearStage();
      bar.close();
      note.hide();
      note.clearRoute();
      sessionActive = false;
    },

    destroy() {
      api.hide();
      document.removeEventListener('keydown', onKeyDown, true);
      host.remove();
    },
  };

  return api;
}
