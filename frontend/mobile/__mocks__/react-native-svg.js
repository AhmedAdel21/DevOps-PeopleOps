// Jest stub for react-native-svg. Native SVG can't load under the RN
// Jest preset. Used by AppPageBackground (Svg/Defs/RadialGradient/Stop/
// Rect) AND, transitively, by every lucide-react-native icon.
//
// IMPORTANT: must be a *concrete enumerable* object, not a Proxy.
// lucide's Icon.js does `Object.keys(require('react-native-svg'))` to
// rebuild a namespace — a Proxy over {} enumerates nothing, so
// `NativeSvg.Svg` becomes undefined and every icon renders as
// `createElement(undefined)`. So we export the full component list.
const React = require('react');
const { View } = require('react-native');

const stub = (name) => {
  const C = React.forwardRef((props, ref) =>
    React.createElement(View, { ref, ...props }, props.children),
  );
  C.displayName = name;
  return C;
};

const NAMES = [
  'Svg', 'Circle', 'Ellipse', 'G', 'Text', 'TSpan', 'TextPath',
  'Path', 'Polygon', 'Polyline', 'Line', 'Rect', 'Use', 'Image',
  'Symbol', 'Defs', 'LinearGradient', 'RadialGradient', 'Stop',
  'ClipPath', 'Pattern', 'Mask', 'Marker', 'ForeignObject',
];

const mod = { __esModule: true };
for (const name of NAMES) {
  mod[name] = stub(name);
}
mod.default = mod.Svg;

module.exports = mod;
