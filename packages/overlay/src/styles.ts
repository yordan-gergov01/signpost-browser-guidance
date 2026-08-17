import { DEFAULT_ACCENT, onAccent } from '@signpost/overlay/theme';

/**
 * Scoped to the shadow root, and every length is absolute. The host controls
 * neither our cascade nor its root font size, and a page that sets
 * `html { font-size: 4px }` must not shrink the guide.
 *
 * Light, and deliberately not the application's kind of light. Business
 * software is cool greys and blue primaries laid out in rectangular cards; this
 * is warm paper, round corners, a hand-drawn leader line and no card at all
 * around the sentence. The user has to be able to tell at a glance who is
 * speaking, and that separation is a safety property before it is a taste one.
 */
export function overlayCss(accent: string = DEFAULT_ACCENT): string {
  const on = onAccent(accent);

  return `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; font: inherit; }

.layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  font: 400 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif;
  color: #14181f;
  -webkit-font-smoothing: antialiased;
}

.mark {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${accent};
  box-shadow: 0 0 0 3px ${accent}26;
}

/* ---------- spotlight ---------- */

.dim { position: fixed; inset: 0; width: 100%; height: 100%; color: ${accent}; }

.ring {
  position: fixed;
  border: 2px solid ${accent};
  border-radius: 10px;
  box-shadow:
    0 0 0 4px ${accent}24,
    0 0 22px ${accent}38,
    inset 0 0 0 1px #ffffff8c;
  pointer-events: none;
}

.ring--arrived { animation: pulse 640ms cubic-bezier(0.22, 0.9, 0.24, 1) 1; }

@keyframes pulse {
  0%   { box-shadow: 0 0 0 2px ${accent}00, 0 0 8px ${accent}26; }
  40%  { box-shadow: 0 0 0 12px ${accent}00, 0 0 34px ${accent}7a; }
  100% { box-shadow: 0 0 0 4px ${accent}24, 0 0 22px ${accent}38, inset 0 0 0 1px #ffffff8c; }
}

/* ---------- annotation: pins, leader, note ---------- */

.pins { position: fixed; inset: 0; pointer-events: none; }
.leader { position: fixed; inset: 0; width: 100%; height: 100%; color: ${accent}; pointer-events: none; }

.pin {
  position: fixed;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: ${accent};
  color: ${on};
  font-size: 12.5px;
  font-weight: 700;
  box-shadow: 0 1px 2px #0a0f1a2e, 0 6px 16px ${accent}59, 0 0 0 2.5px #ffffffe6;
  pointer-events: none;
  animation: pinDrop 240ms cubic-bezier(0.22, 0.9, 0.24, 1);
}

/* The route already walked. Faint, but still on the map. */
.pin--ghost {
  background: #ffffffe6;
  border: 1.5px dashed ${accent}8c;
  color: ${accent};
  box-shadow: 0 1px 3px #0a0f1a1f;
  opacity: 0.72;
  animation: none;
}

@keyframes pinDrop {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: none; }
}

/*
 * Paper, not a card. A hairline and a soft shadow, no heavy border, so it reads
 * as something laid on the page rather than another panel the application owns.
 */
.note {
  position: fixed;
  max-width: 328px;
  padding: 13px 15px 14px;
  border-radius: 14px;
  border: 1px solid #10182814;
  background: #fffdfa;
  box-shadow:
    0 1px 2px #0a0f1a14,
    0 10px 28px -6px #0a0f1a2b,
    0 24px 48px -20px #0a0f1a24;
  pointer-events: auto;
  animation: noteIn 200ms cubic-bezier(0.22, 0.9, 0.24, 1);
}

/* The accent only ever edges the note. It is a customer-chosen colour, so it
   never has to carry legibility for text. */
.note::before {
  content: "";
  position: absolute;
  left: 15px;
  right: 15px;
  top: 0;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: ${accent};
  opacity: 0.85;
}

.note--centred { transform: translateX(-50%); top: 42%; }

@keyframes noteIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; }
}

.note__meta { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }

.note__counter {
  color: #6a7382;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.note__instruction {
  font-size: 15px;
  font-weight: 550;
  line-height: 1.45;
  letter-spacing: -0.006em;
  color: #14181f;
}

.note__consequence {
  margin-top: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  background: #fef2f2;
  color: #a4231c;
  font-size: 12.5px;
  line-height: 1.4;
}

.note__actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 11px; }

button.link {
  border: none;
  background: none;
  color: #6a7382;
  font-size: 12.5px;
  font-weight: 550;
  cursor: pointer;
  padding: 0;
}
button.link:hover { color: #14181f; text-decoration: underline; text-underline-offset: 3px; }
button.link.danger { color: #c0271f; }

.tier {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 650;
  white-space: nowrap;
}
.tier--curated { background: #dcfce7; color: #15803d; }
.tier--cached { background: #dbeafe; color: #1d4ed8; }
.tier--inferred { background: #f1f3f7; color: #556071; }

/* ---------- command bar ---------- */

.bar {
  position: fixed;
  top: 16vh;
  width: min(520px, calc(100vw - 32px));
  border: 1px solid #10182814;
  border-radius: 16px;
  background: #fffdfa;
  box-shadow:
    0 1px 2px #0a0f1a14,
    0 12px 32px -8px #0a0f1a2e,
    0 32px 64px -24px #0a0f1a2b;
  pointer-events: auto;
  transform: translateX(-50%);
  animation: barIn 200ms cubic-bezier(0.22, 0.9, 0.24, 1);
}

@keyframes barIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.99); }
  to   { opacity: 1; transform: translateX(-50%); }
}

.bar__row { display: flex; align-items: center; gap: 11px; padding: 15px 17px; }

.bar input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #14181f;
  font-size: 15.5px;
  letter-spacing: -0.01em;
}
.bar input::placeholder { color: #98a1af; }

kbd {
  flex: none;
  padding: 2px 6px;
  border: 1px solid #1018281f;
  border-radius: 5px;
  background: #f4f6f9;
  color: #6a7382;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  cursor: pointer;
}

.suggest {
  display: flex;
  flex-direction: column;
  padding: 5px 7px 8px;
  border-top: 1px solid #1018280f;
}

.suggest__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #3c4553;
  font-size: 13.5px;
  text-align: left;
  cursor: pointer;
  opacity: 0;
  animation: rise 240ms cubic-bezier(0.22, 0.9, 0.24, 1) forwards;
}
.suggest__item:hover { background: #f4f6f9; color: #14181f; }
.suggest__item::before {
  content: "";
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${accent};
  opacity: 0.45;
}
.suggest__item:hover::before { opacity: 1; }

@keyframes rise {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}

/* ---------- off-screen chip ---------- */

.chip {
  position: fixed;
  padding: 7px 13px;
  border-radius: 999px;
  background: ${accent};
  color: ${on};
  font-size: 12.5px;
  font-weight: 650;
  box-shadow: 0 6px 18px ${accent}4d, 0 0 0 2.5px #ffffffe6;
  pointer-events: none;
}

/*
 * Narrow viewports get the sentence as a sheet at the bottom rather than beside
 * the control: there is no "beside" on a phone, and a note that overlaps the
 * thing it is describing is worse than one that is merely near it.
 */
.note--sheet {
  left: 12px !important;
  right: 12px;
  bottom: 14px;
  top: auto !important;
  max-width: none;
  transform: none;
}

.hidden { display: none !important; }
`;
}
