import { z } from 'zod';

export const elementStateSchema = z.object({
  disabled: z.boolean(),
  checked: z.boolean().optional(),
  expanded: z.boolean().optional(),
  selected: z.boolean().optional(),
});

export const pageElementSchema = z.object({
  /** Stable within one snapshot only. Never persist it; persist a fingerprint. */
  id: z.string(),
  role: z.string(),
  name: z.string(),
  tag: z.string(),
  testId: z.string().optional(),
  /** Pathname only. Query and hash are dropped before this point. */
  href: z.string().optional(),
  placeholder: z.string().optional(),
  /** Redacted for free-text inputs; carries real state for select only. */
  value: z.string().optional(),
  state: elementStateSchema,
  /** Landmark path from outermost to innermost, e.g. ["main", "Saved reports"]. */
  section: z.array(z.string()),
  nearestHeading: z.string().optional(),
  inViewport: z.boolean(),
  /** [x, y, width, height]. Overlay only, stripped before the prompt. */
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

export const pageMapSchema = z.object({
  url: z.string(),
  title: z.string(),
  headings: z.array(z.string()),
  /** Accessible name of the topmost open modal, when one is present. */
  activeModal: z.string().optional(),
  elements: z.array(pageElementSchema),
});

/** What actually reaches the model: same map without geometry. */
export const promptElementSchema = pageElementSchema.omit({ bbox: true });
export const promptPageMapSchema = pageMapSchema.omit({ elements: true }).extend({
  elements: z.array(promptElementSchema),
});

export type ElementState = z.infer<typeof elementStateSchema>;
export type PageElement = z.infer<typeof pageElementSchema>;
export type PageMap = z.infer<typeof pageMapSchema>;
export type PromptElement = z.infer<typeof promptElementSchema>;
export type PromptPageMap = z.infer<typeof promptPageMapSchema>;
