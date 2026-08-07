function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.`);
  return value;
}

function number(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export type Env = {
  openAiKey: string;
  port: number;
  host: string;
  corsOrigins: string[];
};

/**
 * Read once, at boot. A missing key fails the process rather than surfacing as a
 * confusing runtime error on the first user request.
 */
export function readEnv(): Env {
  return {
    openAiKey: required('OPENAI_API_KEY'),
    port: number('PORT', 8787),
    host: process.env['HOST'] ?? '127.0.0.1',
    // Allow-list, never a wildcard: this endpoint spends money.
    corsOrigins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

export function hasOpenAiKey(): boolean {
  return Boolean(process.env['OPENAI_API_KEY']);
}
