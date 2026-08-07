/**
 * Horizontal centre of the application's content, not of the window.
 *
 * Nearly every B2B application puts a sidebar down one edge. Centring on the
 * viewport lands the guide visibly off-axis from everything the user is actually
 * looking at. The main landmark is already in the PageMap, so using it here costs
 * one query and removes the effect.
 */
export function contentCentreX(doc: Document): number {
  const main = doc.querySelector('main, [role="main"]');
  if (!main) return window.innerWidth / 2;

  const rect = main.getBoundingClientRect();
  if (rect.width < 200) return window.innerWidth / 2;

  return rect.left + rect.width / 2;
}
