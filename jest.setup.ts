import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Polyfill structuredClone for jsdom environment (fake-indexeddb requires it)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = function structuredClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  };
}
