import type { ActionRisk } from '@hintora/core/safety/actionSafety';

export type OverlayStep = {
  /** 1-based, shown as "2/4". */
  index: number;
  total: number;
  instruction: string;
  risk?: ActionRisk;
  /** Spelled out for the user when the action is not safe. */
  consequence?: string;
};

export type OverlayHandlers = {
  onSkip?: () => void;
  onStuck?: () => void;
  onCancel?: () => void;
  /** Called when the user accepts a destructive or irreversible step. */
  onConfirm?: () => void;
};

export type Overlay = {
  /** Highlights `target`. A detached target degrades to a text-only card. */
  showStep: (target: Element | null, step: OverlayStep) => void;
  /** Card with no highlight, for "not on this page" and low-confidence answers. */
  showMessage: (message: string, step?: Partial<OverlayStep>) => void;
  showBlocked: (reason: string) => void;
  hide: () => void;
  destroy: () => void;
};
