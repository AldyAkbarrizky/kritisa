const MIN_QUOTE_LENGTH = 250;
const MAX_QUOTE_LENGTH = 900;
const MIN_PARAGRAPHS = 1;
const MAX_PARAGRAPHS = 3;

function cleanParagraph(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^["'""]+|["'""]+$/g, "")
    .trim();
}

export function getQuoteCandidates(content: string) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map(cleanParagraph)
    .filter((p) => p.length >= 30);

  if (paragraphs.length === 0) {
    const fallback = cleanParagraph(content);
    if (fallback.length >= 30) {
      return [
        fallback.length > MAX_QUOTE_LENGTH
          ? `${fallback.slice(0, MAX_QUOTE_LENGTH).trim()}...`
          : fallback,
      ];
    }
    return [];
  }

  const chunks: string[] = [];

  for (let start = 0; start < paragraphs.length; start++) {
    for (let size = MIN_PARAGRAPHS; size <= MAX_PARAGRAPHS; size++) {
      const slice = paragraphs.slice(start, start + size);
      if (slice.length < MIN_PARAGRAPHS) continue;

      let quote = slice.join("\n\n");
      if (quote.length > MAX_QUOTE_LENGTH) {
        quote = `${quote.slice(0, MAX_QUOTE_LENGTH).trim()}...`;
      }

      if (quote.length >= MIN_QUOTE_LENGTH) {
        chunks.push(quote);
      }
    }
  }

  return [...new Set(chunks)];
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
