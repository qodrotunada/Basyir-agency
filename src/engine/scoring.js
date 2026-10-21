export function computeScore(state, totalEvidence = 5) {
  const evidence = Math.min(totalEvidence, state.foundEvidenceIds?.length ?? 0) * 100;
  const puzzle = state.isPuzzleSolved
    ? Math.max(50, 200 - 50 * ((state.puzzleAttempts ?? 0) - 1))
    : 0;
  const verdict = state.phase === 'case_solved'
    ? Math.max(100, 300 - 100 * ((state.verdictAttempts ?? 0) - 1))
    : 0;
  const hintPenalty = (state.hintsUsed ?? 0) * 25;
  return {
    evidence,
    puzzle,
    verdict,
    hintPenalty,
    total: Math.max(0, evidence + puzzle + verdict - hintPenalty)
  };
}

export function getStars(score, completed = true) {
  if (!completed) return 0;
  if (score >= 850) return 3;
  if (score >= 600) return 2;
  return 1;
}

export function masteryScore(correctCount, total = 10) {
  if (!Number.isFinite(correctCount) || total <= 0) return 0;
  return Math.round(100 * Math.max(0, Math.min(total, correctCount)) / total);
}
