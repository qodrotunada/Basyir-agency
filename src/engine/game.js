export const PHASES = ['intro', 'investigation', 'puzzle', 'suspect_selection', 'case_solved'];
export const GAME_SCHEMA_VERSION = 1;

export function createInitialState(caseData) {
  return {
    phase: 'intro',
    foundEvidenceIds: [],
    selectedEvidenceId: null,
    hintsUsed: 0,
    hintedEvidenceIds: [],
    puzzleOrder: caseData.puzzle.initialOrder.slice(),
    puzzleAttempts: 0,
    isPuzzleSolved: false,
    selectedSuspectId: null,
    verdictAttempts: 0,
    feedback: null,
    feedbackSeq: 0,
    hintTargetId: null,
    hintCooldownActive: false
  };
}

const feedback = (state, kind, message) => ({
  ...state,
  feedback: { kind, message },
  feedbackSeq: (state.feedbackSeq ?? 0) + 1
});

function isAcceptedOrder(order, acceptedOrders) {
  return acceptedOrders.some((accepted) => accepted.length === order.length && accepted.every((id, i) => id === order[i]));
}

export function gameReducer(state, action, caseData) {
  const evidenceIds = caseData.evidence.map((item) => item.id);
  const suspectIds = caseData.suspects.map((item) => item.id);
  switch (action.type) {
    case 'START_GAME':
      if (state.phase !== 'intro') return state;
      return { ...state, phase: 'investigation', feedback: null };
    case 'FIND_EVIDENCE': {
      if (state.phase !== 'investigation' || !evidenceIds.includes(action.id)) return state;
      if (state.foundEvidenceIds.includes(action.id)) return state;
      return feedback({
        ...state,
        foundEvidenceIds: [...state.foundEvidenceIds, action.id],
        selectedEvidenceId: action.id
      }, 'success', 'Bukti berhasil dicatat. Baca petunjuknya dan hubungkan dengan kesaksian lain.');
    }
    case 'SELECT_EVIDENCE':
      if (!evidenceIds.includes(action.id)) return state;
      if (!state.foundEvidenceIds.includes(action.id)) return state;
      return { ...state, selectedEvidenceId: action.id };
    case 'OPEN_PUZZLE':
      if (state.phase !== 'investigation' || state.foundEvidenceIds.length !== evidenceIds.length) return state;
      return { ...state, phase: 'puzzle', feedback: null, selectedEvidenceId: null };
    case 'MOVE_PIECE': {
      if (state.phase !== 'puzzle' || state.isPuzzleSolved) return state;
      const from = action.index;
      const to = from + action.direction;
      if (!Number.isInteger(from) || to < 0 || to >= state.puzzleOrder.length || from < 0 || from >= state.puzzleOrder.length) return state;
      const next = state.puzzleOrder.slice();
      [next[from], next[to]] = [next[to], next[from]];
      return { ...state, puzzleOrder: next, feedback: null };
    }
    case 'SUBMIT_PUZZLE': {
      if (state.phase !== 'puzzle' || state.isPuzzleSolved) return state;
      const attempts = state.puzzleAttempts + 1;
      const correct = isAcceptedOrder(state.puzzleOrder, caseData.puzzle.acceptedOrders);
      if (correct) return feedback({ ...state, puzzleAttempts: attempts, isPuzzleSolved: true }, 'success', 'Susunan tepat. Baca kalimat utuh sebelum melanjutkan ke pemilihan tersangka.');
      return feedback({ ...state, puzzleAttempts: attempts }, 'warning', 'Urutan belum tepat. Periksa hubungan kata, sifat, dan penanda tempat atau waktu.');
    }
    case 'CONTINUE_TO_SUSPECTS':
      if (state.phase !== 'puzzle' || !state.isPuzzleSolved) return state;
      return { ...state, phase: 'suspect_selection', feedback: null };
    case 'SELECT_SUSPECT':
      if (state.phase !== 'suspect_selection' || !suspectIds.includes(action.id)) return state;
      return { ...state, selectedSuspectId: action.id, feedback: null };
    case 'SUBMIT_VERDICT': {
      if (state.phase !== 'suspect_selection' || !state.selectedSuspectId) return state;
      const attempts = state.verdictAttempts + 1;
      const suspect = caseData.suspects.find((item) => item.id === state.selectedSuspectId);
      if (!suspect) return state;
      if (suspect.isGuilty) return feedback({ ...state, verdictAttempts: attempts, phase: 'case_solved' }, 'success', 'Kesimpulan didukung oleh bukti. Kasus berhasil diselesaikan.');
      return feedback({ ...state, verdictAttempts: attempts }, 'warning', 'Alibi ini belum sesuai dengan seluruh bukti. Bandingkan setidaknya dua petunjuk independen.');
    }
    case 'USE_HINT': {
      if (state.phase !== 'investigation') return state;
      if (state.hintCooldownActive || state.hintTargetId !== null) return state;
      if (state.hintsUsed >= 3) return feedback(state, 'info', 'Tiga petunjuk sudah digunakan. Coba periksa daftar target dan papan bukti.');
      const target = evidenceIds.find((id) => !state.foundEvidenceIds.includes(id) && !state.hintedEvidenceIds.includes(id));
      if (!target) return feedback(state, 'info', 'Tidak ada target baru untuk disorot.');
      const targetEvidence = caseData.evidence.find((item) => item.id === target);
      return feedback({
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintedEvidenceIds: [...state.hintedEvidenceIds, target],
        hintTargetId: target,
        hintCooldownActive: true
      }, 'info', targetEvidence?.hintText ?? 'Periksa target yang disorot.');
    }
    case 'CLEAR_HINT':
      return { ...state, hintTargetId: null };
    case 'HINT_COOLDOWN_END':
      return { ...state, hintCooldownActive: false };
    case 'CLEAR_FEEDBACK':
      return { ...state, feedback: null };
    case 'RESET_GAME':
      return createInitialState(caseData);
    default:
      return state;
  }
}

export function validateSavedState(saved, caseData) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('INVALID_STATE');
  if (!PHASES.includes(saved.phase)) throw new Error('INVALID_PHASE');
  const evidenceIds = new Set(caseData.evidence.map((item) => item.id));
  const suspectIds = new Set(caseData.suspects.map((item) => item.id));
  const pieceIds = new Set(caseData.puzzle.pieces.map((item) => item.id));
  const isUniqueSubset = (arr, valid) => Array.isArray(arr) && new Set(arr).size === arr.length && arr.every((id) => typeof id === 'string' && valid.has(id));
  if (!isUniqueSubset(saved.foundEvidenceIds, evidenceIds)) throw new Error('INVALID_EVIDENCE_IDS');
  if (!isUniqueSubset(saved.hintedEvidenceIds ?? [], evidenceIds)) throw new Error('INVALID_HINT_IDS');
  if (!Number.isSafeInteger(saved.hintsUsed) || saved.hintsUsed < 0 || saved.hintsUsed > 3) throw new Error('INVALID_HINT_COUNT');
  if (saved.hintsUsed !== (saved.hintedEvidenceIds ?? []).length) throw new Error('HINT_HISTORY_MISMATCH');
  if (!Number.isSafeInteger(saved.puzzleAttempts) || saved.puzzleAttempts < 0 || !Number.isSafeInteger(saved.verdictAttempts) || saved.verdictAttempts < 0) throw new Error('INVALID_ATTEMPTS');
  if (!Array.isArray(saved.puzzleOrder) || saved.puzzleOrder.length !== pieceIds.size || new Set(saved.puzzleOrder).size !== saved.puzzleOrder.length || !saved.puzzleOrder.every((id) => pieceIds.has(id))) throw new Error('INVALID_PUZZLE_ORDER');
  if (saved.selectedSuspectId !== null && saved.selectedSuspectId !== undefined && !suspectIds.has(saved.selectedSuspectId)) throw new Error('INVALID_SUSPECT');
  if (saved.selectedEvidenceId !== null && saved.selectedEvidenceId !== undefined && !saved.foundEvidenceIds.includes(saved.selectedEvidenceId)) throw new Error('INVALID_SELECTED_EVIDENCE');
  const allFound = saved.foundEvidenceIds.length === evidenceIds.size;
  const accepted = isAcceptedOrder(saved.puzzleOrder, caseData.puzzle.acceptedOrders);
  if (saved.phase === 'intro' && (saved.foundEvidenceIds.length || saved.hintsUsed || saved.puzzleAttempts || saved.verdictAttempts || saved.isPuzzleSolved || saved.selectedSuspectId)) throw new Error('DIRTY_INTRO_STATE');
  if (saved.phase === 'investigation' && (saved.puzzleAttempts !== 0 || saved.isPuzzleSolved || saved.verdictAttempts !== 0 || saved.selectedSuspectId)) throw new Error('INVESTIGATION_INVARIANT');
  if (['puzzle', 'suspect_selection', 'case_solved'].includes(saved.phase) && !allFound) throw new Error('EVIDENCE_PREREQUISITE_MISSING');
  if (['suspect_selection', 'case_solved'].includes(saved.phase) && (!saved.isPuzzleSolved || !accepted)) throw new Error('PUZZLE_PREREQUISITE_MISSING');
  if (saved.phase === 'case_solved') {
    const guilty = caseData.suspects.find((item) => item.isGuilty)?.id;
    if (!guilty || saved.selectedSuspectId !== guilty || saved.verdictAttempts < 1) throw new Error('INVALID_SOLVED_STATE');
  }
  return {
    phase: saved.phase,
    foundEvidenceIds: saved.foundEvidenceIds.slice(),
    selectedEvidenceId: saved.selectedEvidenceId ?? null,
    hintsUsed: saved.hintsUsed,
    hintedEvidenceIds: (saved.hintedEvidenceIds ?? []).slice(),
    puzzleOrder: saved.puzzleOrder.slice(),
    puzzleAttempts: saved.puzzleAttempts,
    isPuzzleSolved: Boolean(saved.isPuzzleSolved),
    selectedSuspectId: saved.selectedSuspectId ?? null,
    verdictAttempts: saved.verdictAttempts,
    feedback: null,
    feedbackSeq: 0,
    hintTargetId: null,
    hintCooldownActive: false
  };
}
