const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function normalizeRoomCode(input) {
  const code = String(input ?? '').toUpperCase().replace(/[\s-]/g, '');
  return /^[A-Z0-9]{6}$/.test(code) ? code : null;
}

export function validateNick(input) {
  const nick = String(input ?? '').trim();
  return nick.length >= 1 && nick.length <= 20 ? nick : null;
}

export function uniqueNicks(entries) {
  const seen = new Map();
  const out = new Map();
  for (const { id, nick } of entries) {
    const n = (seen.get(nick) ?? 0) + 1;
    seen.set(nick, n);
    out.set(id, n === 1 ? nick : `${nick} (${n})`);
  }
  return out;
}

export function cleanMessage(input) {
  const text = String(input ?? '').trim();
  return text ? text.slice(0, 300) : null;
}
