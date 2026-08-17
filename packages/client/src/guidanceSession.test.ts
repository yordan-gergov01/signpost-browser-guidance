import { afterEach, beforeEach, describe as suite, expect, test, vi } from 'vitest';
import type {
  GuideRequest,
  GuideResponse,
  GuideResult,
} from '@signpost/core/types/guide';
import { mountHtml } from '@signpost/core/testing/domFixtures';
import { stubLayout } from '@signpost/core/testing/stubLayout';
import { createGuidance, type Guidance } from '@signpost/client/guidanceSession';

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
  clearRoute: vi.fn(),
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
    // Only ever offers something clickable: a field is never called inert, which
    // is a different rule tested separately.
    reply = (request) => {
      const first = request.pageMap.elements.find(
        (element) => element.tag === 'button' || element.tag === 'a',
      );
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

suite('a control the user has to fill in', () => {
  const pointAtSearch = (request: GuideRequest): GuideResult => {
    const field = named(request, 'Search Business');
    return field ? step(field, 'Choose a value in the search box') : elsewhere();
  };

  // Clicking a select opens a list the browser draws outside the document, and a
  // text field does nothing until something is typed. Calling either one dead
  // takes the control the user actually needs out of the list.
  test('is never called inert just because the click changed nothing', async () => {
    reply = pointAtSearch;

    await guidance.start('filter my deals');
    guidance.advance();
    await vi.advanceTimersByTimeAsync(12_000);

    expect(requests).toHaveLength(1);
    expect(guidance.state()).toBe('verifying');
    expect(surface.confirmStep).not.toHaveBeenCalled();
  });

  // Without this the note sits there with three replies that do nothing, and the
  // only way out is the Stop button.
  test('can still be answered while the session is waiting on the value', async () => {
    reply = pointAtSearch;

    await guidance.start('filter my deals');
    guidance.advance();
    await vi.advanceTimersByTimeAsync(12_000);
    expect(guidance.state()).toBe('verifying');

    guidance.skip();
    await vi.advanceTimersByTimeAsync(100);

    expect(surface.confirmStep).toHaveBeenCalledTimes(1);
    expect(requests).toHaveLength(2);
  });

  test('can be rejected while the session is waiting on the value', async () => {
    reply = pointAtSearch;

    await guidance.start('filter my deals');
    guidance.advance();
    await vi.advanceTimersByTimeAsync(12_000);

    guidance.reject();
    await vi.advanceTimersByTimeAsync(100);

    expect(requests).toHaveLength(2);
    expect(names(requests[1]!)).not.toContain('Search Business');
  });

  test('closes the step when the value finally lands', async () => {
    reply = pointAtSearch;

    await guidance.start('filter my deals');
    guidance.advance();
    await vi.advanceTimersByTimeAsync(12_000);

    (document.querySelector('#search') as HTMLInputElement).value = 'discovery';
    document.querySelector('main')!.setAttribute('class', 'rerendered');
    await vi.advanceTimersByTimeAsync(700);

    expect(surface.confirmStep).toHaveBeenCalledTimes(1);
  });
});

suite('reaching the end', () => {
  // The model keeps answering the original question because the page is back to
  // where it started. Without this the user is walked round the same loop for as
  // long as they keep clicking.
  test('stops instead of guiding the same step a second time', async () => {
    const account = document.querySelector('#account')!;

    await guidance.start('delete my account');
    guidance.advance();

    account.setAttribute('aria-expanded', 'true');
    await vi.advanceTimersByTimeAsync(600);
    expect(surface.confirmStep).toHaveBeenCalledTimes(1);

    // The user acts again and the application lands back where it started, so
    // the model answers the original question a second time.
    guidance.advance();
    account.removeAttribute('aria-expanded');
    await vi.advanceTimersByTimeAsync(600);

    expect(surface.complete).toHaveBeenCalledTimes(1);
    expect(guidance.state()).toBe('done');
  });

  // A toggle the user just flipped changes the page state, so the full-circle
  // check cannot see it. Pointing at it again is the model repeating itself.
  test('does not send the user back to the control they just finished with', async () => {
    const account = document.querySelector('#account')!;

    await guidance.start('delete my account');
    guidance.advance();

    account.setAttribute('aria-expanded', 'true');
    await vi.advanceTimersByTimeAsync(600);

    const offered = requests.at(-1);
    expect(names(offered!)).not.toContain('Account menu');
    expect(offered?.tried ?? []).toEqual([]);
  });

  test('still guides a control it has not walked before', async () => {
    await guidance.start('delete my account');
    guidance.advance();

    document.querySelector('#account')!.setAttribute('aria-expanded', 'true');
    await vi.advanceTimersByTimeAsync(600);

    expect(guidance.state()).not.toBe('done');
    expect(surface.showStep.mock.calls.length).toBeGreaterThan(1);
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
