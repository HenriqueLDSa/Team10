global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Example: Mocking localStorage in Jest if needed
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]), // Mocked response
    })
);