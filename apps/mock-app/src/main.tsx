import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { boot } from '@signpost/sdk/boot';
import { App } from '@/app/App';
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
// no styles and no React tree with Business CRM. The endpoint comes off the document
// root in index.html; this call is the four lines a customer writes.
const endpoint = import.meta.env['VITE_GUIDE_ENDPOINT'];

const signpost = boot({
  suggestions: SUGGESTIONS,
  ...(endpoint ? { endpoint } : {}),
  // Nothing on screen. Telemetry is parked on the window for a developer to read
  // from the console, because the demo should look like the customer's product.
  onTelemetry: (event) => {
    if (import.meta.env.DEV) {
      (window as Window & { signpostTelemetry?: unknown }).signpostTelemetry = event;
    }
  },
});

if (import.meta.env.DEV && signpost) window.signpost = signpost;
