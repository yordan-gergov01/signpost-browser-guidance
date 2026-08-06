/**
 * Every rule is scoped to the shadow root and every value is literal. No custom
 * properties, no inherited units: the host page controls neither, and a page
 * that sets `html { font-size: 4px }` must not shrink our card.
 */
export const OVERLAY_CSS = `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; }

.dim {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.ring {
  position: fixed;
  border: 3px solid #6366f1;
  border-radius: 8px;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  pointer-events: none;
  transition: top 120ms ease-out, left 120ms ease-out, width 120ms ease-out, height 120ms ease-out;
}

.card {
  position: fixed;
  top: 0;
  left: 0;
  width: max-content;
  max-width: 320px;
  pointer-events: auto;
  padding: 12px 14px;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.28);
  font: 400 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}

.card--centered { top: 50%; left: 50%; transform: translate(-50%, -50%); }

.counter {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.instruction { font-weight: 500; }

.consequence {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

button {
  padding: 5px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
button:hover { background: #f1f5f9; }
button.primary { border-color: #4f46e5; background: #4f46e5; color: #ffffff; }
button.primary:hover { background: #4338ca; }
button.danger { border-color: #dc2626; background: #dc2626; color: #ffffff; }
button.danger:hover { background: #b91c1c; }

.arrow {
  position: fixed;
  padding: 6px 10px;
  border-radius: 999px;
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.4);
  font: 600 12px/1.2 ui-sans-serif, system-ui, sans-serif;
  pointer-events: none;
}

.hidden { display: none !important; }
`;
