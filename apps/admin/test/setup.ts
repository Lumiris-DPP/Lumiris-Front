// Register happy-dom at preload time so `document` / `window` are available when
// individual test files import React + @testing-library at module-evaluation time.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Happy-dom replaces `fetch` / `Response` / `Request` / `Headers` with its own
// implementations. Those collide with MSW's node interceptor (body stream double-read).
// Capture Bun's native versions, then restore them after happy-dom registration so
// we keep happy-dom's DOM + location but reuse the native HTTP primitives.
const nativeFetch = globalThis.fetch;
const nativeResponse = globalThis.Response;
const nativeRequest = globalThis.Request;
const nativeHeaders = globalThis.Headers;

GlobalRegistrator.register({ url: 'http://localhost/' });

if (nativeFetch) globalThis.fetch = nativeFetch;
if (nativeResponse) globalThis.Response = nativeResponse;
if (nativeRequest) globalThis.Request = nativeRequest;
if (nativeHeaders) globalThis.Headers = nativeHeaders;
