// Happy-dom doit être enregistré en preload pour exposer `document` / `window` aux imports React.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Restore Bun's native `fetch`/`Response`/`Request`/`Headers` après registration — happy-dom les remplace et casse MSW (double-read du body stream).
const nativeFetch = globalThis.fetch;
const nativeResponse = globalThis.Response;
const nativeRequest = globalThis.Request;
const nativeHeaders = globalThis.Headers;

GlobalRegistrator.register({ url: 'http://localhost/' });

if (nativeFetch) globalThis.fetch = nativeFetch;
if (nativeResponse) globalThis.Response = nativeResponse;
if (nativeRequest) globalThis.Request = nativeRequest;
if (nativeHeaders) globalThis.Headers = nativeHeaders;
