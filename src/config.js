// TURN relays carry audio when two players can't connect directly (strict NAT, mobile data).
// These values are public: anyone can read them from the site and use the quota.
// Fill in from your TURN provider's dashboard, e.g.
// { urls: 'turn:relay.example.com:443?transport=tcp', username: '...', credential: '...' }
const EXPRESSTURN = { username: '000000002108659076', credential: 'B2PPFU1Q21aXxoXLTuNhawT6kx8=' };

export const TURN_SERVERS = [
  { urls: 'turn:free.expressturn.com:3478' /* free plan: UDP only, TCP returns 401 */, ...EXPRESSTURN },
];
