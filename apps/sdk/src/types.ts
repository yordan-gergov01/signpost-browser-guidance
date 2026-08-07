import type { TelemetryEvent } from '@hintora/client/guidanceSession';
import type { Suggestion } from '@hintora/overlay/commandBar';

/**
 * The whole public surface. Four verbs, because the host application owns its
 * own UI and we are only ever the thing behind their button.
 */
export type Hintora = {
  /** Opens the command bar. This is what a customer's Help control calls. */
  ask: () => void;
  /** Starts a session directly, skipping the question. */
  run: (intent: string) => void;
  /** Ends the current session. The guide stays loaded and silent. */
  stop: () => void;
  /** Removes the guide from the page: listeners, overlay host, everything. */
  destroy: () => void;
};

export type HintoraConfig = {
  /** Guidance service. Absolute or same-origin relative, http(s) only. */
  endpoint: string;
  /** Offered when the command bar opens, so a first use explains itself. */
  suggestions: readonly Suggestion[];
  /** Hex only, validated. Anything else falls back to the default accent. */
  accent?: string;
  hotkey: boolean;
  onTelemetry?: (event: TelemetryEvent) => void;
};

export type HintoraOptions = Partial<HintoraConfig> & {
  /** The embed script element, when the configuration rides on its attributes. */
  script?: Element | null;
};

/** A call the host made before the script finished loading. */
export type QueuedCall = readonly [method: string, ...args: readonly unknown[]];

declare global {
  interface Window {
    /** An array until boot replaces it: that is the pre-load queue. */
    hintora?: Hintora | QueuedCall[];
  }
}
