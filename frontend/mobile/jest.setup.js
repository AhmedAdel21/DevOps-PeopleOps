// Native-module setup for Jest.
//
// gesture-handler ships a jestSetup that stubs its native module so any
// tree using Swipeable/GestureHandlerRootView renders. Reanimated v4's
// own mock replaces the worklet runtime with a synchronous shim.
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
