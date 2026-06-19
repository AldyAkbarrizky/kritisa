export type AiChatQuota = {
  limit: number;
  used: number;
  remaining: number;
};

const defaultChatMessageLimit = 8;

export function getAiChatMessageLimit() {
  const configured = Number(process.env.AI_CHAT_MESSAGE_LIMIT ?? "");

  if (!Number.isFinite(configured) || configured < 1) {
    return defaultChatMessageLimit;
  }

  return Math.floor(configured);
}

export function buildAiChatQuota(used: number): AiChatQuota {
  const limit = getAiChatMessageLimit();
  const normalizedUsed = Math.max(0, Math.floor(used));

  return {
    limit,
    used: normalizedUsed,
    remaining: Math.max(limit - normalizedUsed, 0),
  };
}
