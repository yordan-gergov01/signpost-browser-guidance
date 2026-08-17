import { MIN_CONFIDENCE, SESSION_BUDGET } from '@signpost/core/config/budgets';
import { distillWithElements } from '@signpost/core/distiller/distill';
import { toPromptPageMap } from '@signpost/core/distiller/prompt';
import { elementKey, elementState } from '@signpost/core/distiller/signature';
import { classifyAction } from '@signpost/core/safety/actionSafety';
import { assessPage } from '@signpost/core/safety/sensitivePage';
import { sanitizePageMap, type SafetyReport } from '@signpost/core/safety/sanitize';
import type { GuideResponse } from '@signpost/core/types/guide';
import type { PageElement, PageMap } from '@signpost/core/types/pageMap';
import { watchOutcome } from '@signpost/client/actionOutcome';
import { watchForChange } from '@signpost/client/changeDetection';
import { createCostReport, type CostReport } from '@signpost/client/costReport';
import { trackActivity, type PageActivity } from '@signpost/client/pageActivity';
import { requestStep } from '@signpost/client/transport';

/**
 * idle -> observing -> thinking -> guiding -> verifying -> guiding
 *                                         -> waiting -> observing
 *                                         -> done | stuck
 *
 * waiting is the state that keeps a session alive across a page it cannot help
 * on. Most requests worth guiding span more than one screen.
 */
export type GuidanceState =
  | 'idle'
  | 'observing'
  | 'thinking'
  | 'guiding'
  | 'verifying'
  | 'waiting'
  | 'done'
  | 'stuck';

export type GuidanceStep = {
  index: number;
  /** Zero means unknown, which is the honest answer when nothing is planned. */
  total: number;
  instruction: string;
  tier: 'inferred';
  risk?: 'safe' | 'destructive' | 'irreversible';
  consequence?: string;
};

export type GuidanceSurface = {
  thinking: (message?: string) => void;
  showStep: (target: Element | null, step: GuidanceStep) => void;
  showMessage: (message: string) => void;
  /** The step really happened: it belongs on the route the user walked. */
  confirmStep: () => void;
  /** The screen changed, so the marks left on the old one mean nothing. */
  clearRoute: () => void;
  complete: (message: string) => void;
  showBlocked: (reason: string) => void;
  hide: () => void;
};

export type TelemetryEvent = {
  state: GuidanceState;
  cost: CostReport;
  safety: SafetyReport | null;
};

export type GuidanceOptions = {
  endpoint: string;
  surface: GuidanceSurface;
  onTelemetry?: (event: TelemetryEvent) => void;
};

export type Guidance = {
  start: (intent: string) => Promise<void>;
  /** The user acted on the highlighted control. */
  advance: () => void;
  /** The user says this step was already done. */
  skip: () => void;
  /** The user says this step is not what they meant. */
  reject: () => void;
  stop: () => void;
  state: () => GuidanceState;
  cost: () => CostReport;
};

/** Failed attempts on one page state before we stop guessing and say so. */
const MAX_ATTEMPTS_PER_PAGE = 3;

/**
 * Floor between two looks while waiting. A page with a clock in it changes its
 * signature every second, and without this that page would spend the session
 * budget on its own.
 */
const MIN_OBSERVE_GAP_MS = 1200;

type AttemptOutcome = 'no-effect' | 'not-it' | 'already-done';

type Attempt = {
  key: string;
  instruction: string;
  outcome: AttemptOutcome;
};

/**
 * Controls where clicking is the start of the action rather than the action.
 *
 * A select opens a list the browser draws outside the document, and a text field
 * does nothing at all until something is typed into it. Neither moves the page on
 * the click, so the inert verdict would fire while the user is still mid-action,
 * take the one control they actually need out of the list, and leave the loop
 * hunting for a replacement that does not exist.
 */
const FIELD_TAGS = new Set(['input', 'select', 'textarea']);
const FIELD_ROLES = new Set([
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'spinbutton',
]);

function takesInput(element: PageElement | undefined, action: GuideResponse['action']) {
  if (action === 'type' || action === 'select') return true;
  if (!element) return false;
  return FIELD_TAGS.has(element.tag) || FIELD_ROLES.has(element.role);
}

const OUTCOME_NOTE: Record<AttemptOutcome, string> = {
  'no-effect': 'nothing on the page changed',
  'not-it': 'the user says this is not what they meant',
  'already-done': 'the user had already done it',
};

export function createGuidance(options: GuidanceOptions): Guidance {
  const { endpoint, surface } = options;
  const cost = createCostReport();

  let state: GuidanceState = 'idle';
  let sessionId = '';
  let intent = '';
  let stepIndex = 0;
  let completed: string[] = [];
  let currentInstruction = '';
  let currentKey: string | null = null;
  let currentState = '';
  let currentTakesInput = false;
  let safety: SafetyReport | null = null;
  let unwatch: (() => void) | null = null;
  let inFlight: AbortController | null = null;

  /** The page state the attempts below were made against. */
  let signature = '';
  let attempts: Attempt[] = [];
  /** Every control the user actually completed, keyed by the page state it was on. */
  let walked = new Map<string, Set<string>>();
  /** The control the user completed on the step immediately before this one. */
  let lastCompletedKey: string | null = null;
  let resumeTimer = 0;
  let observedAt = 0;
  let activity: PageActivity | null = null;
  let stopWatchingOutcome: (() => void) | null = null;
  /** The user got to the control before we finished pointing at it. */
  let actedEarly = false;

  function clearPending(): void {
    window.clearTimeout(resumeTimer);
    stopWatchingOutcome?.();
    stopWatchingOutcome = null;
  }

  function report(): void {
    options.onTelemetry?.({ state, cost: cost.snapshot(), safety });
  }

  function finish(next: GuidanceState): void {
    state = next;
    clearPending();
    unwatch?.();
    unwatch = null;
    // The host's fetch and XHR go back to being theirs the moment we are done
    // with them, not at some point during page teardown.
    activity?.stop();
    activity = null;
    inFlight?.abort();
    inFlight = null;
    report();
  }

  /** Terminal. Nothing about this session is going to get better on its own. */
  function stall(message: string): void {
    surface.showMessage(message);
    finish('stuck');
  }

  /**
   * Not terminal. There is nothing to point at here, but the user is free to go
   * somewhere there is, and the session will be watching when they do.
   */
  function wait(message: string): void {
    clearPending();
    state = 'waiting';
    // Whatever they pressed, it was not a step we ever offered.
    actedEarly = false;
    currentKey = null;
    surface.showMessage(message);
    report();
  }

  /** Model copy does not always come back punctuated, and we append to it. */
  function sentence(text: string): string {
    return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
  }

  function markWalked(): void {
    if (!currentKey) return;
    const onThisPage = walked.get(signature) ?? new Set<string>();
    onThisPage.add(currentKey);
    walked.set(signature, onThisPage);
    lastCompletedKey = currentKey;
  }

  /**
   * The user is being sent back to a control they already completed, on a page
   * that looks exactly as it did when they completed it. The flow has come full
   * circle, which in practice means the goal was reached a step ago and the model
   * is answering the original question again rather than noticing.
   *
   * Treating that as finished is the honest reading. Pointing at it again would
   * walk the user round the same loop for as long as they let it.
   */
  function alreadyWalked(key: string | null): boolean {
    return key !== null && (walked.get(signature)?.has(key) ?? false);
  }

  function record(outcome: AttemptOutcome): void {
    if (!currentKey) return;
    attempts.push({ key: currentKey, instruction: currentInstruction, outcome });
  }

  /**
   * Elements already tried on this page state are removed, not demoted.
   *
   * We compose the list the model chooses from, which means a control that did
   * nothing can be put out of its reach entirely. That is the difference between
   * asking a model not to repeat itself and making the repeat impossible.
   */
  function offer(pageMap: PageMap): PageMap {
    if (attempts.length === 0) return pageMap;

    const tried = new Set(attempts.map((attempt) => attempt.key));
    return {
      ...pageMap,
      elements: pageMap.elements.filter((element) => !tried.has(elementKey(element))),
    };
  }

  function present(
    response: GuideResponse,
    target: Element | null,
    description: PageElement | undefined,
  ): void {
    currentKey = description ? elementKey(description) : null;
    currentState = description ? elementState(description) : '';
    currentTakesInput = takesInput(description, response.action);

    if (response.status === 'step' && alreadyWalked(currentKey)) {
      surface.complete('That is everything for this one.');
      finish('done');
      return;
    }

    // Sending the user back to the control they just finished with, on a page
    // that has moved on since. That is the model repeating itself rather than a
    // flow closing, so it gets one more pass with that control out of reach
    // instead of being shown as a step.
    if (
      response.status === 'step' &&
      currentKey !== null &&
      currentKey === lastCompletedKey
    ) {
      currentInstruction = response.instruction;
      record('already-done');
      void observe();
      return;
    }

    // A confident wrong answer costs more than an honest "not sure", so below the
    // threshold nothing is highlighted. It gets words instead.
    if (response.confidence < MIN_CONFIDENCE || response.status === 'unclear') {
      wait(response.instruction || 'I am not sure which control that is on this page.');
      return;
    }

    if (response.status === 'not_on_this_page') {
      wait(
        response.suggestedNavigation
          ? `${sentence(response.instruction)} Try ${response.suggestedNavigation}.`
          : response.instruction,
      );
      return;
    }

    if (response.status === 'done') {
      surface.complete(response.instruction || 'That is everything.');
      finish('done');
      return;
    }

    if (response.status === 'refused') {
      stall('That request was not something I should act on.');
      return;
    }

    if (!target) {
      wait(response.instruction);
      return;
    }

    const assessment = classifyAction({ name: description?.name ?? '' });
    currentInstruction = response.instruction;

    state = 'guiding';
    surface.showStep(target, {
      index: stepIndex + 1,
      // Unknown on purpose. We never plan ahead, so claiming a total would be an
      // invention, and the counter says "Step 2" rather than "Step 2 of 4".
      total: 0,
      instruction: response.instruction,
      tier: 'inferred',
      ...(assessment.risk !== 'safe'
        ? {
            risk: assessment.risk,
            consequence: `This is ${assessment.risk}: the control says "${assessment.matched}".`,
          }
        : {}),
    });
    report();

    if (actedEarly) {
      actedEarly = false;
      verify();
    }
  }

  async function observe(note?: string): Promise<void> {
    clearPending();
    observedAt = Date.now();

    if (stepIndex >= SESSION_BUDGET.maxSteps) {
      stall("I've lost the thread on this one. Try asking again.");
      return;
    }

    state = 'observing';

    const verdict = assessPage(document);
    if (!verdict.allowed) {
      // Nothing is distilled and nothing is sent. The circuit breaker runs before
      // the network call, not after it.
      surface.showBlocked(verdict.reason);
      finish('idle');
      return;
    }

    const { pageMap, byId, signature: current } = distillWithElements(document);

    // A different page state wipes the slate: what was inert on the last screen
    // says nothing about this one.
    if (current !== signature) {
      // The route is drawn at fixed points on the screen. Once the screen behind
      // it is a different screen, every mark on it points at whatever moved into
      // that spot, so the trail is wiped rather than left to lie.
      if (signature !== '') surface.clearRoute();
      signature = current;
      attempts = [];
    }

    const failed = attempts.filter((attempt) => attempt.outcome !== 'already-done');
    if (failed.length >= MAX_ATTEMPTS_PER_PAGE) {
      stall('I have tried what this page offers and none of it worked. Ask me again.');
      return;
    }

    const sanitized = sanitizePageMap(offer(pageMap));
    safety = sanitized.report;

    state = 'thinking';
    surface.thinking(note);
    report();

    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;

    try {
      const result = await requestStep(
        endpoint,
        {
          sessionId,
          intent,
          stepIndex,
          pageMap: toPromptPageMap(sanitized.pageMap),
          history: completed,
          tried: failed.map((attempt) =>
            `${attempt.instruction} - ${OUTCOME_NOTE[attempt.outcome]}`.slice(0, 300),
          ),
        },
        controller.signal,
      );

      cost.record(result.stats);

      const id = result.response.elementId;
      present(
        result.response,
        id ? (byId.get(id) ?? null) : null,
        sanitized.pageMap.elements.find((element) => element.id === id),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      stall('I could not reach the guidance service just now.');
    }
  }

  /**
   * Did the control we pointed at do anything?
   *
   * Two kinds of evidence, and the difference between them is the point. The
   * page moving is evidence. The control itself reacting - a menu expanding, a
   * field taking what was typed into it - is evidence. Another field somewhere
   * else on the page taking a value is not: a user typing into their own search
   * box while a dead menu sits there would otherwise close the step they are
   * still stuck on.
   */
  function actionHadEffect(): boolean {
    const { pageMap, signature: current } = distillWithElements(document);
    if (current !== signature) return true;
    if (!currentKey) return false;

    const target = pageMap.elements.find((element) => elementKey(element) === currentKey);
    return target !== undefined && elementState(target) !== currentState;
  }

  function verify(): void {
    state = 'verifying';
    report();

    // A click is what the user intended, not what the application did. If no
    // result arrives the control was inert: a menu nobody wired up, a link the
    // app swallowed, a row that ignores clicks. Nothing in the DOM tells those
    // apart from live controls beforehand - React keeps its handlers in
    // properties, so the markup of a dead button and a working one is the same
    // markup. It has to be measured, and the measurement has to wait on the
    // application rather than on a number we chose for it.
    clearPending();
    stopWatchingOutcome = watchOutcome({
      changed: actionHadEffect,
      busy: () => activity?.busy() ?? false,
      onChanged: confirm,
      onInert: () => {
        // A field the user has only opened or focused is not a dead control, so
        // the step stays on screen and we keep watching for the value to land.
        // They can still say they are done or stop; nothing here is stuck.
        if (currentTakesInput) {
          verify();
          return;
        }

        record('no-effect');
        void observe('That did not do anything. Looking for another way.');
      },
    });
  }

  /** The page moved after the user acted. That, and only that, closes a step. */
  function confirm(): void {
    clearPending();
    markWalked();
    if (currentInstruction) completed.push(currentInstruction);
    stepIndex += 1;
    surface.confirmStep();
    void observe();
  }

  /**
   * Only the waiting state listens here. While verifying, the outcome watcher
   * owns the question, because it has to weigh the answer against whether the
   * application is still working rather than against a clock.
   */
  function onPageChanged(): void {
    if (state !== 'waiting') return;
    if (distillWithElements(document).signature === signature) return;

    // Deferred rather than dropped: a change that arrives too soon after the
    // last look is still a change, and swallowing it would strand the session.
    const cooldown = observedAt + MIN_OBSERVE_GAP_MS - Date.now();
    if (cooldown > 0) {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (state === 'waiting') void observe();
      }, cooldown);
      return;
    }

    void observe();
  }

  return {
    async start(nextIntent) {
      inFlight?.abort();
      unwatch?.();
      clearPending();

      sessionId = crypto.randomUUID();
      intent = nextIntent;
      stepIndex = 0;
      completed = [];
      currentInstruction = '';
      currentKey = null;
      currentState = '';
      currentTakesInput = false;
      signature = '';
      attempts = [];
      walked = new Map();
      lastCompletedKey = null;
      actedEarly = false;
      cost.reset();

      // Watching starts immediately: the page can change while we are thinking.
      unwatch = watchForChange(onPageChanged);

      activity?.stop();
      activity = trackActivity({ ignore: (url) => url.startsWith(endpoint) });

      await observe();
    },

    advance() {
      if (state === 'guiding') {
        verify();
        return;
      }

      // A fast user on a slow answer: they found the control themselves while we
      // were still working out which one it was. Dropping that would mean
      // pointing at something they have already pressed, so it is held and spent
      // the moment the step appears.
      if (state === 'observing' || state === 'thinking') actedEarly = true;
    },

    skip() {
      // Also from verifying: the note and its three replies stay on screen while
      // we watch for a result, so a user waiting on a field that will never
      // report one has to be able to say so and move on.
      if (state !== 'guiding' && state !== 'verifying') return;
      clearPending();

      // Their word, not the page's. Nothing is going to change, so there is
      // nothing to confirm against; what matters is not offering it again.
      record('already-done');
      markWalked();
      if (currentInstruction) completed.push(currentInstruction);
      stepIndex += 1;
      surface.confirmStep();
      void observe();
    },

    reject() {
      if (state !== 'guiding' && state !== 'verifying') return;
      clearPending();

      // Restarting the session here would put the same question to the same page
      // and get the same answer back. The control has to leave the list instead.
      record('not-it');
      void observe('Understood. Looking for something else.');
    },

    stop() {
      surface.hide();
      finish('idle');
    },

    state: () => state,
    cost: () => cost.snapshot(),
  };
}
