export async function getMic() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
  } catch {
    return null;
  }
}

const THRESHOLD = 0.02;

export function watchSpeaking(stream, onChange) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Uint8Array(analyser.fftSize);
  let speaking = false;
  let quietSince = 0;
  const timer = setInterval(() => {
    analyser.getByteTimeDomainData(buf);
    let peak = 0;
    for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128);
    const now = performance.now();
    if (peak > THRESHOLD) {
      quietSince = now;
      if (!speaking) onChange((speaking = true));
    } else if (speaking && now - quietSince > 300) {
      onChange((speaking = false));
    }
  }, 100);
  return () => {
    clearInterval(timer);
    ctx.close().catch(() => {});
  };
}
