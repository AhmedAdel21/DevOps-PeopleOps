const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: null }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn().mockReturnValue(() => {}),
  onIdTokenChanged: jest.fn().mockReturnValue(() => {}),
};

const auth = jest.fn(() => mockAuth);
auth.EmailAuthProvider = { credential: jest.fn() };

module.exports = auth;
module.exports.default = auth;
