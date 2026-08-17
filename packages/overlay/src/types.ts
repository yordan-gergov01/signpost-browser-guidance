import type { ActionRisk } from '@signpost/core/safety/actionSafety';
import type { GuidanceTier } from '@signpost/core/types/guidance';
import type { Suggestion } from '@signpost/overlay/commandBar';

export type OverlayStep = {
  /** 1-based. */
  index: number;
  total: number;
  instruction: string;
  tier?: GuidanceTier;
  risk?: ActionRisk;
  /** Spelled out for the user when the action is not safe. */
  consequence?: string;
};

export type OverlayHandlers = {
  /** The user submitted an intent in the command bar. */
  onIntent?: (intent: string) => void;
  /**
   * The user acted on the highlighted control. The overlay reports the fact and
   * nothing more; deciding what comes next belongs to the guidance loop.
   */
  onTargetActivated?: () => void;
  /** The user says they had already completed this step. */
  onAlreadyDone?: () => void;
  /** The user says the step does not match what they are looking at. */
  onWrongStep?: () => void;
  onCancel?: () => void;
  /** The user accepted a destructive or irreversible step. */
  onConfirm?: () => void;
};

export type OverlayOptions = {
  handlers?: OverlayHandlers;
  /** Shown when the command bar opens, so the first use explains itself. */
  suggestions?: readonly Suggestion[];
  /** Hex, validated. Anything else falls back to the default accent. */
  accent?: string;
  /**
   * Ctrl/Cmd+K. Defaults to on, but plenty of applications already own that
   * chord for their own palette, and a guest that takes it is a bug report.
   */
  hotkey?: boolean;
};

export type Overlay = {
  /** Opens the command bar. Also bound to Ctrl/Cmd+K. */
  ask: () => void;
  /** Between the question and the first step. */
  thinking: (message?: string) => void;
  showStep: (target: Element | null, step: OverlayStep) => void;
  /**
   * The step is confirmed done and earns its ghost pin. Called by the loop once
   * the page has actually moved, never by the click that asked it to.
   */
  confirmStep: () => void;
  /** No target: not on this page, or the step could not be resolved. */
  showMessage: (message: string, step?: Partial<OverlayStep>) => void;
  /**
   * Forget the route walked so far. A ghost pin is a fixed point on the screen,
   * so once the screen behind it changes it is pointing at whatever happens to
   * be there now, which is worse than showing nothing.
   */
  clearRoute: () => void;
  /** Final confirmation, then the guide takes itself off screen. */
  complete: (message: string) => void;
  showBlocked: (reason: string) => void;
  /** Back to nothing on screen. */
  hide: () => void;
  destroy: () => void;
};
