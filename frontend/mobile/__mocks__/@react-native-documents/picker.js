// Jest stub for @react-native-documents/picker. The real module ships ESM
// + native bindings that Jest's RN preset can't load, so we replace it with
// a minimal API surface here. Tests that don't exercise the picker get the
// stub for free; tests that do can override per-test with jest.spyOn.

module.exports = {
  pick: jest.fn(() => Promise.resolve([])),
  keepLocalCopy: jest.fn(() => Promise.resolve([])),
  isErrorWithCode: () => false,
  errorCodes: {
    OPERATION_CANCELED: 'DOCUMENT_PICKER_CANCELED',
  },
  types: {
    images: 'public.image',
    pdf: 'com.adobe.pdf',
  },
};
