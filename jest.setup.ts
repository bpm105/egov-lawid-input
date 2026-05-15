import '@testing-library/jest-dom';

// Polyfill fetch and related globals for jsdom environment (jsdom does not provide fetch)
// Node 18+ has these natively available via globalThis
if (!global.fetch) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.fetch = (globalThis as any).fetch;
}
if (!global.Response) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Response = (globalThis as any).Response;
}
if (!global.Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Request = (globalThis as any).Request;
}
if (!global.Headers) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Headers = (globalThis as any).Headers;
}
