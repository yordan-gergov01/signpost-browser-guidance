import { toPromptPageMap } from '@signpost/core/distiller/prompt';
import type { PageMap } from '@signpost/core/types/pageMap';

export type CompressionReport = {
  rawHtmlBytes: number;
  pageMapBytes: number;
  promptBytes: number;
  /** Share of the raw HTML removed on the path that reaches the model. */
  reduction: number;
  elementCount: number;
};

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Distillation is a cost lever as much as a quality one, so the ratio is a
 * measured number rather than a claim. `promptBytes` is the one that matters:
 * it excludes geometry, which never reaches the model.
 */
export function measureCompression(rawHtml: string, pageMap: PageMap): CompressionReport {
  const rawHtmlBytes = byteLength(rawHtml);
  const pageMapBytes = byteLength(JSON.stringify(pageMap));
  const promptBytes = byteLength(JSON.stringify(toPromptPageMap(pageMap)));

  return {
    rawHtmlBytes,
    pageMapBytes,
    promptBytes,
    reduction: rawHtmlBytes === 0 ? 0 : 1 - promptBytes / rawHtmlBytes,
    elementCount: pageMap.elements.length,
  };
}

export function formatCompression(label: string, report: CompressionReport): string {
  const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;
  const percent = `${(report.reduction * 100).toFixed(1)}%`;
  return `${label}: ${kb(report.rawHtmlBytes)} HTML -> ${kb(report.promptBytes)} PageMap (${percent} smaller, ${report.elementCount} elements)`;
}
