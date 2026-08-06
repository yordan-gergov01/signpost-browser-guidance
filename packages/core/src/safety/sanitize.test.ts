import { beforeEach, describe as suite, expect, test } from 'vitest';
import { distill } from '@hintora/core/distiller/distill';
import { sanitizePageMap, type SafetyReport } from '@hintora/core/safety/sanitize';
import { totalRedactions } from '@hintora/core/redaction/redact';
import { mountHtml, readFixture } from '@hintora/core/testing/domFixtures';
import { stubLayout } from '@hintora/core/testing/stubLayout';
import type { PageMap } from '@hintora/core/types/pageMap';

suite('sanitizePageMap', () => {
  let pageMap: PageMap;
  let report: SafetyReport;
  let serialized: string;

  beforeEach(() => {
    mountHtml(readFixture(import.meta.url, 'fixtures/hostile-page.html'));
    stubLayout(document);
    const result = sanitizePageMap(distill(document));
    pageMap = result.pageMap;
    report = result.report;
    serialized = JSON.stringify(pageMap);
  });

  test('lets nothing that looks like personal data through', () => {
    expect(serialized).not.toContain('ada@analytical.io');
    expect(serialized).not.toContain('900123456');
    expect(serialized).not.toContain('4111');
    expect(totalRedactions(report.redaction)).toBeGreaterThan(0);
  });

  test('scrubs the section path and the page title, not only element names', () => {
    expect(pageMap.title).toContain('[filtered]');

    const sections = pageMap.elements.flatMap((element) => element.section);
    expect(sections).toContain('Comments from [email]');
  });

  test('neutralises instruction text planted in an accessible name', () => {
    expect(serialized).not.toMatch(/ignore all previous/i);
    expect(report.injection.hits).toBeGreaterThan(0);
  });

  test('keeps the page usable after scrubbing', () => {
    const names = pageMap.elements.map((element) => element.name);
    expect(names).toContain('Reply');
    expect(names).toContain('Delete account');
  });

  test('surfaces a report the debug panel can show', () => {
    expect(report.injection.samples.length).toBeGreaterThan(0);
    expect(Object.keys(report.redaction).length).toBeGreaterThan(0);
  });
});
