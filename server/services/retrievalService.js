const KnowledgeChunk = require("../models/KnowledgeChunk");

const stopWords = new Set([
  "what",
  "is",
  "are",
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "for",
  "and",
  "or",
  "how",
  "why",
  "does",
  "do",
  "can",
  "be",
  "with",
  "from",
  "this",
  "that",
  "it",
  "about",
]);

const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
};

const calculateScore = (queryWords, chunkText) => {
  const chunkWords = tokenize(chunkText);

  if (chunkWords.length === 0) {
    return 0;
  }

  let score = 0;

  for (const queryWord of queryWords) {
    const matches = chunkWords.filter((word) => word === queryWord).length;

    score += matches;
  }

  return score;
};

const retrieveRelevantChunks = async ({
  projectId,
  userId,
  query,
  limit = 5,
}) => {
  const queryWords = tokenize(query);

  if (queryWords.length === 0) {
    return [];
  }

  const chunks = await KnowledgeChunk.find({
    projectId,
    userId,
  }).lean();

  const scoredChunks = chunks
    .map((chunk) => ({
      ...chunk,
      score: calculateScore(queryWords, chunk.text),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.chunkIndex - b.chunkIndex;
    })
    .slice(0, limit);

  return scoredChunks;
};

module.exports = {
  retrieveRelevantChunks,
};
