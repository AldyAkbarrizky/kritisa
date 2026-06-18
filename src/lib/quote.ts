const MIN_QUOTE_LENGTH = 70;
const MAX_QUOTE_LENGTH = 260;

function cleanSentence(value: string) {
  return value.replace(/\s+/g, " ").replace(/^["'“”]+|["'“”]+$/g, "").trim();
}

export function getQuoteCandidates(content: string) {
  const sentences = content
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanSentence)
    .filter((sentence) => sentence.length >= MIN_QUOTE_LENGTH);

  if (sentences.length > 0) {
    return sentences.map((sentence) =>
      sentence.length > MAX_QUOTE_LENGTH
        ? `${sentence.slice(0, MAX_QUOTE_LENGTH).trim()}...`
        : sentence,
    );
  }

  const paragraph = cleanSentence(content);
  if (paragraph.length >= 30) {
    return [
      paragraph.length > MAX_QUOTE_LENGTH
        ? `${paragraph.slice(0, MAX_QUOTE_LENGTH).trim()}...`
        : paragraph,
    ];
  }

  return [];
}

export function selectRandomQuote(content: string) {
  const candidates = getQuoteCandidates(content);

  if (candidates.length === 0) {
    return "";
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function selectStableQuote(content: string) {
  return getQuoteCandidates(content)[0] ?? "";
}

export const quoteFallbackMessage =
  "Cerpen ini belum memiliki kutipan yang cukup panjang untuk dikritisi otomatis.";
