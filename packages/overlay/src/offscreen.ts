export type OffscreenChip = {
  element: HTMLDivElement;
  point: (rect: DOMRect) => void;
  hide: () => void;
};

const EDGE_MARGIN = 18;

export function isOffscreen(rect: DOMRect): boolean {
  return (
    rect.bottom <= 0 ||
    rect.top >= window.innerHeight ||
    rect.right <= 0 ||
    rect.left >= window.innerWidth
  );
}

/**
 * Last resort when the target is still off screen after one scroll attempt - a
 * sticky container, a virtualised list, an element inside its own scroll area.
 * Saying "it is up there" beats highlighting nothing in silence.
 */
export function createOffscreenChip(): OffscreenChip {
  const element = document.createElement('div');
  element.className = 'chip hidden';

  return {
    element,
    point(rect) {
      const above = rect.bottom <= 0;
      const below = rect.top >= window.innerHeight;
      const left = rect.right <= 0;

      element.removeAttribute('style');

      if (above || below) {
        element.textContent = above ? '↑ Target is above' : '↓ Target is below';
        element.style.left = '50%';
        element.style.transform = 'translateX(-50%)';
        if (above) element.style.top = `${EDGE_MARGIN + 44}px`;
        else element.style.bottom = `${EDGE_MARGIN}px`;
      } else {
        element.textContent = left ? '← Target is left' : '→ Target is right';
        element.style.top = '50%';
        element.style.transform = 'translateY(-50%)';
        if (left) element.style.left = `${EDGE_MARGIN}px`;
        else element.style.right = `${EDGE_MARGIN}px`;
      }

      element.classList.remove('hidden');
    },
    hide() {
      element.classList.add('hidden');
      element.removeAttribute('style');
    },
  };
}
