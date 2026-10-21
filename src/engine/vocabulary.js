function blankRow(episodeId) {
  const now = new Date().toISOString();
  return {
    seenCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    retrievalCount: 0,
    encounteredEpisodeIds: episodeId ? [episodeId] : [],
    recentResponses: [],
    firstSeenAt: null,
    lastPracticedAt: null,
    masteryStatus: 'new',
    createdAt: now
  };
}

export function recordVocabularySeen(progress, vocabId, episodeId) {
  if (!vocabId) return progress;
  const current = progress[vocabId] ? { ...progress[vocabId] } : blankRow(episodeId);
  current.seenCount = (current.seenCount ?? 0) + 1;
  current.firstSeenAt = current.firstSeenAt ?? new Date().toISOString();
  current.encounteredEpisodeIds = [...new Set([...(current.encounteredEpisodeIds ?? []), episodeId])];
  if (current.masteryStatus === 'new') current.masteryStatus = 'learning';
  return { ...progress, [vocabId]: current };
}

export function recordVocabularyResponse(progress, vocabId, episodeId, correct, mode = 'checkpoint') {
  if (!vocabId) return progress;
  const current = progress[vocabId] ? { ...progress[vocabId] } : blankRow(episodeId);
  const now = new Date().toISOString();
  current.correctCount = (current.correctCount ?? 0) + (correct ? 1 : 0);
  current.incorrectCount = (current.incorrectCount ?? 0) + (correct ? 0 : 1);
  current.retrievalCount = (current.retrievalCount ?? 0) + 1;
  current.lastPracticedAt = now;
  current.firstSeenAt = current.firstSeenAt ?? now;
  current.encounteredEpisodeIds = [...new Set([...(current.encounteredEpisodeIds ?? []), episodeId])];
  current.recentResponses = [...(current.recentResponses ?? []), { mode, correct: Boolean(correct), at: now }].slice(-5);
  const recent = current.recentResponses;
  const recentRate = recent.filter((item) => item.correct).length / Math.max(1, recent.length);
  if (current.retrievalCount >= 3 && recentRate >= 0.8) current.masteryStatus = 'mastered';
  else if (current.retrievalCount >= 2 && recentRate < 0.6) current.masteryStatus = 'review';
  else current.masteryStatus = 'learning';
  return { ...progress, [vocabId]: current };
}

export function vocabularyStats(progress, registry) {
  const rows = Object.keys(registry).map((id) => ({ id, ...registry[id], ...(progress[id] ?? {}) }));
  return {
    total: rows.length,
    seen: rows.filter((row) => (row.seenCount ?? 0) > 0).length,
    mastered: rows.filter((row) => row.masteryStatus === 'mastered').length,
    review: rows.filter((row) => row.masteryStatus === 'review').length,
    rows
  };
}
