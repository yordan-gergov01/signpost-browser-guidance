import { DEFAULT_ACCENT } from '@hintora/overlay/theme';

/**
 * Scoped to the shadow root, and every length is absolute. The host controls
 * neither our cascade nor its root font size, and a page that sets
 * `html { font-size: 4px }` must not shrink the guide.
 */
export function overlayCss(accent: string = DEFAULT_ACCENT): string {
  return `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; font: inherit; }

.layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  font: 400 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif;
  color: #f6f8fb;
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

/*
 * Light on purpose. The application stays readable and usable underneath; the
 * beam points at a control, it does not take the screen hostage.
 */
.dim { position: fixed; inset: 0; width: 100%; height: 100%; color: ${accent}; }

.ring {
  position: fixed;
  border: 2px solid ${accent};
  border-radius: 9px;
  box-shadow: 0 0 0 3px ${accent}2e, 0 0 18px ${accent}40;
  pointer-events: none;
}

.ring--arrived { animation: pulse 640ms cubic-bezier(0.22, 0.9, 0.24, 1) 1; }

@keyframes pulse {
  0%   { box-shadow: 0 0 0 2px ${accent}00, 0 0 8px ${accent}26; }
  40%  { box-shadow: 0 0 0 11px ${accent}00, 0 0 32px ${accent}80; }
  100% { box-shadow: 0 0 0 3px ${accent}2e, 0 0 18px ${accent}40; }
}

/* ---------- annotation: pins, leader, note ---------- */

.pins { position: fixed; inset: 0; pointer-events: none; }
.leader { position: fixed; inset: 0; width: 100%; height: 100%; color: ${accent}; pointer-events: none; }

.pin {
  position: fixed;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${accent};
  color: #221800;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 12px ${accent}66;
  pointer-events: none;
  animation: pinDrop 240ms cubic-bezier(0.22, 0.9, 0.24, 1);
}

/* The route already walked. Faint, but still on the map. */
.pin--ghost {
  background: transparent;
  border: 1.5px dashed ${accent}80;
  color: ${accent};
  box-shadow: none;
  opacity: 0.5;
  animation: none;
}

@keyframes pinDrop {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: none; }
}

/*
 * No card. The sentence sits on the page like a note written over it. Contrast
 * comes from a soft halo with no edge, so it reads as shadow rather than as a
 * container with a border.
 */
.note {
  position: fixed;
  max-width: 316px;
  padding: 2px;
  pointer-events: auto;
  animation: noteIn 200ms cubic-bezier(0.22, 0.9, 0.24, 1);
}

.note::before {
  content: "";
  position: absolute;
  inset: -18px -24px;
  z-index: -1;
  border-radius: 24px;
  background: radial-gradient(
    ellipse at 40% 45%,
    rgba(8, 11, 18, 0.95) 0%,
    rgba(8, 11, 18, 0.9) 45%,
    rgba(8, 11, 18, 0) 100%
  );
}

.note--centred { transform: translateX(-50%); top: 42%; }

@keyframes noteIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; }
}

.note__meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }

.note__counter {
  color: ${accent};
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.note__instruction {
  font-size: 15.5px;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: -0.006em;
}

.note__consequence {
  margin-top: 8px;
  color: #ffb3ae;
  font-size: 13px;
  line-height: 1.4;
}

.note__actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; }

button.link {
  border: none;
  background: none;
  color: #9aa6b8;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}
button.link:hover { color: #f6f8fb; text-decoration: underline; text-underline-offset: 3px; }
button.link.danger { color: #ff9d96; }

.tier {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.tier--curated { background: rgba(52, 211, 153, 0.16); color: #6ee7b7; }
.tier--cached { background: rgba(96, 165, 250, 0.16); color: #93c5fd; }
.tier--inferred { background: ${accent}24; color: ${accent}; }

/* ---------- command bar ---------- */

.bar {
  position: fixed;
  top: 18vh;
  width: min(520px, calc(100vw - 40px));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(16, 19, 26, 0.97);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 2px 6px rgba(0, 0, 0, 0.24),
    0 14px 40px rgba(0, 0, 0, 0.34);
  pointer-events: auto;
  transform: translateX(-50%);
  animation: barIn 200ms cubic-bezier(0.22, 0.9, 0.24, 1);
}

@keyframes barIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.99); }
  to   { opacity: 1; transform: translateX(-50%); }
}

.bar__row { display: flex; align-items: center; gap: 11px; padding: 14px 16px; }

.bar input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #f6f8fb;
  font-size: 15.5px;
  letter-spacing: -0.01em;
}
.bar input::placeholder { color: #6b7686; }

kbd {
  flex: none;
  padding: 2px 6px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: #9aa4b2;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  cursor: pointer;
}

.suggest {
  display: flex;
  flex-direction: column;
  padding: 5px 7px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.suggest__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #d3dae4;
  font-size: 13.5px;
  text-align: left;
  cursor: pointer;
  opacity: 0;
  animation: rise 240ms cubic-bezier(0.22, 0.9, 0.24, 1) forwards;
}
.suggest__item:hover { background: rgba(255, 255, 255, 0.07); color: #f6f8fb; }
.suggest__item::before {
  content: "";
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${accent};
  opacity: 0.5;
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
  color: #221800;
  font-size: 12.5px;
  font-weight: 650;
  box-shadow: 0 8px 22px ${accent}4d;
  pointer-events: none;
}

.hidden { display: none !important; }
`;
}
