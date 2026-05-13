// Jest stub for react-native-geolocation-service. The real module wraps
// native iOS/Android bindings that Jest's RN preset can't load. Returns a
// canned coord pair; tests that need to assert specific lat/lng or error
// paths can override per-test with jest.spyOn(Geolocation, 'getCurrentPosition').

module.exports = {
  __esModule: true,
  default: {
    requestAuthorization: jest.fn(() => Promise.resolve('granted')),
    getCurrentPosition: jest.fn((onSuccess) =>
      onSuccess({ coords: { latitude: 0, longitude: 0, accuracy: 1 } }),
    ),
    watchPosition: jest.fn(() => 0),
    clearWatch: jest.fn(),
  },
};
