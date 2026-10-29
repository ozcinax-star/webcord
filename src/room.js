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

  const screenAction = room.makeAction('screen');
  let screen = null;

  screenAction.onMessage = (data, { peerId }) => {
    if (data === 'off') handlers.onScreenStop(peerId);
  };

  // addStream only reaches peers connected right now, so late joiners get both streams here.
  room.onPeerJoin = (peerId) => {
    nickAction.send(nick, { target: peerId });
    if (stream) room.addStream(stream, { target: peerId, metadata: { type: 'mic' } });
    if (screen) room.addStream(screen, { target: peerId, metadata: { type: 'screen' } });
  };
  room.onPeerLeave = (peerId) => {
    nicks.delete(peerId);
    publishPeers();
    handlers.onPeerLeave(peerId);
  };
  room.onPeerStream = (s, peerId, meta) => {
    if (meta?.type === 'screen') handlers.onScreen(peerId, s);
    else handlers.onStream(peerId, s);
  };

  const fpsConstraint = (fps) => ({ frameRate: { ideal: fps, max: fps } });
  let screenState = 'off'; // 'off' | 'starting' | 'on'; the single source of truth for sharing
  let left = false;
  const setScreenState = (state) => {
    screenState = state;
    handlers.onScreenState(state);
  };

  const stopScreen = () => {
    if (screenState !== 'on') return;
    const s = screen;
    screen = null;
    room.removeStream(s);
    s.getTracks().forEach((t) => t.stop());
    screenAction.send('off');
    setScreenState('off');
  };

  return {
    selfId,
    send(text) {
      const t = cleanMessage(text);
      if (t) chatAction.send(t);
    },
    setMic(enabled) {
      stream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    },
    async startScreen(fps) {
      if (screenState !== 'off' || left) return;
      setScreenState('starting');
      let captured;
      try {
        captured = await navigator.mediaDevices.getDisplayMedia({ video: fpsConstraint(fps), audio: false });
      } catch {
        if (!left) setScreenState('off');
        return;
      }
      if (left) {
        // The room was left while the picker was open: release the capture immediately.
        captured.getTracks().forEach((t) => t.stop());
        return;
      }
      screen = captured;
      screen.getVideoTracks()[0].onended = stopScreen;
      room.addStream(screen, { metadata: { type: 'screen' } });
      setScreenState('on');
    },
    async setScreenFps(fps) {
      const track = screen?.getVideoTracks()[0];
      if (!track) return false;
      try {
        await track.applyConstraints(fpsConstraint(fps));
        return true;
      } catch {
        return false;
      }
    },
    stopScreen,
    leave() {
      stopScreen();
      left = true;
      room.leave();
    },
  };
}
