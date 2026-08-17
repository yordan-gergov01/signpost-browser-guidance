import { beforeEach, describe as suite, expect, test } from 'vitest';
import { createAnnotation, type Annotation } from '@signpost/overlay/annotation';

const NOTE_HEIGHT = 120;
const NOTE_WIDTH = 328;

function rect(x: number, y: number, width = 90, height = 32): DOMRect {
  return {
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
  } as DOMRect;
}

let note: Annotation;

/**
 * happy-dom has no layout engine, so the note reports the box its own inline
 * styles ask for. That is enough: `place` is arithmetic over the target rect,
 * the note's size and the viewport, and it is the arithmetic that was wrong.
 */
function measuredNote(element: HTMLElement): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => {
      const left = parseFloat(element.style.left || '0');
      const top = parseFloat(element.style.top || '0');
      return rect(left, top, NOTE_WIDTH, NOTE_HEIGHT);
    },
  });
}

function pinBox(): { left: number; top: number } {
  const pin = document.querySelector('.pin:not(.pin--ghost)') as HTMLElement;
  return { left: parseFloat(pin.style.left), top: parseFloat(pin.style.top) };
}

function leaderPath(): string {
  return document.querySelector('.leader path')?.getAttribute('d') ?? '';
}

function noteBox(): { left: number; top: number } {
  const element = document.querySelector('.note') as HTMLElement;
  return { left: parseFloat(element.style.left), top: parseFloat(element.style.top) };
}

beforeEach(() => {
  document.body.innerHTML = '';
  window.innerWidth = 1280;
  window.innerHeight = 720;

  note = createAnnotation();
  document.body.append(...note.nodes);
  measuredNote(note.noteElement);

  note.render({ index: 1, total: 0, instruction: 'Click Export', actions: [] });
});

suite('placing the note beside a control', () => {
  test('puts the note on the side with room for it', () => {
    note.place(rect(200, 300));
    expect(noteBox().left).toBeGreaterThan(200);
  });

  test('flips to the left when the right edge is out of room', () => {
    note.place(rect(1150, 300));
    expect(noteBox().left).toBeLessThan(1150);
  });
});

suite('a control against the edge of the screen', () => {
  // The reported bug: a target in the top left corner put its own step number
  // off screen, where a step number helps nobody.
  test('keeps the step number on screen at the top left corner', () => {
    note.place(rect(0, 0));
    const pin = pinBox();
    expect(pin.left).toBeGreaterThanOrEqual(0);
    expect(pin.top).toBeGreaterThanOrEqual(0);
  });

  test('keeps the step number on screen at the bottom right corner', () => {
    note.place(rect(1240, 700));
    const pin = pinBox();
    expect(pin.left).toBeLessThanOrEqual(window.innerWidth - 26);
    expect(pin.top).toBeLessThanOrEqual(window.innerHeight - 26);
  });

  test('keeps the whole note on screen for a control near the bottom', () => {
    note.place(rect(400, 700));
    const box = noteBox();
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.top + NOTE_HEIGHT).toBeLessThanOrEqual(window.innerHeight);
  });
});

suite('the leader line', () => {
  // The other half of the bug: the pin was anchored to the target's left corner
  // whichever side the note landed on, so a note on the right had to draw its
  // line straight across the control it was pointing at.
  test('anchors the pin on the same side as the note', () => {
    note.place(rect(200, 300));
    expect(pinBox().left).toBeGreaterThan(200);

    note.place(rect(1150, 300));
    expect(pinBox().left).toBeLessThan(1150);
  });

  test('never crosses the control it points at', () => {
    const target = rect(200, 300);
    note.place(target);

    const points =
      leaderPath()
        .match(/-?\d+(\.\d+)?/g)
        ?.map(Number) ?? [];
    const xs = points.filter((_, index) => index % 2 === 0);

    // Both ends and the control point sit clear of the target's right edge, so
    // no part of the curve can pass over the control.
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(target.right);
  });
});

suite('a viewport too narrow to have a beside', () => {
  test('drops the note to a sheet rather than covering the control', () => {
    window.innerWidth = 390;
    note.place(rect(40, 300));

    expect(note.noteElement.classList.contains('note--sheet')).toBe(true);
  });

  test('goes back to a side placement on a wide window', () => {
    window.innerWidth = 390;
    note.place(rect(40, 300));

    window.innerWidth = 1280;
    note.place(rect(200, 300));

    expect(note.noteElement.classList.contains('note--sheet')).toBe(false);
  });
});
