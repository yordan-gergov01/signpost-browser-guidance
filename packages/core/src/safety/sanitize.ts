import {
  mergeRedactionReports,
  redactText,
  type RedactionReport,
} from '@hintora/core/redaction/redact';
import { stripInjection, type InjectionReport } from '@hintora/core/safety/injection';
import type { PageMap } from '@hintora/core/types/pageMap';

export type SafetyReport = {
  redaction: RedactionReport;
  injection: InjectionReport;
};

/**
 * The single boundary between the page and the network. Everything that leaves
 * the browser goes through here, so both passes happen in one walk over the same
 * fields and the debug panel gets one report.
 */
export function sanitizePageMap(pageMap: PageMap): {
  pageMap: PageMap;
  report: SafetyReport;
} {
  const redaction: RedactionReport = {};
  const injection: InjectionReport = { hits: 0, samples: [] };

  function clean<T extends string | undefined>(value: T): T {
    if (value === undefined) return value;

    const redacted = redactText(value);
    mergeRedactionReports(redaction, redacted.report);

    const stripped = stripInjection(redacted.text);
    injection.hits += stripped.report.hits;
    injection.samples.push(...stripped.report.samples);

    return stripped.text as T;
  }

  const sanitized: PageMap = {
    ...pageMap,
    title: clean(pageMap.title),
    headings: pageMap.headings.map(clean),
    activeModal: clean(pageMap.activeModal),
    elements: pageMap.elements.map((element) => ({
      ...element,
      name: clean(element.name),
      href: clean(element.href),
      placeholder: clean(element.placeholder),
      value: clean(element.value),
      nearestHeading: clean(element.nearestHeading),
      section: element.section.map(clean),
    })),
  };

  return { pageMap: sanitized, report: { redaction, injection } };
}
