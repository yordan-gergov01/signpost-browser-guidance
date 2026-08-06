export type OffscreenChip = {
  element: HTMLDivElement;
  point: (rect: DOMRect) => void;
  hide: () => void;
};

const EDGE_MARGIN = 16;

export function isOffscreen(rect: DOMRect): boolean {
  return (
    rect.bottom <= 0 ||
    rect.top >= window.innerHeight ||
    rect.right <= 0 ||
    rect.left >= window.innerWidth
  );
}

/**
 * Last resort when the target still is not on screen after one scroll attempt -
 * a sticky container, a virtualised list, an element inside its own scroll area.
 * Saying "it is up there" beats silently highlighting nothing.
 */
export function createOffscreenChip(): OffscreenChip {
  const element = document.createElement('div');
  element.className = 'arrow hidden';

  return {
    element,
    point(rect) {
      const above = rect.bottom <= 0;
      const below = rect.top >= window.innerHeight;
      const left = rect.right <= 0;

      if (above || below) {
        element.textContent = above ? '↑ Target is above' : '↓ Target is below';
        element.style.left = '50%';
        element.style.transform = 'translateX(-50%)';
        element.style.top = above ? `${EDGE_MARGIN}px` : '';
        element.style.bottom = below ? `${EDGE_MARGIN}px` : '';
      } else {
        element.textContent = left ? '← Target is left' : '→ Target is right';
        element.style.top = '50%';
        element.style.transform = 'translateY(-50%)';
        element.style.left = left ? `${EDGE_MARGIN}px` : '';
        element.style.right = left ? '' : `${EDGE_MARGIN}px`;
      }

      element.classList.remove('hidden');
    },
    hide() {
      element.classList.add('hidden');
      element.removeAttribute('style');
    },
  };
}
