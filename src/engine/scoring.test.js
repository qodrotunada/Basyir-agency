import { describe, expect, it } from 'vitest';
import { computeScore, getStars, masteryScore } from './scoring.js';

describe('scoring', () => {
  it('awards 1,000 points and three stars on a clean solve', () => {
    const result = computeScore({
      phase: 'case_solved', foundEvidenceIds: ['a','b','c','d','e'],
      isPuzzleSolved: true, puzzleAttempts: 1, verdictAttempts: 1, hintsUsed: 0
    });
    expect(result).toEqual({ evidence: 500, puzzle: 200, verdict: 300, hintPenalty: 0, total: 1000 });
    expect(getStars(result.total, true)).toBe(3);
  });

  it('matches the required 825-point example', () => {
    const result = computeScore({
      phase: 'case_solved', foundEvidenceIds: ['a','b','c','d','e'],
      isPuzzleSolved: true, puzzleAttempts: 2, verdictAttempts: 2, hintsUsed: 1
    });
    expect(result.total).toBe(825);
    expect(getStars(result.total, true)).toBe(2);
  });

  it('does not award final stars before case completion', () => {
    expect(getStars(1000, false)).toBe(0);
  });

  it('calculates checkpoint mastery out of ten equal items', () => {
    expect(masteryScore(7, 10)).toBe(70);
    expect(masteryScore(6, 10)).toBe(60);
  });
});
