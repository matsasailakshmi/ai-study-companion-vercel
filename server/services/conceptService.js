const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/*
  ---------------------------------------------------------
  Detect Gemini quota / rate-limit errors
  ---------------------------------------------------------
*/
const isGeminiQuotaError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("resource exhausted") ||
    message.includes("rate limit") ||
    message.includes("free tier") ||
    message.includes("too many requests")
  );
};

/*
  ---------------------------------------------------------
  Clean concept name
  ---------------------------------------------------------

  Examples:

  "1.1 Introduction"
        -> "Introduction"

  "1.2 Meaning of an Economy"
        -> "Meaning of an Economy"

  "UNIT 1 National Income"
        -> "National Income"
  ---------------------------------------------------------
*/
const cleanConceptName = (name) => {
  if (typeof name !== "string") {
    return "";
  }

  let cleaned = name
    .replace(/\s+/g, " ")
    .replace(/^[-•*]\s*/, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  /*
    Remove section numbering.

    Examples:
    1.1
    1.2
    2.3.1
    10.4
  */
  cleaned = cleaned.replace(/^\d+(?:\.\d+)+\s*[-:.]?\s*/i, "");

  /*
    Remove common UNIT numbering.

    Example:
    "UNIT 1 NATIONAL INCOME"
      -> "NATIONAL INCOME"
  */
  cleaned = cleaned.replace(/^unit\s+\d+(?:\.\d+)*\s*[-:.]?\s*/i, "");

  /*
    Remove standalone "UNIT" if it remains.
  */
  cleaned = cleaned.replace(/^unit\s*[-:.]?\s*/i, "");

  return cleaned.trim();
};

/*
  ---------------------------------------------------------
  Clean description
  ---------------------------------------------------------
*/
const cleanDescription = (description) => {
  if (typeof description !== "string") {
    return "";
  }

  return description.replace(/\s+/g, " ").trim();
};

/*
  ---------------------------------------------------------
  Validate concept name
  ---------------------------------------------------------
*/
const isValidConceptName = (name) => {
  if (!name) {
    return false;
  }

  /*
    Reject incomplete concepts.

    Examples:
      "National Income and"
      "Meaning of"
      "Introduction to"
  */
  const lastWord = name
    .split(/\s+/)
    .filter(Boolean)
    .pop()
    ?.toLowerCase()
    .replace(/[.,;:!?]+$/, "");

  const incompleteEndingWords = new Set([
    "and",
    "or",
    "the",
    "of",
    "to",
    "in",
    "for",
    "with",
    "from",
    "on",
    "by",
    "as",
    "at",
    "a",
    "an",
  ]);

  if (incompleteEndingWords.has(lastWord)) {
    return false;
  }

  const words = name.split(/\s+/).filter(Boolean);

  /*
    Concept names should normally be short.
  */
  if (words.length < 1 || words.length > 7) {
    return false;
  }

  /*
    Reject names that look like sentences.
  */
  const lower = name.toLowerCase();

  const sentenceIndicators = [
    "the ",
    "this ",
    "these ",
    "those ",
    "which ",
    "that ",
    "who ",
    "where ",
    "when ",
    "while ",
    "because ",
    "constituted ",
    "refers to ",
    "used in ",
    "defined as ",
    "is defined ",
    "are defined ",
    "can be ",
    "should be ",
    "has been ",
    "have been ",
    "according to ",
  ];

  if (sentenceIndicators.some((indicator) => lower.startsWith(indicator))) {
    return false;
  }

  /*
    Reject complete sentences.
  */
  if (/[.!?]$/.test(name)) {
    return false;
  }

  /*
    Reject excessive punctuation.
  */
  const punctuationCount = (name.match(/[,:;()[\]{}]/g) || []).length;

  if (punctuationCount > 2) {
    return false;
  }

  /*
    Common stop words.
  */
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "from",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "by",
    "as",
    "that",
    "this",
    "these",
    "those",
    "which",
    "their",
    "they",
    "it",
  ]);

  const stopWordCount = words.filter((word) =>
    stopWords.has(word.toLowerCase().replace(/[^\w]/g, "")),
  ).length;

  if (words.length >= 4 && stopWordCount / words.length > 0.55) {
    return false;
  }

  /*
    Reject lowercase sentence fragments.
  */
  const alphabeticCharacters = name.match(/[A-Za-z]/g) || [];

  if (alphabeticCharacters.length >= 5) {
    const uppercaseCharacters = name.match(/[A-Z]/g) || [];

    const uppercaseRatio =
      uppercaseCharacters.length / alphabeticCharacters.length;

    if (
      words.length >= 5 &&
      uppercaseRatio === 0 &&
      /\b(the|and|of|to|in|for|from|with|on|is|are)\b/i.test(name)
    ) {
      return false;
    }
  }

  return true;
};

/*
  ---------------------------------------------------------
  Remove duplicate concepts
  ---------------------------------------------------------
*/
const removeDuplicateConcepts = (concepts) => {
  const seen = new Set();
  const result = [];

  for (const concept of concepts) {
    const normalized = concept.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized) {
      continue;
    }

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(concept);
  }

  return result;
};

/*
  ---------------------------------------------------------
  Fallback concept extraction
  ---------------------------------------------------------
*/
const createFallbackConcepts = ({ chunks, numberOfConcepts }) => {
  const candidates = [];

  for (const chunk of chunks) {
    const text = String(chunk?.text || "");

    if (!text.trim()) {
      continue;
    }

    const lines = text
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const line of lines) {
      const cleanedName = cleanConceptName(line);
      const words = cleanedName.split(/\s+/);

      if (
        words.length >= 1 &&
        words.length <= 7 &&
        !/[.!?]$/.test(cleanedName) &&
        isValidConceptName(cleanedName)
      ) {
        candidates.push({
          name: cleanedName,
          description: `Important topic discussed in ${
            chunk.metadata?.sourceFileName || "the learning material"
          }.`,
        });
      }
    }
  }

  let concepts = removeDuplicateConcepts(candidates);

  /*
    Safe generic fallback.
  */
  if (concepts.length === 0) {
    const fallbackNames = [
      "Main Topic",
      "Key Concepts",
      "Important Definitions",
      "Core Principles",
      "Applications",
    ];

    concepts = fallbackNames.map((name) => ({
      name,
      description: "A key area covered in the learning material.",
    }));
  }

  return concepts.slice(0, numberOfConcepts);
};

/*
  ---------------------------------------------------------
  Main concept extraction
  ---------------------------------------------------------
*/
const extractConcepts = async ({ chunks, numberOfConcepts = 10 }) => {
  if (!chunks || chunks.length === 0) {
    throw new Error(
      "No learning material is available for concept extraction.",
    );
  }

  const context = chunks
    .map((chunk, index) => {
      return `
SOURCE ${index + 1}

File:
${chunk.metadata?.sourceFileName || "Unknown"}

Chunk:
${chunk.chunkIndex}

Content:
${chunk.text}
`;
    })
    .join("\n--------------------\n");

  const prompt = `
You are an AI learning assistant helping a student understand a study document.

Analyze ONLY the learning material provided below.

Identify the ${numberOfConcepts} most important STUDY CONCEPTS.

A concept must represent a real topic, principle, theory, method, process,
definition, formula, system, classification, or important idea that a student
can learn and be assessed on.

GOOD CONCEPT NAMES:

- Supply and Demand
- Unorganised Sector
- Organised Sector
- Labour Force
- Employment
- Informal Employment
- Gross Domestic Product
- Digital Modulation
- Sampling Theorem
- Fourier Transform
- CMOS Inverter
- National Income
- Meaning of an Economy

BAD CONCEPT NAMES:

- "Commission, constituted a Task Force to examine definitional and statistical"
- "aged in the sale and production of goods and"
- "e employers and the workers"
- "the other hand, the unorganised sector refers"
- "according to the report"
- "this concept is important"
- "the process of"
- "and other related"
- "UNIT 1 NATIONAL INCOME AND THE"

IMPORTANT RULES:

1. Use ONLY information present in the supplied material.
2. Extract actual STUDY TOPICS, not sentences.
3. Do NOT copy a sentence or sentence fragment.
4. Do NOT return incomplete phrases.
5. Do NOT return text ending with "and", "or", "of", "to", "in", "for", "with".
6. Do NOT return unnecessary section numbering.
7. Do NOT return paragraph text as a concept.
8. Do NOT return explanations as concept names.
9. Concept names should normally contain 1 to 5 words.
10. Concept names must be concise and student-friendly.
11. Prefer meaningful section headings and clearly defined topics.
12. Avoid duplicate or nearly identical concepts.
13. Every concept should be suitable as a quiz topic.
14. Give a short description for every concept.
15. Return at most ${numberOfConcepts} concepts.
16. Return ONLY valid JSON.
17. Do not include markdown or code fences.

Required JSON format:

{
  "concepts": [
    {
      "name": "National Income",
      "description": "The concept of income generated by an economy during a specific period."
    }
  ]
}

LEARNING MATERIAL:

${context}
`;

  let response = null;

  /*
    -------------------------------------------------------
    Call Gemini
    -------------------------------------------------------
  */
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Concept extraction Gemini attempt ${attempt}/3`);

      response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",

        contents: prompt,

        config: {
          responseMimeType: "application/json",
        },
      });

      break;
    } catch (error) {
      console.error(
        `Concept extraction attempt ${attempt} failed:`,
        error.message,
      );

      /*
        Don't retry quota errors.
      */
      if (isGeminiQuotaError(error)) {
        console.log(
          "Gemini quota unavailable. Using local concept extraction fallback.",
        );

        return createFallbackConcepts({
          chunks,
          numberOfConcepts,
        });
      }

      const isTemporaryError =
        error.message?.includes("503") ||
        error.message?.includes("UNAVAILABLE") ||
        error.message?.includes("high demand") ||
        error.message?.includes("temporarily");

      if (!isTemporaryError || attempt === 3) {
        console.log("Gemini concept extraction failed. Using local fallback.");

        return createFallbackConcepts({
          chunks,
          numberOfConcepts,
        });
      }

      const waitTime = attempt * 2000;

      console.log(
        `Temporary Gemini error. Retrying in ${waitTime / 1000} seconds...`,
      );

      await sleep(waitTime);
    }
  }

  /*
    -------------------------------------------------------
    Parse Gemini response
    -------------------------------------------------------
  */
  const responseText = response?.text || "";

  if (!responseText.trim()) {
    console.log("Gemini returned an empty response. Using fallback.");

    return createFallbackConcepts({
      chunks,
      numberOfConcepts,
    });
  }

  let result;

  try {
    result = JSON.parse(responseText);
  } catch (error) {
    console.error("Failed to parse Gemini concept response:");

    console.error(responseText);

    console.log("Using local concept extraction fallback.");

    return createFallbackConcepts({
      chunks,
      numberOfConcepts,
    });
  }

  if (!result || !Array.isArray(result.concepts)) {
    console.log(
      "Gemini did not return a valid concepts array. Using fallback.",
    );

    return createFallbackConcepts({
      chunks,
      numberOfConcepts,
    });
  }

  /*
    -------------------------------------------------------
    Clean and validate Gemini concepts
    -------------------------------------------------------
  */
  const concepts = result.concepts
    .map((concept) => {
      const name = cleanConceptName(concept?.name);

      const description = cleanDescription(concept?.description);

      return {
        name,
        description,
      };
    })
    .filter((concept) => {
      if (!concept.name) {
        return false;
      }

      if (!concept.description) {
        return false;
      }

      return isValidConceptName(concept.name);
    });

  /*
    Remove duplicates after cleaning.
  */
  const uniqueConcepts = removeDuplicateConcepts(concepts);

  /*
    If Gemini returned too few valid concepts,
    use fallback.
  */
  if (uniqueConcepts.length < 3) {
    console.log(
      `Only ${uniqueConcepts.length} valid Gemini concepts found. Using fallback concepts.`,
    );

    return createFallbackConcepts({
      chunks,
      numberOfConcepts,
    });
  }

  return uniqueConcepts.slice(0, numberOfConcepts);
};

module.exports = {
  extractConcepts,
};
