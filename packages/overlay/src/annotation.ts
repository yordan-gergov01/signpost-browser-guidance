import { TIER_LABEL, type GuidanceTier } from '@signpost/core/types/guidance';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PIN_SIZE = 26;
const PIN_OFFSET = 11;
const NOTE_WIDTH = 328;
const GAP = 26;
const MARGIN = 12;

/** Below this there is no "beside the control", so the note becomes a sheet. */
const SHEET_BELOW_PX = 640;

export type AnnotationAction = {
  label: string;
  variant?: 'danger';
  onClick: () => void;
};

export type AnnotationView = {
  index: number;
  /** Zero when unknown, which is the normal case for an unplanned loop. */
  total: number;
  instruction: string;
  tier?: GuidanceTier | undefined;
  consequence?: string | undefined;
  actions: readonly AnnotationAction[];
};

export type Annotation = {
  nodes: readonly Element[];
  /** The note itself, for the positioning library to observe. */
  noteElement: HTMLElement;
  render: (view: AnnotationView) => void;
  /** Pin on the target, text beside it, leader line between the two. */
  place: (targetRect: DOMRect) => void;
  /** No target to point at: text only, centred over the content. */
  centre: (centreX: number) => void;
  /** Leaves a ghost pin behind, so the route through the app stays visible. */
  completeCurrent: () => void;
  clearRoute: () => void;
  hide: () => void;
};

type Point = { x: number; y: number };

/**
 * The guidance surface, and deliberately not a container.
 *
 * Guidance is spatial: the job is "look here, then here". A card floating over
 * the page is the shape of a conversation, which is why every variant of it
 * reads as a chatbot no matter where it is moved. This draws on the application
 * instead - a numbered pin welded to the control, the sentence set directly on
 * the dim with a leader line back to the pin, and a faint ghost left at every
 * step already taken so the user can see the route they walked.
 *
 * Pins to the pixel are only honest because the DOM gives exact geometry. A
 * screenshot-and-guess approach cannot place them, which is why this is a
 * signature the architecture earns rather than one painted on top.
 */
export function createAnnotation(): Annotation {
  const pins = document.createElement('div');
  pins.className = 'pins';

  const currentPin = document.createElement('div');
  currentPin.className = 'pin hidden';

  const text = document.createElement('div');
  text.className = 'note hidden';
  text.setAttribute('role', 'status');
  text.setAttribute('aria-live', 'polite');

  const meta = document.createElement('div');
  meta.className = 'note__meta';

  const counter = document.createElement('span');
  counter.className = 'note__counter';

  const tier = document.createElement('span');
  tier.className = 'tier hidden';

  meta.append(counter, tier);

  const instruction = document.createElement('p');
  instruction.className = 'note__instruction';

  const consequence = document.createElement('p');
  consequence.className = 'note__consequence hidden';

  const actions = document.createElement('div');
  actions.className = 'note__actions';

  text.append(meta, instruction, consequence, actions);

  const lines = document.createElementNS(SVG_NS, 'svg');
  lines.setAttribute('class', 'leader hidden');

  const leader = document.createElementNS(SVG_NS, 'path');
  leader.setAttribute('fill', 'none');
  leader.setAttribute('stroke', 'currentColor');
  leader.setAttribute('stroke-width', '1.5');
  leader.setAttribute('stroke-dasharray', '3 4');
  lines.append(leader);

  let ghostAnchor: Point | null = null;

  function movePin(pin: HTMLElement, at: Point): void {
    pin.style.left = `${at.x - PIN_SIZE / 2}px`;
    pin.style.top = `${at.y - PIN_SIZE / 2}px`;
  }

  const clamp = (value: number, low: number, high: number): number =>
    Math.min(Math.max(value, low), high);

  /**
   * The pin sits on the corner of the target nearest the note, never on the far
   * one. Anchoring it opposite the note is what made the leader line cut across
   * the control it was pointing at.
   *
   * It is then clamped into the viewport, because a target hard against the top
   * or left edge would otherwise put its own pin off screen, where a step number
   * helps nobody.
   */
  function pinAnchor(rect: DOMRect, side: 'left' | 'right' | 'below'): Point {
    const half = PIN_SIZE / 2;
    const raw: Point =
      side === 'right'
        ? { x: rect.right + PIN_OFFSET, y: rect.top - PIN_OFFSET }
        : side === 'left'
          ? { x: rect.left - PIN_OFFSET, y: rect.top - PIN_OFFSET }
          : { x: rect.left - PIN_OFFSET, y: rect.bottom + PIN_OFFSET };

    return {
      x: clamp(raw.x, half + MARGIN, window.innerWidth - half - MARGIN),
      y: clamp(raw.y, half + MARGIN, window.innerHeight - half - MARGIN),
    };
  }

  function drawLeader(from: Point, to: Point, avoid: DOMRect): void {
    // A shallow curve rather than a straight line: it reads as a pointer drawn
    // by hand instead of a connector in a diagram. The control point is pushed
    // clear of the target so the curve arcs around the control rather than over
    // the label the user is being asked to read.
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const clearsAbove = Math.min(from.y, to.y) < avoid.top;

    const control: Point = clearsAbove
      ? { x: midX, y: Math.min(from.y, to.y) - 8 }
      : { x: midX, y: midY };

    leader.setAttribute(
      'd',
      `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,
    );
    lines.classList.remove('hidden');
  }

  return {
    nodes: [lines, pins, currentPin, text],
    noteElement: text,

    render(view) {
      counter.classList.toggle('hidden', view.index < 1);
      if (view.index >= 1) {
        // No total when we do not have one. The loop asks for a single step at a
        // time, so claiming "of 4" would be an invention.
        counter.textContent =
          view.total > 0 ? `Step ${view.index} of ${view.total}` : `Step ${view.index}`;
        currentPin.textContent = String(view.index);
      }

      tier.classList.toggle('hidden', view.tier === undefined);
      if (view.tier) {
        tier.className = `tier tier--${view.tier}`;
        tier.textContent = TIER_LABEL[view.tier];
      }

      // textContent throughout, never innerHTML. The instruction was written by
      // a model that read attacker-controllable page text, so it stays untrusted
      // data all the way to the screen.
      instruction.textContent = view.instruction;

      consequence.textContent = view.consequence ?? '';
      consequence.classList.toggle('hidden', !view.consequence);

      actions.replaceChildren();
      for (const action of view.actions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = action.variant ? `link ${action.variant}` : 'link';
        button.textContent = action.label;
        button.addEventListener('click', action.onClick);
        actions.append(button);
      }

      text.classList.remove('hidden');
      text.style.animation = 'none';
      void text.offsetWidth;
      text.style.animation = '';
    },

    place(targetRect) {
      text.classList.remove('note--centred');
      text.classList.remove('note--sheet');
      text.style.removeProperty('left');
      text.style.removeProperty('top');

      const roomRight = window.innerWidth - targetRect.right - GAP - MARGIN;
      const roomLeft = targetRect.left - GAP - MARGIN;

      // Narrow viewport, or neither flank wide enough to hold the sentence: the
      // note goes to the bottom of the screen instead of overlapping the control.
      const side: 'left' | 'right' | 'below' =
        window.innerWidth < SHEET_BELOW_PX ||
        (roomRight < NOTE_WIDTH && roomLeft < NOTE_WIDTH)
          ? 'below'
          : roomRight >= NOTE_WIDTH
            ? 'right'
            : 'left';

      const anchor = pinAnchor(targetRect, side);
      ghostAnchor = anchor;
      movePin(currentPin, anchor);
      currentPin.classList.remove('hidden');

      if (side === 'below') {
        text.classList.add('note--sheet');
        const noteRect = text.getBoundingClientRect();
        drawLeader({ x: anchor.x, y: noteRect.top - 2 }, anchor, targetRect);
        return;
      }

      const left =
        side === 'right' ? targetRect.right + GAP : targetRect.left - NOTE_WIDTH - GAP;

      text.style.left = `${left}px`;
      // Measured, then clamped: a target near the bottom of a short window would
      // otherwise push its own instruction below the fold.
      text.style.top = `${Math.max(MARGIN, targetRect.top - 6)}px`;

      const height = text.getBoundingClientRect().height;
      const top = clamp(targetRect.top - 6, MARGIN, window.innerHeight - height - MARGIN);
      text.style.top = `${top}px`;

      const noteRect = text.getBoundingClientRect();
      drawLeader(
        {
          x: side === 'right' ? noteRect.left - 2 : noteRect.right + 2,
          y: clamp(anchor.y, noteRect.top + 14, noteRect.bottom - 14),
        },
        anchor,
        targetRect,
      );
    },

    centre(centreX) {
      currentPin.classList.add('hidden');
      lines.classList.add('hidden');
      ghostAnchor = null;
      text.classList.remove('note--sheet');
      text.classList.add('note--centred');
      text.style.left = `${centreX}px`;
      text.style.removeProperty('top');
    },

    completeCurrent() {
      if (!ghostAnchor) return;
      const ghost = document.createElement('div');
      ghost.className = 'pin pin--ghost';
      ghost.textContent = currentPin.textContent;
      movePin(ghost, ghostAnchor);
      pins.append(ghost);
    },

    clearRoute() {
      pins.replaceChildren();
      ghostAnchor = null;
    },

    hide() {
      text.classList.add('hidden');
      currentPin.classList.add('hidden');
      lines.classList.add('hidden');
    },
  };
}
