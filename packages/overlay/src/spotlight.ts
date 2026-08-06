const SVG_NS = 'http://www.w3.org/2000/svg';
const HOLE_PADDING = 4;
const HOLE_RADIUS = 6;

export type Spotlight = {
  element: SVGSVGElement;
  ring: HTMLDivElement;
  focus: (rect: DOMRect) => void;
  clear: () => void;
};

function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

/**
 * Dim plus cut-out, drawn as one SVG with a mask. The alternative - four divs
 * around the target - misbehaves on scroll and cannot round the corners, and
 * both alternatives beat the obvious approach of restyling the target itself:
 * the host page's element is never touched.
 */
export function createSpotlight(): Spotlight {
  const root = svg('svg');
  root.setAttribute('class', 'dim');

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
  shade.setAttribute('fill', 'rgba(15, 23, 42, 0.55)');
  shade.setAttribute('mask', `url(#${mask.id})`);

  root.append(defs, shade);

  const ring = document.createElement('div');
  ring.className = 'ring hidden';

  return {
    element: root,
    ring,
    focus(rect) {
      const x = rect.left - HOLE_PADDING;
      const y = rect.top - HOLE_PADDING;
      const width = rect.width + HOLE_PADDING * 2;
      const height = rect.height + HOLE_PADDING * 2;

      hole.setAttribute('x', String(x));
      hole.setAttribute('y', String(y));
      hole.setAttribute('width', String(width));
      hole.setAttribute('height', String(height));

      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ring.style.width = `${width}px`;
      ring.style.height = `${height}px`;
      ring.classList.remove('hidden');
      root.classList.remove('hidden');
    },
    clear() {
      // Both go at once. A ring left behind after the target disappears is worse
      // than no highlight at all: it points at nothing with full confidence.
      ring.classList.add('hidden');
      root.classList.add('hidden');
      hole.removeAttribute('width');
      hole.removeAttribute('height');
    },
  };
}
