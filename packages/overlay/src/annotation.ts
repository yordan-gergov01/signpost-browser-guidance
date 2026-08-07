import { TIER_LABEL, type GuidanceTier } from '@hintora/core/types/guidance';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PIN_SIZE = 24;
const PIN_OFFSET = 10;

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

  function pinAnchor(rect: DOMRect): Point {
    return { x: rect.left - PIN_OFFSET, y: rect.top - PIN_OFFSET };
  }

  function drawLeader(from: Point, to: Point): void {
    // A shallow curve rather than a straight line: it reads as a pointer drawn
    // by hand instead of a connector in a diagram.
    const midX = (from.x + to.x) / 2;
    leader.setAttribute('d', `M ${from.x} ${from.y} Q ${midX} ${from.y} ${to.x} ${to.y}`);
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
      const anchor = pinAnchor(targetRect);
      ghostAnchor = anchor;

      movePin(currentPin, anchor);
      currentPin.classList.remove('hidden');

      text.classList.remove('note--centred');

      // Placed on whichever side of the target has more room, so the note never
      // covers the control it is describing.
      const spaceRight = window.innerWidth - targetRect.right;
      const left =
        spaceRight > 340
          ? targetRect.right + 28
          : Math.max(16, targetRect.left - 316 - 28);
      const top = Math.max(16, targetRect.top - 4);

      text.style.left = `${left}px`;
      text.style.top = `${top}px`;

      const noteRect = text.getBoundingClientRect();
      const noteEdge: Point = {
        x: left > targetRect.right ? noteRect.left : noteRect.right,
        y: noteRect.top + 18,
      };
      drawLeader(noteEdge, anchor);
    },

    centre(centreX) {
      currentPin.classList.add('hidden');
      lines.classList.add('hidden');
      ghostAnchor = null;
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
