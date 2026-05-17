// Jest stub for @react-native-community/blur. Native BlurView can't load
// under the RN Jest preset; render children in a plain View so any tree
// mounting AppGlassSurface (e.g. via AppBottomSheet) renders in tests.
const React = require('react');
const { View } = require('react-native');

const passthrough = (name) => {
  const C = React.forwardRef((props, ref) =>
    React.createElement(View, { ref, ...props }, props.children),
  );
  C.displayName = name;
  return C;
};

module.exports = {
  __esModule: true,
  BlurView: passthrough('BlurView'),
  VibrancyView: passthrough('VibrancyView'),
};
