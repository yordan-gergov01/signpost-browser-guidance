import { afterEach, beforeEach, describe as suite, expect, test, vi } from 'vitest';
import type { GuideRequest, GuideResponse, GuideResult } from '@hintora/core/types/guide';
import { mountHtml } from '@hintora/core/testing/domFixtures';
import { stubLayout } from '@hintora/core/testing/stubLayout';
import { createGuidance, type Guidance } from '@hintora/client/guidanceSession';

/**
 * The account menu is inert on purpose: a real button, correctly named, that
 * does nothing when clicked. Nothing in the DOM says so, which is the point.
 */
const PAGE = `
  <body>
    <header>
      <a href="/settings">Settings</a>
      <input id="search" aria-label="Search Business" />
      <button id="account" aria-label="Account menu">JD</button>
    </header>
    <main>
      <h1>Contacts</h1>
      <button>Add contact</button>
    </main>
  </body>
`;

const ENDPOINT = 'https://guide.test/step';

type Deferred = { promise: Promise<Response>; settle: () => void };

function deferred(): Deferred {
  let settle = (): void => {};
  const promise = new Promise<Response>((resolve) => {
    settle = () => resolve(new Response(null));
  });
  return { promise, settle };
}

const STATS = {
  model: 'gpt-4.1-nano',
  promptTokens: 900,
  cachedPromptTokens: 0,
  completionTokens: 60,
  usd: 0.0001,
  latencyMs: 1200,
  escalated: false,
};

function step(elementId: string, instruction: string): GuideResult {
  return {
    response: {
      status: 'step',
      elementId,
      action: 'click',
      instruction,
      typeValue: null,
      confidence: 0.9,
      reasoning: '',
      suggestedNavigation: null,
    },
    stats: STATS,
    exhausted: false,
  };
}

function elsewhere(): GuideResult {
  const response: GuideResponse = {
    status: 'not_on_this_page',
    elementId: null,
    action: 'click',
    instruction: 'Account deletion lives in Settings.',
    typeValue: null,
    confidence: 0.9,
    reasoning: '',
    suggestedNavigation: null,
  };
  return { response, stats: STATS, exhausted: false };
}

function named(request: GuideRequest, name: string): string | undefined {
  return request.pageMap.elements.find((element) => element.name === name)?.id;
}

function names(request: GuideRequest): string[] {
  return request.pageMap.elements.map((element) => element.name);
}

const surface = {
  thinking: vi.fn(),
  showStep: vi.fn(),
  showMessage: vi.fn(),
  confirmStep: vi.fn(),
  complete: vi.fn(),
  showBlocked: vi.fn(),
  hide: vi.fn(),
};

let requests: GuideRequest[] = [];
let reply: (request: GuideRequest) => GuideResult;
let guidance: Guidance;
/** Whatever the host application has in flight, under the test's control. */
let hostRequest: Deferred;

/**
 * The model's standing preference, and the trap: whenever the account menu is
 * on offer it takes it. Only removing the element from the list changes its
 * mind, which is exactly the property under test.
 */
function prefersTheAccountMenu(request: GuideRequest): GuideResult {
  const account = named(request, 'Account menu');
  if (account) return step(account, 'Click the account menu');

  const settings = named(request, 'Settings');
  return settings ? step(settings, 'Open Settings') : elsewhere();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();

  mountHtml(PAGE);
  stubLayout(document);

  requests = [];
  reply = prefersTheAccountMenu;
  hostRequest = deferred();

  vi.stubGlobal('fetch', (url: string, init?: { body: string }) => {
    if (url !== ENDPOINT) return hostRequest.promise;

    const request = JSON.parse(init!.body) as GuideRequest;
    requests.push(request);
    return Promise.resolve({ ok: true, json: async () => reply(request) });
  });

  guidance = createGuidance({ endpoint: ENDPOINT, surface });
});

afterEach(() => {
  guidance.stop();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

suite('a control that does nothing', () => {
  test('is not treated as a completed step', async () => {
    await guidance.start('delete my account');
    expect(surface.showStep).toHaveBeenCalledTimes(1);

    guidance.advance();
    await vi.advanceTimersByTimeAsync(2000);

    // The click happened, the page did not move, so nothing was achieved: no
    // ghost pin on the route, no entry in the history, no step counted.
    expect(surface.confirmStep).not.toHaveBeenCalled();
    expect(requests[1]?.history).toEqual([]);
    expect(requests[1]?.stepIndex).toBe(0);
  });

  test("is taken out of the model's reach on the next look", async () => {
    await guidance.start('delete my account');
    guidance.advance();
    await vi.advanceTimersByTimeAsync(2000);

    expect(requests).toHaveLength(2);
    expect(names(requests[1]!)).not.toContain('Account menu');
    expect(requests[1]?.tried).toEqual([
      'Click the account menu - nothing on the page changed',
    ]);
  });

  test('leaves the loop free to find the way that works', async () => {
    await guidance.start('delete my account');
    guidance.advance();
    await vi.advanceTimersByTimeAsync(2000);

    const [, secondStep] = surface.showStep.mock.calls;
    expect(secondStep?.[1].instruction).toBe('Open Settings');
  });

  test('gives up honestly rather than working through the page', async () => {
    reply = (request) => {
      const [first] = request.pageMap.elements;
      return first ? step(first.id, `Click ${first.name}`) : elsewhere();
    };

    await guidance.start('delete my account');
    for (let attempt = 0; attempt < 4; attempt += 1) {
      guidance.advance();
      await vi.advanceTimersByTimeAsync(2000);
    }

    expect(guidance.state()).toBe('stuck');
    expect(surface.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('none of it worked'),
    );
  });
});

suite('deciding how long to wait', () => {
  test('answers as soon as a quiet page has held still', async () => {
    await guidance.start('delete my account');
    guidance.advance();

    await vi.advanceTimersByTimeAsync(300);
    expect(requests).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(400);
    expect(requests).toHaveLength(2);
  });

  // The case no fixed deadline gets right. The click went to the server, there
  // is nothing on screen yet, and the application is working perfectly.
  test('waits out a request instead of calling the control dead', async () => {
    await guidance.start('delete my account');
    guidance.advance();

    void fetch('/api/account');
    await vi.advanceTimersByTimeAsync(6_000);

    expect(requests).toHaveLength(1);
    expect(surface.confirmStep).not.toHaveBeenCalled();

    // The response lands and the application renders what it was fetching.
    document.querySelector('#account')!.setAttribute('aria-expanded', 'true');
    hostRequest.settle();
    await vi.advanceTimersByTimeAsync(600);

    expect(surface.confirmStep).toHaveBeenCalledTimes(1);
  });

  test('does not count its own call to the guidance service as the app working', async () => {
    await guidance.start('delete my account');
    guidance.advance();
    await vi.advanceTimersByTimeAsync(700);

    expect(requests).toHaveLength(2);
  });
});

suite('a user faster than the answer', () => {
  test('does not have to press the control twice', async () => {
    const guiding = guidance.start('delete my account');

    // They found the account menu themselves while we were still thinking.
    guidance.advance();
    await guiding;

    expect(guidance.state()).toBe('verifying');

    document.querySelector('#account')!.setAttribute('aria-expanded', 'true');
    await vi.advanceTimersByTimeAsync(600);

    expect(surface.confirmStep).toHaveBeenCalledTimes(1);
  });
});

suite('a control that works', () => {
  test('closes the step and records it', async () => {
    await guidance.start('delete my account');
    guidance.advance();

    // What the application would have done: the click opened something.
    document.querySelector('#account')!.setAttribute('aria-expanded', 'true');
    await vi.advanceTimersByTimeAsync(600);

    expect(surface.confirmStep).toHaveBeenCalledTimes(1);
    expect(requests[1]?.stepIndex).toBe(1);
    expect(requests[1]?.history).toEqual(['Click the account menu']);
  });

  test('is not confirmed by a repaint that changes nothing', async () => {
    await guidance.start('delete my account');
    guidance.advance();

    document.querySelector('main')!.setAttribute('class', 'is-hovered');
    await vi.advanceTimersByTimeAsync(700);

    expect(surface.confirmStep).not.toHaveBeenCalled();
  });

  // The user gives up on the dead menu and types in the application's own search
  // box. A page that re-renders as they type must not turn that into progress.
  test('is not confirmed by the user typing somewhere else', async () => {
    await guidance.start('delete my account');
    guidance.advance();

    (document.querySelector('#search') as HTMLInputElement).value = 'delete account';
    document.querySelector('main')!.setAttribute('class', 'rerendered');
    await vi.advanceTimersByTimeAsync(700);

    expect(surface.confirmStep).not.toHaveBeenCalled();
  });

  test('is confirmed by the user typing into the field they were sent to', async () => {
    reply = (request) => {
      const field = named(request, 'Search Business');
      return field ? step(field, 'Type into the search box') : elsewhere();
    };

    await guidance.start('find a contact');
    guidance.advance();

    (document.querySelector('#search') as HTMLInputElement).value = 'ada';
    document.querySelector('main')!.setAttribute('class', 'rerendered');
    await vi.advanceTimersByTimeAsync(700);

    expect(surface.confirmStep).toHaveBeenCalledTimes(1);
  });
});

suite('the user disagreeing', () => {
  test('"this is not it" excludes the control instead of asking again', async () => {
    await guidance.start('delete my account');
    guidance.reject();
    await vi.advanceTimersByTimeAsync(100);

    expect(requests).toHaveLength(2);
    // Same session: restarting would put the same question to the same page.
    expect(requests[1]?.sessionId).toBe(requests[0]?.sessionId);
    expect(names(requests[1]!)).not.toContain('Account menu');
    expect(requests[1]?.tried[0]).toContain('not what they meant');
  });

  test('"I have done this" is taken at their word and moves on', async () => {
    await guidance.start('delete my account');
    guidance.skip();
    await vi.advanceTimersByTimeAsync(100);

    expect(surface.confirmStep).toHaveBeenCalledTimes(1);
    expect(requests[1]?.stepIndex).toBe(1);
    expect(requests[1]?.history).toEqual(['Click the account menu']);
    // Nothing failed, so there is nothing to report as tried.
    expect(requests[1]?.tried).toEqual([]);
  });
});

suite('a step that is on another page', () => {
  test('keeps the session alive instead of ending it', async () => {
    reply = elsewhere;

    await guidance.start('delete my account');

    expect(guidance.state()).toBe('waiting');
    expect(surface.showMessage).toHaveBeenCalledWith(expect.stringContaining('Settings'));
  });

  test('picks itself up when the user gets there', async () => {
    reply = elsewhere;
    await guidance.start('delete my account');

    reply = prefersTheAccountMenu;
    document.querySelector('h1')!.textContent = 'Settings';
    await vi.advanceTimersByTimeAsync(2000);

    expect(requests).toHaveLength(2);
    expect(guidance.state()).toBe('guiding');
  });
});
