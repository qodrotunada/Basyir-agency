import { describe, expect, it } from 'vitest';
import { CAMPAIGN_CONFIG, CASES_CONFIG, VOCABULARY_REGISTRY } from '../data/campaign.js';
import { validateCampaignConfig } from './configValidator.js';

describe('campaign configuration', () => {
  it('has four episodes with five evidence items and ten checkpoint questions each', () => {
    expect(validateCampaignConfig(CAMPAIGN_CONFIG, CASES_CONFIG, VOCABULARY_REGISTRY)).toEqual([]);
  });
});
