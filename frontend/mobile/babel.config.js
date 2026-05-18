module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@assets': './src/assets',
          '@themes': './src/presentation/themes',
        },
      },
    ],
    // Reanimated v4 moved its Babel plugin into react-native-worklets.
    // MUST be the last plugin in the list.
    'react-native-worklets/plugin',
  ],
};
