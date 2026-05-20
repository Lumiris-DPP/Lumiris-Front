import { makeNextAppEnvSchema, parseEnv } from '@lumiris/utils/env';

export const env = parseEnv(makeNextAppEnvSchema('site'));
