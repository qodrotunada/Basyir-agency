import { describe, expect, it } from 'vitest';
import { CASES_CONFIG, ALL_EPISODE_IDS } from '../data/campaign.js';
import { createInitialState, gameReducer } from './game.js';
import { initialCampaignProgress, isEpisodeUnlocked } from './persistence.js';

const caseData = CASES_CONFIG['ep01-library'];

describe('game reducer contracts', () => {
  it('ignores evidence actions outside the investigation phase', () => {
    const initial = createInitialState(caseData);
    const next = gameReducer(initial, { type: 'FIND_EVIDENCE', id: 'key' }, caseData);
    expect(next).toBe(initial);
  });

  it('records each evidence ID once', () => {
    let state = gameReducer(createInitialState(caseData), { type: 'START_GAME' }, caseData);
    state = gameReducer(state, { type: 'FIND_EVIDENCE', id: 'key' }, caseData);
    const once = state;
    state = gameReducer(state, { type: 'FIND_EVIDENCE', id: 'key' }, caseData);
    expect(state.foundEvidenceIds).toEqual(['key']);
    expect(state).toBe(once);
  });

  it('does not open the puzzle before all five evidence items are found', () => {
    let state = gameReducer(createInitialState(caseData), { type: 'START_GAME' }, caseData);
    state = gameReducer(state, { type: 'FIND_EVIDENCE', id: 'key' }, caseData);
    expect(gameReducer(state, { type: 'OPEN_PUZZLE' }, caseData).phase).toBe('investigation');
  });

  it('unlocks episode two only after completion and mastery >= 70', () => {
    const campaign = initialCampaignProgress(ALL_EPISODE_IDS);
    expect(isEpisodeUnlocked(CASES_CONFIG['ep02-lab'], ALL_EPISODE_IDS, campaign)).toBe(false);
    campaign.episodes['ep01-library'].caseCompleted = true;
    campaign.episodes['ep01-library'].bestMasteryScore = 60;
    expect(isEpisodeUnlocked(CASES_CONFIG['ep02-lab'], ALL_EPISODE_IDS, campaign)).toBe(false);
    campaign.episodes['ep01-library'].bestMasteryScore = 70;
    expect(isEpisodeUnlocked(CASES_CONFIG['ep02-lab'], ALL_EPISODE_IDS, campaign)).toBe(true);
  });
});
