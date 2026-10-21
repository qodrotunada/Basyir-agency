export function validateCampaignConfig(campaignConfig, cases, vocabularyRegistry) {
  const errors = [];
  const episodeOrder = campaignConfig.episodeOrder;
  if (!Array.isArray(episodeOrder) || episodeOrder.length !== 4) errors.push('CAMPAIGN_MUST_HAVE_FOUR_EPISODES');
  if (new Set(episodeOrder).size !== episodeOrder.length) errors.push('DUPLICATE_EPISODE_ID');
  const knownEpisodes = new Set(episodeOrder);
  const indexById = new Map(episodeOrder.map((id, index) => [id, index]));

  for (const episodeId of episodeOrder) {
    const data = cases[episodeId];
    if (!data) { errors.push(`MISSING_CASE:${episodeId}`); continue; }
    if (data.caseInfo.id !== episodeId) errors.push(`CASE_ID_MISMATCH:${episodeId}`);
    if (!data.contentVersion) errors.push(`MISSING_CONTENT_VERSION:${episodeId}`);
    if (data.evidence.length !== 5) errors.push(`EXPECTED_FIVE_EVIDENCE:${episodeId}`);
    if (data.suspects.filter((item) => item.isGuilty).length !== 1) errors.push(`GUILTY_COUNT:${episodeId}`);
    if (data.mastery.length !== 10) errors.push(`EXPECTED_TEN_MASTERY_ITEMS:${episodeId}`);

    const evidenceIds = data.evidence.map((item) => item.id);
    if (new Set(evidenceIds).size !== evidenceIds.length) errors.push(`DUPLICATE_EVIDENCE:${episodeId}`);
    for (const item of data.evidence) {
      if (!vocabularyRegistry[item.vocabularyId]) errors.push(`MISSING_VOCAB:${episodeId}:${item.id}`);
      for (const axis of ['left', 'top']) {
        const value = item.hotspot?.[axis];
        if (typeof value !== 'number' || value < 0 || value > 100) errors.push(`INVALID_HOTSPOT:${episodeId}:${item.id}:${axis}`);
      }
    }

    const suspectIds = data.suspects.map((item) => item.id);
    if (new Set(suspectIds).size !== suspectIds.length) errors.push(`DUPLICATE_SUSPECT:${episodeId}`);
    const pieceIds = data.puzzle.pieces.map((item) => item.id);
    const pieceSet = new Set(pieceIds);
    if (pieceSet.size !== pieceIds.length) errors.push(`DUPLICATE_PIECE:${episodeId}`);
    const validPermutation = (order) => Array.isArray(order) && order.length === pieceSet.size && new Set(order).size === order.length && order.every((id) => pieceSet.has(id));
    if (!validPermutation(data.puzzle.initialOrder)) errors.push(`INVALID_INITIAL_ORDER:${episodeId}`);
    for (const order of data.puzzle.acceptedOrders) if (!validPermutation(order)) errors.push(`INVALID_ACCEPTED_ORDER:${episodeId}`);
    if (data.puzzle.acceptedOrders.some((order) => order.every((id, index) => id === data.puzzle.initialOrder[index]))) errors.push(`INITIAL_ORDER_ALREADY_SOLVED:${episodeId}`);

    for (const vocabId of data.curriculum.coreVocabIds) if (!vocabularyRegistry[vocabId]) errors.push(`MISSING_CORE_VOCAB:${episodeId}:${vocabId}`);
    for (const question of data.mastery) {
      if (!Array.isArray(question.options) || question.options.length < 2 || !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length) errors.push(`INVALID_MASTERY_ITEM:${episodeId}:${question.id}`);
      if (question.vocabularyId && !vocabularyRegistry[question.vocabularyId]) errors.push(`MISSING_QUESTION_VOCAB:${episodeId}:${question.id}`);
    }
    for (const prerequisite of data.unlock.prerequisites) {
      if (!knownEpisodes.has(prerequisite)) errors.push(`UNKNOWN_PREREQUISITE:${episodeId}:${prerequisite}`);
      else if (indexById.get(prerequisite) >= indexById.get(episodeId)) errors.push(`PREREQUISITE_ORDER:${episodeId}:${prerequisite}`);
    }
  }
  return errors;
}
