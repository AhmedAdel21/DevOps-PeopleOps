const path = require('path');

module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage)/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': path.resolve(
      __dirname,
      'node_modules/@react-native-async-storage/async-storage/lib/module/jest/AsyncStorageMock.js',
    ),
  },
};
