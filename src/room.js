import { joinRoom as trysteroJoin, selfId } from 'https://cdn.jsdelivr.net/npm/@trystero-p2p/torrent@0.26.0/+esm';
import { uniqueNicks, cleanMessage } from './logic.js';

const APP_ID = 'webcord-v1';

export function joinRoom({ code, nick, stream, handlers }) {
  const room = trysteroJoin({ appId: APP_ID }, code);
  const nicks = new Map([[selfId, nick]]); // peerId -> nick; self first, then join order
  const nickAction = room.makeAction('nick');
  const chatAction = room.makeAction('chat');

  const publishPeers = () => {
    const names = uniqueNicks([...nicks].map(([id, n]) => ({ id, nick: n })));
    handlers.onPeers([...names].filter(([id]) => id !== selfId).map(([id, name]) => ({ id, name })));
  };

  nickAction.onMessage = (data, { peerId }) => {
    const n = String(data ?? '').slice(0, 20);
    if (!n) return;
    nicks.set(peerId, n);
    publishPeers();
  };
  chatAction.onMessage = (data, { peerId }) => {
    const text = cleanMessage(data);
    if (!text) return;
    const names = uniqueNicks([...nicks].map(([id, n]) => ({ id, nick: n })));
    handlers.onMessage(names.get(peerId) ?? 'Biri', text);
  };

  room.onPeerJoin = (peerId) => {
    nickAction.send(nick, { target: peerId });
  };
  room.onPeerLeave = (peerId) => {
    nicks.delete(peerId);
    publishPeers();
    handlers.onPeerLeave(peerId);
  };
  room.onPeerStream = (s, peerId) => handlers.onStream(peerId, s);

  if (stream) room.addStream(stream);

  return {
    selfId,
    send(text) {
      const t = cleanMessage(text);
      if (t) chatAction.send(t);
    },
    setMic(enabled) {
      stream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    },
    leave() {
      room.leave();
    },
  };
}
