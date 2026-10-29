import { generateRoomCode, normalizeRoomCode, validateNick } from './logic.js';
import { getMic, watchSpeaking } from './audio.js';
import { joinRoom } from './room.js';

const $ = (id) => document.getElementById(id);
const MAX_COMFORTABLE = 6;

let session = null; // {room, stream, stops: Map<id, fn>, audios: Map<id, el>, speaking: Set, peers, nick}

const params = new URLSearchParams(location.search);
if (params.get('oda')) $('code').value = params.get('oda');

$('btn-create').onclick = () => {
  $('code').value = generateRoomCode();
  join();
};
$('btn-join').onclick = join;
$('btn-leave').onclick = leave;
window.addEventListener('pagehide', () => session?.room.leave());

async function join() {
  if (session) return;
  const nick = validateNick($('nick').value);
  const code = normalizeRoomCode($('code').value);
  if (!nick) return ($('join-error').textContent = 'Takma ad 1-20 karakter olmalı.');
  if (!code) return ($('join-error').textContent = 'Oda kodu 6 harf/rakam olmalı.');
  $('join-error').textContent = '';

  const stream = await getMic();
  $('mic-warning').hidden = !!stream;
  $('btn-mic').hidden = !stream;

  const s = (session = {
    nick, code, stream, peers: [], speaking: new Set(),
    stops: new Map(), audios: new Map(), micOn: true,
  });
  s.room = joinRoom({
    code, nick, stream,
    handlers: {
      onPeers(list) { s.peers = list; renderPeers(); },
      onStream(id, remote) {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.srcObject = remote;
        $('audio-sink').append(audio);
        s.audios.set(id, audio);
        s.stops.set(id, watchSpeaking(remote, (on) => setSpeaking(id, on)));
      },
      onPeerLeave(id) {
        s.stops.get(id)?.(); s.stops.delete(id);
        s.audios.get(id)?.remove(); s.audios.delete(id);
        s.speaking.delete(id);
        removeScreen(id);
        renderPeers();
      },
      onScreen(id, remote) {
        removeScreen(id);
        const fig = document.createElement('figure');
        fig.dataset.peer = id;
        const cap = document.createElement('figcaption');
        cap.textContent = `${s.peers.find((p) => p.id === id)?.name ?? 'Biri'} ekranını paylaşıyor`;
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.controls = true;
        video.srcObject = remote;
        fig.append(cap, video);
        $('screens').append(fig);
      },
      onScreenStop: removeScreen,
      onMessage: addMessage,
    },
  });
  if (stream) s.stops.set('self', watchSpeaking(stream, (on) => s.micOn && setSpeaking('self', on)));

  $('room-code').textContent = code;
  $('chat-log').textContent = '';
  $('screen-join').hidden = true;
  $('screen-room').hidden = false;
  renderPeers();
}

function removeScreen(id) {
  document.querySelector(`#screens [data-peer="${CSS.escape(id)}"]`)?.remove();
}

function setSpeaking(id, on) {
  if (!session) return;
  on ? session.speaking.add(id) : session.speaking.delete(id);
  renderPeers();
}

function renderPeers() {
  if (!session) return;
  const all = [{ id: 'self', name: `${session.nick} (sen)` }, ...session.peers];
  $('size-warning').hidden = all.length <= MAX_COMFORTABLE;
  $('peer-list').replaceChildren(...all.map((p) => {
    const li = document.createElement('li');
    li.textContent = p.name;
    li.classList.toggle('speaking', session.speaking.has(p.id));
    return li;
  }));
}

function addMessage(name, text) {
  const p = document.createElement('p');
  const b = document.createElement('b');
  b.textContent = name + ': ';
  p.append(b, document.createTextNode(text));
  const log = $('chat-log');
  log.append(p);
  log.scrollTop = log.scrollHeight;
}

$('chat-form').onsubmit = (e) => {
  e.preventDefault();
  const text = $('chat-input').value;
  if (!text.trim() || !session) return;
  session.room.send(text);
  addMessage(session.nick, text.trim().slice(0, 300));
  $('chat-input').value = '';
};

$('btn-mic').onclick = () => {
  session.micOn = !session.micOn;
  session.room.setMic(session.micOn);
  $('btn-mic').textContent = session.micOn ? 'Mikrofonu kapat' : 'Mikrofonu aç';
  if (!session.micOn) setSpeaking('self', false);
};

const canShare = !!navigator.mediaDevices?.getDisplayMedia;
$('btn-screen').hidden = !canShare;
$('btn-screen').onclick = async () => {
  const label = () => ($('btn-screen').textContent = 'Ekran paylaş');
  if (session.sharing) {
    session.sharing = false;
    session.room.stopScreen();
    return label();
  }
  if (await session.room.startScreen(() => { session.sharing = false; label(); })) {
    session.sharing = true;
    $('btn-screen').textContent = 'Paylaşımı durdur';
  }
};

$('btn-copy').onclick = async () => {
  const url = `${location.origin}${location.pathname}?oda=${session.code}`;
  try { await navigator.clipboard.writeText(url); $('btn-copy').textContent = 'Kopyalandı'; }
  catch { prompt('Linki kopyala:', url); }
  setTimeout(() => ($('btn-copy').textContent = 'Linki kopyala'), 1500);
};

function leave() {
  if (!session) return;
  session.stops.forEach((stop) => stop());
  session.audios.forEach((a) => a.remove());
  session.stream?.getTracks().forEach((t) => t.stop());
  session.room.leave();
  session = null;
  $('screens').replaceChildren();
  $('btn-screen').textContent = 'Ekran paylaş';
  $('btn-mic').textContent = 'Mikrofonu kapat';
  $('screen-room').hidden = true;
  $('screen-join').hidden = false;
}
