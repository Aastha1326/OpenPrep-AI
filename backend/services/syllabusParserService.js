const fs = require('fs');
const pdfParse = require('pdf-parse');
const geminiService = require('./geminiService');
const { RESPONSE_SCHEMAS, validateResponse, cleanJSON } = require('./geminiService');

const SYLLABUS_JSON_SCHEMA = {
  examName: 'string',
  examDate: 'string', // YYYY-MM-DD (optional, fallback handled downstream)
  description: 'string', // optional
  subjects: {
    type: 'array',
    itemSchema: {
      name: 'string',
      description: 'string', // optional
      topics: 'array', // array of strings: ["Topic 1", "Topic 2"]
      weightage: 'string', // optional — can be number or string, leniently parsed
    },
  },
};

RESPONSE_SCHEMAS.syllabusImport = SYLLABUS_JSON_SCHEMA;

function validateSyllabusPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    errors.push('Syllabus JSON must be an object');
    return { valid: false, errors };
  }

  if (typeof payload.examName !== 'string' || payload.examName.trim().length === 0) {
    errors.push('examName is required and must be a non-empty string');
  }

  if (!Array.isArray(payload.subjects) || payload.subjects.length === 0) {
    errors.push('subjects must be a non-empty array');
  } else {
    payload.subjects.forEach((sub, idx) => {
      if (!sub || typeof sub !== 'object') {
        errors.push(`subjects[${idx}] must be an object`);
        return;
      }
      if (typeof sub.name !== 'string' || sub.name.trim().length === 0) {
        errors.push(`subjects[${idx}].name is required and must be a non-empty string`);
      }
      if (!Array.isArray(sub.topics)) {
        errors.push(`subjects[${idx}].topics must be an array`);
      } else {
        sub.topics.forEach((t, tIdx) => {
          if (typeof t !== 'string' || t.trim().length === 0) {
            errors.push(`subjects[${idx}].topics[${tIdx}] must be a non-empty string`);
          }
        });
      }
    });
  }

  if (payload.examDate && typeof payload.examDate === 'string') {
    const d = new Date(payload.examDate);
    if (Number.isNaN(d.getTime())) {
      errors.push('examDate must be a valid ISO date string (YYYY-MM-DD)');
    }
  }

  return { valid: errors.length === 0, errors };
}

async function readFile(file) {
  const abs = file?.path;
  if (!abs) throw new Error('Uploaded file could not be saved to disk');
  const buffer = await fs.promises.readFile(abs);
  return buffer;
}

function cleanupUploadedFile(file) {
  if (!file?.path) return;
  try {
    fs.unlinkSync(file.path);
  } catch {
    // ignore cleanup errors
  }
}

function readJSONSync(buffer, filename) {
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (err) {
    const msg = err?.message || 'Invalid JSON file';
    throw new Error(`Failed to parse syllabus JSON${filename ? ` (${filename})` : ''}: ${msg}`);
  }
}

async function extractPdfText(buffer) {
  try {
    const parsed = await pdfParse(buffer);
    if (parsed && typeof parsed.text === 'string') {
      const clean = parsed.text.replace(/\u0000/g, '').trim();
      if (clean.length > 0) return clean;
    }
  } catch {
    // continue to fallback
  }
  const rawString = buffer.toString('utf8').replace(/\u0000/g, '').trim();
  if (rawString.length < 200) {
    throw new Error('PDF text extraction returned empty or unreadable content. Please try a different PDF.');
  }
  return rawString;
}

async function parseSyllabusPdfWithAI(text, forceRefresh = false) {
  if (typeof geminiService.parseSyllabusPdfText === 'function') {
    return geminiService.parseSyllabusPdfText(text, forceRefresh);
  }

  // Fallback: perform inline extraction via generic AI call using the same
  // retry/validate flow that geminiService uses for other structured outputs.
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Mock fallback for environments without Gemini configured
    return {
      _mock: true,
      examName: 'University Syllabus Exam',
      subjects: [
        {
          name: 'General Studies - Paper I',
          description: 'Auto detected subject from syllabus PDF',
          topics: [
            'Unit 1 - Introduction',
            'Unit 2 - Core Concepts',
            'Unit 3 - Applications',
            'Unit 4 - Case Studies',
          ],
          weightage: 100,
        },
      ],
    };
  }

  // Use the geminiService.cleanJSON + validateResponse exported above
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `
You are an expert syllabus parser for a university / competitive exam curriculum.
Extract the EXACT hierarchical syllabus structure from the provided text.
Only extract what is clearly present — do NOT invent or hallucinate topics that
do not appear in the text below. If multiple exams are present, pick the
overarching / first exam mentioned.

Return STRICTLY a JSON object matching this shape:
{
  "examName": "string (name of exam / course title)",
  "examDate": "string (YYYY-MM-DD, only if text explicitly contains a concrete exam date, else omit)",
  "description": "string (brief description of exam / semester level, else empty string)",
  "subjects": [
    {
      "name": "string (subject / paper name)",
      "description": "string (subject description, or empty)",
      "topics": ["string - topic 1", "string - topic 2", "..."],
      "weightage": number or 0 (total marks / credit / syllabus weightage percentage for the subject if mentioned, else 0)
    }
  ]
}

Rules:
- topics array must only contain topic names explicitly written in syllabus (chapter names, units, sections, module headings, recommended syllabus items).
- If subject weightage/marks/credits is mentioned put it as number in "weightage", else 0.
- If no exam date is explicitly mentioned, DO NOT include "examDate" key at all.
- Never include empty subjects / empty topics arrays.
- Do not wrap the JSON in \`\`\`json fences or markdown or any commentary.

SYLLABUS TEXT TO PARSE:
${text.substring(0, 40000)}`.trim();

  // Mirror geminiService.generateWithRetry pattern with simple loop + rethrow
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      const parsed = cleanJSON(rawText);
      if (validateResponse(parsed, SYLLABUS_JSON_SCHEMA)) {
        return parsed;
      }
      // Validate lenient fallback when required keys are ok
      if (parsed && typeof parsed.examName === 'string' && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
        return parsed;
      }
      lastError = new Error('Gemini returned syllabus JSON that failed schema validation');
    } catch (err) {
      lastError = err;
      // small jitter backoff
      await new Promise((r) => setTimeout(r, 500 + attempt * 300));
    }
  }

  throw new Error(
    `Failed to extract syllabus structure from PDF${
      lastError?.message ? ': ' + lastError.message : ''
    }`
  );
}

function normalizeSyllabusPayload(rawPayload) {
  const payload = rawPayload || {};
  const subjects = (Array.isArray(payload.subjects) ? payload.subjects : []).map((sub, idx) => ({
    name: String(sub?.name || `Subject ${idx + 1}`).trim(),
    description: String(sub?.description || '').trim(),
    weightage: Number(sub?.weightage) || 0,
    topics: (Array.isArray(sub?.topics) ? sub.topics : []).map((t) => String(t).trim()).filter(Boolean),
  }));

  const examDateStr = payload.examDate && typeof payload.examDate === 'string'
    ? payload.examDate.trim()
    : '';

  let examDate = null;
  if (examDateStr) {
    const d = new Date(examDateStr);
    if (!Number.isNaN(d.getTime())) examDate = d;
  }
  // Default exam date = 30 days from today if none provided (valid placeholder)
  if (!examDate) {
    examDate = new Date();
    examDate.setDate(examDate.getDate() + 30);
    examDate.setHours(0, 0, 0, 0);
  }

  return {
    examName: String(payload.examName || 'Imported University Exam').trim(),
    examDate,
    description: String(payload.description || '').trim(),
    subjects,
    importSource: payload.importSource || 'upload',
  };
}

module.exports = {
  SYLLABUS_JSON_SCHEMA,
  validateSyllabusPayload,
  readFile,
  cleanupUploadedFile,
  readJSONSync,
  extractPdfText,
  parseSyllabusPdfWithAI,
  normalizeSyllabusPayload,
};
