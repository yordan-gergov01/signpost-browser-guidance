import { readEnv } from '@signpost/server/env';
import { buildServer } from '@signpost/server/server';

const env = readEnv();
const app = buildServer(env);

try {
  await app.listen({ port: env.port, host: env.host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
