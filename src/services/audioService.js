/**
 * Basyir Agency Arabic audio service.
 * Uses Nabra TTS, a browser-side neural Arabic TTS engine.
 * No Windows voice pack or operating-system speech voice is required.
 * On first use, the browser downloads the model and caches it for later use.
 */

const MAX_AUDIO_CACHE = 32;
let requestId = 0;
let ttsPromise = null;
let ttsInstance = null;
let audioContext = null;
let activeSource = null;
let activeAudioElement = null;
const generatedAudioCache = new Map();

function reportStatus(kind, message, reason = '') {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('basyir-audio-status', {
      detail: { kind, message, reason }
    }));
  } catch {
    // A status notification must never break audio playback.
  }
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContextConstructor();
  }
  return audioContext;
}

function stopCurrentPlayback() {
  if (activeSource) {
    try {
      activeSource.onended = null;
      activeSource.stop(0);
      activeSource.disconnect();
    } catch {
      // The source may already have ended.
    }
    activeSource = null;
  }

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // Ignore media cleanup errors.
    }
    activeAudioElement = null;
  }
}

export function stopAudio() {
  requestId += 1;
  stopCurrentPlayback();
}

function loadNabraTTS() {
  if (ttsInstance) return Promise.resolve(ttsInstance);
  if (ttsPromise) return ttsPromise;

  let lastReportedPercent = -20;
  let lastReportedFile = '';
  reportStatus(
    'info',
    'Menyiapkan suara Arab di browser. Unduhan awal sekitar 20–30 MB, tanpa memasang suara Windows.',
    'NABRA_TTS_LOADING'
  );

  ttsPromise = import('nabra-tts')
    .then(({ NabraTTS }) => {
      if (!NabraTTS || typeof NabraTTS.load !== 'function') {
        throw new Error('NABRA_TTS_EXPORT_NOT_FOUND');
      }

      return NabraTTS.load({
        // Force the portable CPU/WASM backend. The current browser's WebGPU
        // backend is failing to compile an f16 compute shader.
        dtype: 'fp32',
        device: 'wasm',
        numThreads: 1,
        cache: true,
        onProgress: ({ file = '', loaded = 0, total = 0 } = {}) => {
          if (!total) return;
          const percent = Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
          if (percent >= 100 || percent - lastReportedPercent >= 20 || file !== lastReportedFile) {
            lastReportedPercent = percent;
            lastReportedFile = file;
            reportStatus(
              'info',
              `Mengunduh mesin suara Arab: ${percent}%${file ? ` · ${file}` : ''}`,
              'NABRA_TTS_PROGRESS'
            );
          }
        }
      });
    })
    .then((instance) => {
      ttsInstance = instance;
      reportStatus('success', 'Mesin suara Arab siap. Suara akan disimpan di cache browser untuk pemakaian berikutnya.', 'NABRA_TTS_READY');
      return instance;
    })
    .catch((error) => {
      ttsPromise = null;
      console.error('[Basyir audio] Nabra TTS failed to load:', error);
      throw error;
    });

  return ttsPromise;
}

function cacheGeneratedAudio(text, audio, sampleRate) {
  generatedAudioCache.delete(text);
  generatedAudioCache.set(text, { audio, sampleRate });
  while (generatedAudioCache.size > MAX_AUDIO_CACHE) {
    const oldestKey = generatedAudioCache.keys().next().value;
    generatedAudioCache.delete(oldestKey);
  }
}

function playProvidedSource(src, id) {
  if (typeof Audio === 'undefined') {
    return Promise.resolve({ ok: false, reason: 'HTML_AUDIO_UNAVAILABLE' });
  }

  return new Promise((resolve) => {
    const audio = new Audio(src);
    let settled = false;
    let timer;
    activeAudioElement = audio;
    audio.preload = 'auto';
    audio.volume = 1;
    audio.muted = false;

    const cleanup = () => {
      clearTimeout(timer);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (!result.ok && activeAudioElement === audio) activeAudioElement = null;
      resolve(result);
    };
    const onPlaying = () => {
      if (id !== requestId) {
        audio.pause();
        finish({ ok: false, reason: 'PLAYBACK_CANCELLED' });
        return;
      }
      reportStatus('success', 'Audio berhasil diputar.', 'AUDIO_FILE_PLAYING');
      finish({ ok: true, mode: 'audio-file' });
    };
    const onError = () => finish({
      ok: false,
      reason: audio.error?.code ? `HTML_AUDIO_ERROR_${audio.error.code}` : 'HTML_AUDIO_ERROR'
    });
    const onEnded = () => {
      if (activeAudioElement === audio) activeAudioElement = null;
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    timer = setTimeout(() => finish({ ok: false, reason: 'AUDIO_START_TIMEOUT' }), 10000);

    try {
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch((error) => finish({ ok: false, reason: error?.name || 'AUDIO_PLAY_REJECTED' }));
      }
    } catch (error) {
      finish({ ok: false, reason: error?.name || 'AUDIO_PLAY_FAILED' });
    }
  });
}

/**
 * Play Arabic text with an in-browser neural TTS engine.
 * @param {{text?: string, src?: string|null}} options
 */
export async function playArabic({ text = '', src = null } = {}) {
  requestId += 1;
  const id = requestId;
  stopCurrentPlayback();
  const cleanText = String(text ?? '').trim();

  if (src) {
    const fileResult = await playProvidedSource(src, id);
    if (fileResult.ok || fileResult.reason === 'PLAYBACK_CANCELLED') return fileResult;
  }

  if (!cleanText) {
    reportStatus('warning', 'Teks Bahasa Arab kosong, jadi audio tidak dapat dibuat.', 'EMPTY_TEXT');
    return { ok: false, reason: 'EMPTY_TEXT' };
  }

  // Create/resume AudioContext immediately during the user's click gesture.
  // This helps mobile browsers retain permission to play after model loading.
  const context = getAudioContext();
  if (!context) {
    reportStatus('error', 'Browser ini tidak mendukung Web Audio API. Coba gunakan Chrome, Edge, Safari, atau Firefox versi terbaru.', 'WEB_AUDIO_UNAVAILABLE');
    return { ok: false, reason: 'WEB_AUDIO_UNAVAILABLE' };
  }

  let resumePromise;
  try {
    resumePromise = context.state === 'running' ? Promise.resolve() : context.resume();
  } catch (error) {
    resumePromise = Promise.reject(error);
  }

  try {
    const tts = await loadNabraTTS();
    if (id !== requestId) return { ok: false, reason: 'PLAYBACK_CANCELLED' };

    let generated = generatedAudioCache.get(cleanText);
    if (generated) {
      generatedAudioCache.delete(cleanText);
      generatedAudioCache.set(cleanText, generated);
    } else {
      reportStatus('info', 'Membuat pelafalan Bahasa Arab…', 'NABRA_TTS_GENERATING');
      generated = await tts.generate(cleanText, { speed: 0.82 });
      if (id !== requestId) return { ok: false, reason: 'PLAYBACK_CANCELLED' };
      cacheGeneratedAudio(cleanText, generated.audio, generated.sampleRate || 24000);
    }

    await resumePromise;
    if (context.state !== 'running') await context.resume();
    if (id !== requestId) return { ok: false, reason: 'PLAYBACK_CANCELLED' };

    const samples = generated.audio;
    const sampleRate = generated.sampleRate || 24000;
    const audioBuffer = context.createBuffer(1, samples.length, sampleRate);
    audioBuffer.copyToChannel(samples, 0);

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.onended = () => {
      if (activeSource === source) activeSource = null;
      try { source.disconnect(); } catch { /* already disconnected */ }
    };
    activeSource = source;
    source.start(0);

    reportStatus('success', 'Audio Bahasa Arab sedang diputar.', 'NABRA_TTS_PLAYING');
    return { ok: true, mode: 'nabra-browser-tts' };
  } catch (error) {
    const reason = error?.message || error?.name || 'NABRA_TTS_FAILED';
    console.error('[Basyir audio] Browser Arabic TTS failed:', error);
    reportStatus(
      'error',
      'Suara Arab gagal disiapkan. Pastikan internet aktif saat pemakaian pertama. Model suara diunduh ke cache browser, tanpa perlu memasang suara di Windows. Jika gagal lagi, periksa koneksi atau akses ke Hugging Face dan jsDelivr.',
      reason
    );
    return { ok: false, reason };
  }
}

export async function preloadAudio(sources = []) {
  // Legacy-compatible API. Nabra generates speech from text instead of URL files.
  return {
    requested: Array.isArray(sources) ? sources.filter(Boolean).length : 0,
    cached: generatedAudioCache.size
  };
}

export function getAudioDiagnostics() {
  return {
    engine: 'nabra-tts',
    engineLoaded: Boolean(ttsInstance),
    engineLoading: Boolean(ttsPromise && !ttsInstance),
    webAudioAvailable: typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext),
    audioContextState: audioContext?.state || 'not-created',
    cachedPhrases: generatedAudioCache.size
  };
}
