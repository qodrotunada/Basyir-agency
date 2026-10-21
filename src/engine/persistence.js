import { createInitialState, GAME_SCHEMA_VERSION, validateSavedState } from './game.js';

const CAMPAIGN_KEY = 'basyir-agency:campaign:s1';
const VOCABULARY_KEY = 'basyir-agency:vocabulary:s1';
const EXPORT_SCHEMA_VERSION = 1;

export function sessionKey(caseData) {
  return `basyir-agency:${caseData.caseInfo.id}:save:s${GAME_SCHEMA_VERSION}:c${caseData.contentVersion}`;
}

function preserveLocalRecovery(key, raw) {
  if (!raw) return;
  try {
    window.localStorage.setItem(`basyir-agency:recovery:${key}:${Date.now()}`, raw);
  } catch { /* Preserve a recovery copy when storage capacity allows it. */ }
}

function storageAvailable(storage) {
  try {
    const key = '__basyir_storage_test__';
    storage.setItem(key, '1');
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function loadSession(caseData) {
  const initial = createInitialState(caseData);
  try {
    if (!storageAvailable(window.sessionStorage)) return { state: initial, status: 'storage-failed', blocked: true };
    const currentKey = sessionKey(caseData);
    let foundKey = window.sessionStorage.getItem(currentKey) ? currentKey : null;
    if (!foundKey) {
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith(`basyir-agency:${caseData.caseInfo.id}:save:`)) {
          foundKey = key;
          break;
        }
      }
    }
    if (!foundKey) return { state: initial, status: 'ready', blocked: false };
    const raw = window.sessionStorage.getItem(foundKey);
    if (!raw) return { state: initial, status: 'ready', blocked: false };
    if (foundKey !== currentKey) {
      window.sessionStorage.setItem(`basyir-agency:recovery:${caseData.caseInfo.id}:${Date.now()}`, raw);
      return { state: initial, status: 'version-incompatible', blocked: true };
    }
    const envelope = JSON.parse(raw);
    if (!envelope || envelope.schemaVersion !== GAME_SCHEMA_VERSION || envelope.caseId !== caseData.caseInfo.id || envelope.contentVersion !== caseData.contentVersion) {
      window.sessionStorage.setItem(`basyir-agency:recovery:${caseData.caseInfo.id}:${Date.now()}`, raw);
      return { state: initial, status: 'version-incompatible', blocked: true };
    }
    return { state: validateSavedState(envelope.state, caseData), status: 'saved', blocked: false };
  } catch (error) {
    try {
      const key = sessionKey(caseData);
      const raw = window.sessionStorage.getItem(key);
      if (raw) window.sessionStorage.setItem(`basyir-agency:recovery:${caseData.caseInfo.id}:${Date.now()}`, raw);
    } catch { /* Recovery copy is best effort. */ }
    return { state: initial, status: 'recovery-needed', blocked: true };
  }
}

export function saveSession(state, caseData, blocked = false) {
  if (blocked) return { ok: false, status: 'recovery-needed' };
  try {
    const key = sessionKey(caseData);
    const isCleanIntro = state.phase === 'intro' && state.foundEvidenceIds.length === 0 && state.hintsUsed === 0;
    if (isCleanIntro) {
      window.sessionStorage.removeItem(key);
      return { ok: true, status: 'ready' };
    }
    const persistedState = {
      phase: state.phase,
      foundEvidenceIds: [...state.foundEvidenceIds],
      selectedEvidenceId: state.selectedEvidenceId,
      hintsUsed: state.hintsUsed,
      hintedEvidenceIds: [...state.hintedEvidenceIds],
      puzzleOrder: [...state.puzzleOrder],
      puzzleAttempts: state.puzzleAttempts,
      isPuzzleSolved: state.isPuzzleSolved,
      selectedSuspectId: state.selectedSuspectId,
      verdictAttempts: state.verdictAttempts
    };
    window.sessionStorage.setItem(key, JSON.stringify({
      schemaVersion: GAME_SCHEMA_VERSION,
      contentVersion: caseData.contentVersion,
      caseId: caseData.caseInfo.id,
      savedAt: new Date().toISOString(),
      state: persistedState
    }));
    return { ok: true, status: 'saved' };
  } catch {
    return { ok: false, status: 'storage-failed' };
  }
}

export function resetSession(caseData) {
  try {
    const prefix = `basyir-agency:${caseData.caseInfo.id}:save:`;
    const keys = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((key) => window.sessionStorage.removeItem(key));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function initialCampaignProgress(episodeIds) {
  return {
    schemaVersion: 1,
    campaignId: 'basyir-main',
    episodes: Object.fromEntries(episodeIds.map((id) => [id, {
      caseCompleted: false,
      bestScore: 0,
      latestScore: 0,
      starsEarned: 0,
      bestMasteryScore: 0,
      latestMasteryScore: null,
      attemptCount: 0,
      completedAt: null
    }]))
  };
}

export function loadCampaign(episodeIds) {
  const fallback = initialCampaignProgress(episodeIds);
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== 1 || parsed.campaignId !== 'basyir-main' || !parsed.episodes) { preserveLocalRecovery(CAMPAIGN_KEY, raw); return fallback; }
    const normalized = initialCampaignProgress(episodeIds);
    for (const id of episodeIds) {
      const old = parsed.episodes[id];
      if (!old || typeof old !== 'object') continue;
      normalized.episodes[id] = {
        ...normalized.episodes[id],
        caseCompleted: old.caseCompleted === true,
        bestScore: safeNumber(old.bestScore, 0, 1000),
        latestScore: safeNumber(old.latestScore, 0, 1000),
        starsEarned: safeNumber(old.starsEarned, 0, 3),
        bestMasteryScore: safeNumber(old.bestMasteryScore, 0, 100),
        latestMasteryScore: old.latestMasteryScore === null ? null : safeNumber(old.latestMasteryScore, 0, 100),
        attemptCount: safeNumber(old.attemptCount, 0, 10000),
        completedAt: typeof old.completedAt === 'string' ? old.completedAt : null
      };
    }
    return normalized;
  } catch {
    try { preserveLocalRecovery(CAMPAIGN_KEY, window.localStorage.getItem(CAMPAIGN_KEY)); } catch { /* Ignore storage failure. */ }
    return fallback;
  }
}

function safeNumber(value, min, max) {
  return Number.isSafeInteger(value) ? Math.min(max, Math.max(min, value)) : min;
}

export function saveCampaign(progress) {
  try {
    window.localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function initialVocabularyProgress() {
  return {};
}

export function loadVocabularyProgress() {
  try {
    const raw = window.localStorage.getItem(VOCABULARY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    preserveLocalRecovery(VOCABULARY_KEY, raw);
    return {};
  } catch {
    try { preserveLocalRecovery(VOCABULARY_KEY, window.localStorage.getItem(VOCABULARY_KEY)); } catch { /* Ignore storage failure. */ }
    return {};
  }
}

export function saveVocabularyProgress(progress) {
  try {
    window.localStorage.setItem(VOCABULARY_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function isEpisodeUnlocked(caseData, episodeOrder, campaignProgress) {
  if (!caseData.unlock.prerequisites.length) return true;
  return caseData.unlock.prerequisites.every((id) => {
    const previous = campaignProgress.episodes[id];
    return previous?.caseCompleted === true && (previous.bestMasteryScore ?? 0) >= caseData.unlock.minMastery;
  });
}

export function createExportPayload(campaignProgress, vocabularyProgress, activeSession = null) {
  return {
    exportSchemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    campaignProgress,
    vocabularyProgress,
    activeSession
  };
}

export function validateImportPayload(payload, episodeIds, vocabularyIds) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Berkas bukan objek JSON yang valid.');
  if (payload.exportSchemaVersion !== EXPORT_SCHEMA_VERSION) throw new Error('Versi ekspor tidak didukung. Progres aktif tidak diubah.');
  const campaign = payload.campaignProgress;
  if (!campaign || campaign.schemaVersion !== 1 || campaign.campaignId !== 'basyir-main' || !campaign.episodes) throw new Error('Struktur progres kampanye tidak valid.');
  const normalizedCampaign = initialCampaignProgress(episodeIds);
  for (const id of episodeIds) {
    const row = campaign.episodes[id];
    if (!row) continue;
    const fields = ['bestScore', 'latestScore', 'starsEarned', 'bestMasteryScore', 'attemptCount'];
    for (const field of fields) {
      const value = row[field] ?? 0;
      const max = field === 'bestScore' || field === 'latestScore' ? 1000 : field === 'starsEarned' ? 3 : field === 'bestMasteryScore' ? 100 : 10000;
      if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new Error(`Nilai ${field} pada ${id} tidak valid.`);
    }
    if (row.latestMasteryScore !== null && row.latestMasteryScore !== undefined && (!Number.isSafeInteger(row.latestMasteryScore) || row.latestMasteryScore < 0 || row.latestMasteryScore > 100)) throw new Error(`Nilai mastery pada ${id} tidak valid.`);
    normalizedCampaign.episodes[id] = { ...normalizedCampaign.episodes[id], ...row };
  }
  const vocab = payload.vocabularyProgress;
  if (!vocab || typeof vocab !== 'object' || Array.isArray(vocab)) throw new Error('Struktur kamus tidak valid.');
  const normalizedVocab = {};
  for (const [id, row] of Object.entries(vocab)) {
    if (!vocabularyIds.has(id)) throw new Error(`Kosakata tidak dikenal: ${id}.`);
    if (!row || typeof row !== 'object') throw new Error(`Data kosakata ${id} tidak valid.`);
    for (const field of ['seenCount', 'correctCount', 'incorrectCount', 'retrievalCount']) {
      if (!Number.isSafeInteger(row[field] ?? 0) || (row[field] ?? 0) < 0 || (row[field] ?? 0) > 100000) throw new Error(`Hitungan ${field} pada ${id} tidak valid.`);
    }
    normalizedVocab[id] = row;
  }
  if (payload.activeSession !== null && payload.activeSession !== undefined) {
    const active = payload.activeSession;
    if (!active || !episodeIds.includes(active.caseId) || !active.envelope || active.envelope.caseId !== active.caseId) throw new Error('Snapshot sesi aktif tidak valid.');
  }
  return { campaignProgress: normalizedCampaign, vocabularyProgress: normalizedVocab, activeSession: payload.activeSession ?? null };
}

export function commitImport(imported, oldCampaign, oldVocabulary) {
  const backupKey = `basyir-agency:backup:${Date.now()}`;
  let oldSessions = [];
  try {
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith('basyir-agency:') && key.includes(':save:')) {
        oldSessions.push([key, window.sessionStorage.getItem(key)]);
      }
    }
    window.localStorage.setItem(backupKey, JSON.stringify({
      campaignProgress: oldCampaign,
      vocabularyProgress: oldVocabulary,
      sessionEntries: oldSessions,
      backedUpAt: new Date().toISOString()
    }));
  } catch {
    throw new Error('Backup progres aktif gagal dibuat. Impor dibatalkan.');
  }
  try {
    window.localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(imported.campaignProgress));
    window.localStorage.setItem(VOCABULARY_KEY, JSON.stringify(imported.vocabularyProgress));
    const sessionKeys = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith('basyir-agency:') && key.includes(':save:')) sessionKeys.push(key);
    }
    sessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
    if (imported.activeSession) {
      const active = imported.activeSession;
      window.sessionStorage.setItem(active.key, JSON.stringify(active.envelope));
    }
    return { ok: true, backupKey };
  } catch {
    try {
      window.localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(oldCampaign));
      window.localStorage.setItem(VOCABULARY_KEY, JSON.stringify(oldVocabulary));
      const currentKeys = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith('basyir-agency:') && key.includes(':save:')) currentKeys.push(key);
      }
      currentKeys.forEach((key) => window.sessionStorage.removeItem(key));
      oldSessions.forEach(([key, value]) => { if (value !== null) window.sessionStorage.setItem(key, value); });
    } catch { /* The backup remains available for manual recovery. */ }
    throw new Error('Penulisan impor gagal. Progres lama dipulihkan sejauh penyimpanan mengizinkan.');
  }
}

export function exportSessionFor(caseData, state) {
  if (!state) return null;
  const key = sessionKey(caseData);
  const persistedState = {
    phase: state.phase,
    foundEvidenceIds: [...state.foundEvidenceIds],
    selectedEvidenceId: state.selectedEvidenceId,
    hintsUsed: state.hintsUsed,
    hintedEvidenceIds: [...state.hintedEvidenceIds],
    puzzleOrder: [...state.puzzleOrder],
    puzzleAttempts: state.puzzleAttempts,
    isPuzzleSolved: state.isPuzzleSolved,
    selectedSuspectId: state.selectedSuspectId,
    verdictAttempts: state.verdictAttempts
  };
  return {
    caseId: caseData.caseInfo.id,
    key,
    envelope: { schemaVersion: GAME_SCHEMA_VERSION, contentVersion: caseData.contentVersion, caseId: caseData.caseInfo.id, savedAt: new Date().toISOString(), state: persistedState }
  };
}
