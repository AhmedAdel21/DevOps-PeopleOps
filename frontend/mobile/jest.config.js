const path = require('path');

module.exports = {
  preset: '@react-native/jest-preset',
  // Extends @react-native/jest-preset's default — also transforms ESM-shipping deps
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-navigation|react-redux|@reduxjs/toolkit|immer|react-native-inappbrowser-reborn)/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': path.resolve(
      __dirname,
      'node_modules/@react-native-async-storage/async-storage/lib/module/jest/AsyncStorageMock.js',
    ),
    '^@react-native-firebase/auth$': path.resolve(
      __dirname,
      '__mocks__/@react-native-firebase/auth.js',
    ),
    '^@react-native-documents/picker$': path.resolve(
      __dirname,
      '__mocks__/@react-native-documents/picker.js',
    ),
    '^react-native-blob-util$': path.resolve(
      __dirname,
      '__mocks__/react-native-blob-util.js',
    ),
  },
};
