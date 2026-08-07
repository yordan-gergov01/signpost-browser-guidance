const SVG_NS = 'http://www.w3.org/2000/svg';
const HOLE_PADDING = 5;
const HOLE_RADIUS = 8;
const TRAVEL_MS = 380;

type Frame = { x: number; y: number; width: number; height: number };

export type Spotlight = {
  nodes: readonly Element[];
  /** Animates from wherever the beam currently is. */
  moveTo: (rect: DOMRect) => void;
  /** Repositions with no animation, for scroll and resize. */
  snapTo: (rect: DOMRect) => void;
  clear: () => void;
};

function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function frameOf(rect: DOMRect): Frame {
  return {
    x: rect.left - HOLE_PADDING,
    y: rect.top - HOLE_PADDING,
    width: rect.width + HOLE_PADDING * 2,
    height: rect.height + HOLE_PADDING * 2,
  };
}

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/**
 * Dim, cut-out and travel.
 *
 * The travel is the part worth arguing for. Moving the beam between targets is
 * only honest because the DOM tells us exactly where both of them are - a
 * screenshot-and-guess approach cannot land on a control to the pixel, so it
 * cannot do this without looking wrong. The signature comes out of the
 * architecture rather than being painted on top of it.
 */
export function createSpotlight(): Spotlight {
  const root = svg('svg');
  root.setAttribute('class', 'dim hidden');

  const mask = svg('mask');
  mask.id = 'hintora-cutout';

  const sheet = svg('rect');
  sheet.setAttribute('width', '100%');
  sheet.setAttribute('height', '100%');
  sheet.setAttribute('fill', 'white');

  const hole = svg('rect');
  hole.setAttribute('rx', String(HOLE_RADIUS));
  hole.setAttribute('fill', 'black');
  mask.append(sheet, hole);

  const defs = svg('defs');
  defs.append(mask);

  const shade = svg('rect');
  shade.setAttribute('width', '100%');
  shade.setAttribute('height', '100%');
  // Light enough to read and work through. The beam is pointing at a control,
  // not taking the screen hostage.
  shade.setAttribute('fill', 'rgba(17, 24, 39, 0.2)');
  shade.setAttribute('mask', `url(#${mask.id})`);

  const trail = svg('line');
  trail.setAttribute('stroke', 'currentColor');
  trail.setAttribute('stroke-width', '2');
  trail.setAttribute('stroke-linecap', 'round');
  trail.setAttribute('stroke-dasharray', '2 6');
  trail.setAttribute('opacity', '0');

  root.append(defs, shade, trail);

  const ring = document.createElement('div');
  ring.className = 'ring hidden';

  let current: Frame | null = null;
  let animation = 0;

  function paint(frame: Frame): void {
    hole.setAttribute('x', String(frame.x));
    hole.setAttribute('y', String(frame.y));
    hole.setAttribute('width', String(frame.width));
    hole.setAttribute('height', String(frame.height));

    ring.style.left = `${frame.x}px`;
    ring.style.top = `${frame.y}px`;
    ring.style.width = `${frame.width}px`;
    ring.style.height = `${frame.height}px`;

    current = frame;
  }

  function reveal(): void {
    root.classList.remove('hidden');
    ring.classList.remove('hidden');
  }

  function arrived(): void {
    ring.classList.remove('ring--arrived');
    // Reading offsetWidth restarts the animation; without it a second arrival at
    // the same class is a no-op.
    void ring.offsetWidth;
    ring.classList.add('ring--arrived');
  }

  function drawTrail(from: Frame, to: Frame): void {
    trail.setAttribute('x1', String(from.x + from.width / 2));
    trail.setAttribute('y1', String(from.y + from.height / 2));
    trail.setAttribute('x2', String(to.x + to.width / 2));
    trail.setAttribute('y2', String(to.y + to.height / 2));
  }

  return {
    nodes: [root, ring],

    moveTo(rect) {
      const to = frameOf(rect);
      const from = current;
      cancelAnimationFrame(animation);
      reveal();

      if (!from) {
        paint(to);
        arrived();
        return;
      }

      drawTrail(from, to);
      const started = performance.now();

      const tick = (now: number): void => {
        const t = Math.min(1, (now - started) / TRAVEL_MS);
        const eased = easeOutCubic(t);

        paint({
          x: lerp(from.x, to.x, eased),
          y: lerp(from.y, to.y, eased),
          width: lerp(from.width, to.width, eased),
          height: lerp(from.height, to.height, eased),
        });
        trail.setAttribute('opacity', String((1 - t) * 0.7));

        if (t < 1) {
          animation = requestAnimationFrame(tick);
          return;
        }
        trail.setAttribute('opacity', '0');
        arrived();
      };

      animation = requestAnimationFrame(tick);
    },

    snapTo(rect) {
      cancelAnimationFrame(animation);
      reveal();
      paint(frameOf(rect));
    },

    clear() {
      cancelAnimationFrame(animation);
      // Ring and dim go together. A ring left behind after its target is gone
      // points at nothing with full confidence.
      ring.classList.add('hidden');
      ring.classList.remove('ring--arrived');
      root.classList.add('hidden');
      trail.setAttribute('opacity', '0');
      current = null;
    },
  };
}
