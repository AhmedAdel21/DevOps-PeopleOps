// Jest stub for react-native-blob-util. The real module ships ESM + native
// bindings that Jest's RN preset can't load, so any test that transitively
// imports the DI graph (which pulls in AttachmentRemoteDataSource) needs
// this stub. Tests that actually exercise multipart upload can override
// per-test with jest.spyOn.

const noop = () => {};

module.exports = {
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve({ json: () => ({}), info: () => ({ status: 200 }) })),
    wrap: (path) => path,
    fs: {
      dirs: { CacheDir: '/tmp', DocumentDir: '/tmp' },
      unlink: jest.fn(noop),
    },
    config: () => ({ fetch: jest.fn(() => Promise.resolve({})) }),
  },
};
