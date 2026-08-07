import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { boot } from '@hintora/sdk/boot';
import { App } from '@/app/App';
import { createCostHud } from '@/guide/costHud';
import '@/styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const SUGGESTIONS = [
  { label: 'Change my notification email', intent: 'change my notification email' },
  { label: 'Export my contacts', intent: 'export my contacts' },
  { label: 'Add a contact', intent: 'add a contact' },
];

// Injected alongside the application, never into it. The guide shares no state,
// no styles and no React tree with Acme CRM. The endpoint comes off the document
// root in index.html; this call is the four lines a customer writes.
const endpoint = import.meta.env['VITE_GUIDE_ENDPOINT'];
const hud = import.meta.env.DEV ? createCostHud() : null;

const hintora = boot({
  suggestions: SUGGESTIONS,
  ...(endpoint ? { endpoint } : {}),
  onTelemetry: (event) => {
    hud?.(event);
    if (import.meta.env.DEV) {
      (window as Window & { hintoraTelemetry?: unknown }).hintoraTelemetry = event;
    }
  },
});

if (import.meta.env.DEV && hintora) window.hintora = hintora;
