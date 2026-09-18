const fs = require("fs");
const { PDFParse } = require("pdf-parse");

const Material = require("../models/Material");
const KnowledgeChunk = require("../models/KnowledgeChunk");
const Concept = require("../models/Concept");

const { extractConcepts } = require("../services/conceptService");
const { createActivity } = require("../services/activityService");

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

/*
=====================================================
SPLIT TEXT INTO OVERLAPPING CHUNKS
=====================================================
*/

const createChunks = (text) => {
  const cleanedText = text
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanedText) {
    return [];
  }

  const chunks = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < cleanedText.length) {
    const end = Math.min(start + CHUNK_SIZE, cleanedText.length);

    const chunkText = cleanedText.slice(start, end).trim();

    if (chunkText) {
      chunks.push({
        text: chunkText,
        chunkIndex,
      });

      chunkIndex++;
    }

    if (end >= cleanedText.length) {
      break;
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
};

/*
=====================================================
CLEAN TEXT
=====================================================
*/

const cleanText = (text) => {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
};

/*
=====================================================
CHECK WHETHER A STRING IS A USEFUL CONCEPT
=====================================================
*/

const isUsefulConceptName = (name) => {
  if (!name) {
    return false;
  }

  const cleaned = cleanText(name);

  if (cleaned.length < 3 || cleaned.length > 100) {
    return false;
  }

  /*
  Reject obvious PDF artifacts.
  */

  const lower = cleaned.toLowerCase();

  const invalidPatterns = [
    "................",
    "........................",
    "................................",
    "contents",
    "objectives",
    "structure",
  ];

  if (invalidPatterns.some((pattern) => lower.includes(pattern))) {
    return false;
  }

  /*
  Reject names that are mostly punctuation.
  */

  const letters = cleaned.match(/[a-zA-Z]/g) || [];

  if (letters.length < 4) {
    return false;
  }

  return true;
};

/*
=====================================================
EXTRACT A POSSIBLE HEADING FROM A CHUNK
=====================================================

This is only used when Gemini is unavailable.

We try to find actual heading-like lines instead of
blindly taking the first six words.
=====================================================
*/

const findHeadingFromChunk = (text) => {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const cleaned = cleanText(line);

    if (!isUsefulConceptName(cleaned)) {
      continue;
    }

    /*
    Skip lines that are clearly long paragraphs.
    */

    if (cleaned.length > 80) {
      continue;
    }

    /*
    Skip lines ending in punctuation typical of sentences.
    */

    if (/[.!?,;:]$/.test(cleaned)) {
      continue;
    }

    /*
    Avoid lines containing too many words.
    */

    const wordCount = cleaned.split(/\s+/).length;

    if (wordCount > 10) {
      continue;
    }

    return cleaned;
  }

  return null;
};

/*
=====================================================
CREATE FALLBACK CONCEPTS
=====================================================

When Gemini is unavailable, create reasonable concept
names from heading-like text.

We DO NOT use:

"Topic 1: first six words..."

because that creates bad concept names.
=====================================================
*/

const createFallbackConcepts = (chunks) => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return [];
  }

  const concepts = [];
  const usedNames = new Set();

  /*
  -----------------------------------------------------
  First pass:
  Find heading-like lines.
  -----------------------------------------------------
  */

  for (const chunk of chunks) {
    if (concepts.length >= 10) {
      break;
    }

    const heading = findHeadingFromChunk(chunk.text);

    if (!heading) {
      continue;
    }

    const normalizedName = heading.toLowerCase();

    if (usedNames.has(normalizedName)) {
      continue;
    }

    usedNames.add(normalizedName);

    concepts.push({
      name: heading,
      description: cleanText(chunk.text).slice(0, 500),
    });
  }

  /*
  -----------------------------------------------------
  Second pass:
  If not enough headings were found, use meaningful
  sentences as fallback descriptions but create a
  cleaner generic concept name.
  -----------------------------------------------------
  */

  if (concepts.length < 5) {
    for (const chunk of chunks) {
      if (concepts.length >= 10) {
        break;
      }

      const cleaned = cleanText(chunk.text);

      if (!cleaned) {
        continue;
      }

      /*
      Extract a short phrase from the beginning, but
      do not label it as "Topic X".
      */

      const sentences = cleaned
        .split(/[.!?]/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      for (const sentence of sentences) {
        if (sentence.length < 20 || sentence.length > 100) {
          continue;
        }

        const words = sentence.split(/\s+/);

        if (words.length < 3 || words.length > 12) {
          continue;
        }

        const conceptName = sentence;

        if (!isUsefulConceptName(conceptName)) {
          continue;
        }

        const normalizedName = conceptName.toLowerCase();

        if (usedNames.has(normalizedName)) {
          continue;
        }

        usedNames.add(normalizedName);

        concepts.push({
          name: conceptName,
          description: cleaned.slice(0, 500),
        });

        break;
      }
    }
  }

  return concepts.slice(0, 10);
};

/*
=====================================================
CHECK GEMINI QUOTA / RATE LIMIT ERROR
=====================================================
*/

const isGeminiQuotaError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  return (
    error?.status === 429 ||
    error?.code === 429 ||
    message.includes("429") ||
    message.includes("quota exceeded") ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit") ||
    message.includes("free_tier")
  );
};

/*
=====================================================
SAVE CONCEPTS WITHOUT DESTROYING EXISTING MASTERY
=====================================================

If the same concept already exists, preserve its:

- masteryScore
- attempts
- correctAnswers
- incorrectAnswers
- lastAssessedAt

This is important because reprocessing a PDF should not
erase the student's learning history.
=====================================================
*/

const saveConcepts = async ({ userId, projectId, extractedConcepts }) => {
  const savedConcepts = [];

  for (const concept of extractedConcepts) {
    const name = cleanText(concept.name);

    if (!isUsefulConceptName(name)) {
      continue;
    }

    const existingConcept = await Concept.findOne({
      userId,
      projectId,
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });

    if (existingConcept) {
      /*
      Update description but preserve mastery.
      */

      existingConcept.description =
        concept.description || existingConcept.description || "";

      await existingConcept.save();

      savedConcepts.push(existingConcept);

      continue;
    }

    const newConcept = await Concept.create({
      userId,
      projectId,

      name,

      description: concept.description || "",

      masteryScore: 0,
      attempts: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      lastAssessedAt: null,
    });

    savedConcepts.push(newConcept);
  }

  return savedConcepts;
};

/*
=====================================================
ESCAPE REGEX SPECIAL CHARACTERS
=====================================================
*/

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/*
=====================================================
PROCESS ONE MATERIAL
=====================================================
*/

const processMaterial = async (material) => {
  let parser = null;

  try {
    console.log(`Processing material: ${material._id}`);

    /*
    -------------------------------------------------
    Mark as processing
    -------------------------------------------------
    */

    material.status = "processing";
    material.error = "";

    await material.save();

    /*
    -------------------------------------------------
    Check uploaded PDF
    -------------------------------------------------
    */

    if (!fs.existsSync(material.filePath)) {
      throw new Error("Uploaded PDF file not found");
    }

    /*
    -------------------------------------------------
    Read PDF
    -------------------------------------------------
    */

    const pdfBuffer = fs.readFileSync(material.filePath);

    /*
    -------------------------------------------------
    Extract PDF text
    -------------------------------------------------
    */

    parser = new PDFParse({
      data: pdfBuffer,
    });

    const pdfData = await parser.getText();

    const extractedText = pdfData.text || "";
    const pageCount = pdfData.total || 0;

    material.extractedText = extractedText;
    material.pageCount = pageCount;

    await material.save();

    console.log(
      `Extracted ${extractedText.length} characters from ${material.fileName}`,
    );

    /*
    -------------------------------------------------
    Remove old chunks for this material
    -------------------------------------------------
    */

    await KnowledgeChunk.deleteMany({
      materialId: material._id,
    });

    /*
    -------------------------------------------------
    Create knowledge chunks
    -------------------------------------------------
    */

    const chunks = createChunks(extractedText);

    if (chunks.length === 0) {
      throw new Error("No readable text found in the PDF");
    }

    /*
    -------------------------------------------------
    Prepare MongoDB chunk documents
    -------------------------------------------------
    */

    const knowledgeChunks = chunks.map((chunk) => ({
      userId: material.userId,

      projectId: material.projectId,

      materialId: material._id,

      text: chunk.text,

      chunkIndex: chunk.chunkIndex,

      pageNumber: null,

      metadata: {
        sourceFileName: material.fileName,
      },
    }));

    /*
    -------------------------------------------------
    Store knowledge chunks
    -------------------------------------------------
    */

    await KnowledgeChunk.insertMany(knowledgeChunks);

    console.log(`Created ${knowledgeChunks.length} knowledge chunks`);

    /*
    =================================================
    AUTOMATIC CONCEPT EXTRACTION
    =================================================
    */

    let extractedConcepts = [];
    let conceptExtractionFallback = false;

    console.log(`Extracting concepts from ${material.fileName}...`);

    try {
      extractedConcepts = await extractConcepts({
        chunks: knowledgeChunks,
        numberOfConcepts: 10,
      });

      if (!Array.isArray(extractedConcepts)) {
        extractedConcepts = [];
      }

      /*
      Clean Gemini-generated concepts too.
      */

      extractedConcepts = extractedConcepts
        .map((concept) => ({
          name: cleanText(concept.name),
          description: cleanText(concept.description || ""),
        }))
        .filter((concept) => isUsefulConceptName(concept.name));

      console.log(
        `Gemini extracted ${extractedConcepts.length} usable concepts`,
      );
    } catch (error) {
      /*
      -------------------------------------------------
      Gemini failure should NOT make PDF processing fail.
      -------------------------------------------------
      */

      if (isGeminiQuotaError(error)) {
        console.warn(
          `Gemini quota exceeded while processing ${material.fileName}.`,
        );
      } else {
        console.warn(
          `Gemini concept extraction failed for ${material.fileName}.`,
        );

        console.warn(error.message);
      }

      console.warn("Continuing with local fallback concept extraction.");

      extractedConcepts = createFallbackConcepts(knowledgeChunks);

      conceptExtractionFallback = true;

      console.log(`Created ${extractedConcepts.length} fallback concepts`);
    }

    /*
    -----------------------------------------------------
    If Gemini returned no usable concepts, use fallback.
    -----------------------------------------------------
    */

    if (extractedConcepts.length === 0) {
      console.warn("No usable concepts returned. Creating fallback concepts.");

      extractedConcepts = createFallbackConcepts(knowledgeChunks);

      conceptExtractionFallback = true;
    }

    /*
    -----------------------------------------------------
    Save concepts WITHOUT deleting previous mastery.
    -----------------------------------------------------
    */

    const savedConcepts = await saveConcepts({
      userId: material.userId,
      projectId: material.projectId,
      extractedConcepts,
    });

    console.log(
      `Saved ${savedConcepts.length} concepts for project ${material.projectId}`,
    );

    /*
    -------------------------------------------------
    Mark material as ready
    -------------------------------------------------
    */

    material.status = "ready";

    if (conceptExtractionFallback) {
      material.error =
        "PDF processed successfully. AI concept extraction was unavailable, so fallback concepts were generated.";
    } else {
      material.error = "";
    }

    await material.save();

    console.log(`Material processed successfully: ${material._id}`);

    /*
    -------------------------------------------------
    Record material processing activity
    -------------------------------------------------
    */

    await createActivity({
      userId: material.userId,
      projectId: material.projectId,
      type: "material_processed",
      title: "Processed learning material",
      description: `"${material.fileName}" is ready for learning`,
      metadata: {
        materialId: material._id,
        fileName: material.fileName,
        pageCount: material.pageCount,
        chunkCount: knowledgeChunks.length,
        conceptCount: savedConcepts.length,
        conceptExtractionFallback,
      },
    });
  } catch (error) {
    console.error(`Material processing failed: ${material._id}`);

    console.error(error);

    material.status = "failed";
    material.error = error.message || "Failed to process PDF";

    await material.save();
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.error("Parser cleanup error:", error.message);
      }
    }
  }
};

/*
=====================================================
START BACKGROUND MATERIAL WORKER
=====================================================
*/

const startMaterialWorker = () => {
  console.log("Material worker started");

  setInterval(async () => {
    try {
      const material = await Material.findOneAndUpdate(
        {
          status: "queued",
        },
        {
          $set: {
            status: "processing",
          },
        },
        {
          returnDocument: "after",
        },
      );

      if (!material) {
        return;
      }

      await processMaterial(material);
    } catch (error) {
      console.error("Worker error:", error);
    }
  }, 3000);
};

module.exports = {
  startMaterialWorker,
};
