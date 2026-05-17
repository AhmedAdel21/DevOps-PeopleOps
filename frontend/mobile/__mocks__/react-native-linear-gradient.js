// Jest stub for react-native-linear-gradient. The real module ships a
// native component Jest's RN preset can't load. Render children inside a
// plain View so trees that mount AppLinearGradient / AppPageBackground
// (transitively pulled in by App.test) render without native bindings.
const React = require('react');
const { View } = require('react-native');

const LinearGradient = React.forwardRef((props, ref) =>
  React.createElement(View, { ref, ...props }, props.children),
);
LinearGradient.displayName = 'LinearGradient';

module.exports = {
  __esModule: true,
  default: LinearGradient,
};
