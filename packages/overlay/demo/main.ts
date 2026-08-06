import { createOverlay } from '@hintora/overlay/overlay';
import type { OverlayStep } from '@hintora/overlay/types';

// Manual harness: no model, no guidance loop. The point is to prove the overlay
// survives a host page it does not control before anything else depends on it.

const overlay = createOverlay({
  onSkip: () => overlay.showMessage('Skipped. The loop would ask for the next step.'),
  onStuck: () => overlay.showMessage('The loop would re-observe and try another route.'),
  onCancel: () => console.info('session cancelled'),
  onConfirm: () => console.info('destructive step confirmed by the user'),
});

function step(index: number, instruction: string, extra: Partial<OverlayStep> = {}) {
  return { index, total: 4, instruction, ...extra } satisfies OverlayStep;
}

function target(id: string): Element | null {
  return document.getElementById(id);
}

const drivers: Record<string, () => void> = {
  near() {
    overlay.showStep(
      target('near'),
      step(1, 'Click Save changes to store your profile.'),
    );
  },

  far() {
    overlay.showStep(
      target('far'),
      step(2, 'Click Export report at the bottom of the page.'),
    );
  },

  risky() {
    overlay.showStep(
      target('risky'),
      step(3, 'Click Delete account.', {
        risk: 'irreversible',
        consequence: 'This permanently deletes the workspace and all of its data.',
      }),
    );
  },

  vanish() {
    const button = target('vanish');
    overlay.showStep(button, step(4, 'Click Temporary control.'));
    window.setTimeout(() => button?.remove(), 2000);
  },

  message() {
    overlay.showMessage('That setting is not on this page. Open Settings first.');
  },

  blocked() {
    overlay.showBlocked('This page contains a password field.');
  },

  hide() {
    overlay.hide();
  },
};

for (const button of document.querySelectorAll<HTMLElement>('[data-drive]')) {
  const name = button.dataset.drive;
  const driver = name ? drivers[name] : undefined;
  if (driver) button.addEventListener('click', driver);
}
