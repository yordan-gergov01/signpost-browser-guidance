export type StubLayoutOptions = {
  rowHeight?: number;
  width?: number;
};

/**
 * happy-dom has no layout engine, so every box comes back 0x0 and the geometry
 * filters would reject the whole page. This assigns each element a deterministic
 * rect stacked down the page, which keeps a single production code path instead
 * of a test-only visibility strategy.
 *
 * `data-stub-rect="x,y,w,h"` overrides an individual element, which is how the
 * zero-area and off-canvas cases are exercised.
 */
export function stubLayout(doc: Document, options: StubLayoutOptions = {}): void {
  const { rowHeight = 24, width = 160 } = options;

  Array.from(doc.querySelectorAll('*')).forEach((element, index) => {
    const override = element.getAttribute('data-stub-rect');
    const [x = 0, y = 0, w = 0, h = 0] = override
      ? override.split(',').map(Number)
      : [0, index * rowHeight, width, rowHeight];

    Object.defineProperty(element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x,
        y,
        width: w,
        height: h,
        left: x,
        top: y,
        right: x + w,
        bottom: y + h,
      }),
    });
  });
}
