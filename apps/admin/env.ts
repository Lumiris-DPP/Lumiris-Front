// Read env via this module (never process.env directly) so invalid values fail at boot, not at render.
import { makeNextAppEnvSchema, parseEnv } from '@lumiris/utils/env';

export const env = parseEnv(makeNextAppEnvSchema('admin'));
