module.exports = {
  studyPlanner: {
    rescheduleOverdueTasks: (overdueTasks, daysRemaining, maxDailyHours) => `
      You are an intelligent study planner assistant. 
      Reschedule ${overdueTasks.length} overdue tasks across ${daysRemaining} remaining days before the exam.
      Ensure the total study hours per day do not exceed the user's maximum threshold of ${maxDailyHours} hours/day.
      
      Tasks: ${JSON.stringify(overdueTasks.map(t => ({ id: t.id, title: t.title, estimatedHours: t.estimatedHours })))}
      
      Return strictly as a JSON array of objects:
      [
        { "taskId": "...", "newDueDate": "YYYY-MM-DD", "allocatedHours": 2 }
      ]
    `
  },
  solutionExplainer: {
    getEnhancedExplanation: (questionText, correctAnswer, explanationText) => `
      You are an expert academic educator in STEM subjects (Physics, Chemistry, Computer Science).
      Provide a rich, detailed solution explanation for the following question:
      Question: "${questionText}"
      Correct Answer: "${correctAnswer}"
      Original Explanation Context: "${explanationText || 'None provided'}"

      Requirements:
      1. Provide a step-by-step breakdown of the concept.
      2. Provide progressive hints for interactive disclosure.
      3. Provide valid Mermaid.js diagram syntax (enclosed in \`\`\`mermaid ... \`\`\`) representing the conceptual flowchart or physical system breakdown.

      Return strictly as a JSON object matching this schema:
      {
        "steps": ["Step 1 explanation...", "Step 2 explanation..."],
        "hints": ["Hint 1: Think about...", "Hint 2: Apply formula..."],
        "mermaidDiagram": "graph TD;\nA[Start] --> B[Concept];"
      }
    `
  },
  pyqParser: {
    parsePyqPdf: (extractedText) => `
      You are an expert academic parser. Analyze the following multi-page Previous Year Question (PYQ) paper text and extract all questions into a structured JSON array.
      
      For each question, extract:
      1. questionNumber (integer or string)
      2. questionText (string)
      3. options (array of 4 strings: [A, B, C, D])
      4. correctAnswer (string or index matching option)
      5. topicCategorization (string subject/topic tag)
      6. yearMetadata (extracted year if present, e.g. 2024 or 2025)

      Text Content:
      """
      ${extractedText}
      """

      Return strictly as a JSON object matching this schema:
      {
        "paperTitle": "Extracted Paper Title or Subject",
        "questions": [
          {
            "questionNumber": 1,
            "questionText": "...",
            "options": ["...", "...", "...", "..."],
            "correctAnswer": "...",
            "topicCategorization": "...",
            "yearMetadata": 2025
          }
        ]
      }
    `
  },
  adaptiveQuiz: {
    getNextAdaptiveQuestion: (nextDifficulty, answeredQuestionIds) => `
      Generate a single high-quality Multiple Choice Question (MCQ) of difficulty level "${nextDifficulty}" for an active quiz session.
      Avoid duplicating these previously asked question IDs: ${JSON.stringify(answeredQuestionIds || [])}.
      
      Return the output strictly as a JSON object matching this schema:
      {
        "id": "unique_question_id",
        "question": "Question text here?",
        "difficulty": "${nextDifficulty}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Detailed explanation."
      }
    `
  },
  pdfQuiz: {
    generateQuizFromPdf: (extractedText) => `
      You are an expert exam creator and educator. Analyze the following textbook/syllabus PDF text content and generate a practice test consisting of 15 high-quality questions (mix of Multiple Choice Questions and Subjective questions).
      
      Text Content:
      """
      ${extractedText}
      """

      Return the output strictly as a JSON object matching this schema:
      {
        "title": "Generated Quiz Title based on content",
        "questions": [
          {
            "question": "Question text here?",
            "type": "mcq", // or "subjective"
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Detailed explanation of why this is correct."
          }
        ]
      }
    `
  },
  ocr: {
    processHandwrittenNote: () => `
      You are an expert OCR and academic assistant. Analyze this image of handwritten study notes.
      Extract all handwritten text, diagrams description, and mathematical formulas with high accuracy.
      Format the output cleanly in structured Markdown format, preserving headings, bullet points, and LaTeX notation for equations where applicable.
    `
  },
  cheatSheet: {
    generateCheatSheet: (subjectName, chapterTitles) => `
      You are an expert academic tutor in STEM subjects (Physics, Mathematics, Chemistry).
      Generate a comprehensive Formula Cheat Sheet for the subject "${subjectName}" (Chapters/Topics: ${chapterTitles || 'All core chapters'}).
      
      Include:
      1. Essential formulas and mathematical equations formatted strictly using KaTeX syntax (e.g., $E = mc^2$ or $$ \\int x dx $$).
      2. Key definitions and fundamental theorems.
      3. Quick-reference notes for exam revision.
      
      Return the output in clean JSON format matching this structure:
      {
        "subjectName": "${subjectName}",
        "sections": [
          {
            "category": "Core Formulas",
            "items": [
              { "title": "Equation Name", "formula": "$...$", "description": "Explanation of variables" }
            ]
          }
        ]
      }
    `
  },
  syllabus: {
    extractStructure: (extractedText) => `
      You are an expert syllabus importer assistant. 
      Extract the hierarchical module structure from the provided syllabus text.
      Return STRICTLY a JSON object with this shape:
      {
        "syllabusName": "Curriculum Title",
        "topics": [
          {
            "moduleName": "Module 1: Name",
            "title": "Topic Name",
            "subtopics": ["Sub-topic A", "Sub-topic B"],
            "weightage": 15
          }
        ]
      }
      Return raw JSON only, no markdown formatting blocks.

      SYLLABUS TEXT:
      ${extractedText.substring(0, 20000)}
    `,
    generateNotesForGap: (topicTitle, topicSubtopics) => `
      You are an expert tutor writing comprehensive, detailed study notes for a student.
      Write comprehensive, beautifully formatted study notes in rich Markdown for the topic: "${topicTitle}".
      Make sure to cover all the sub-topics: ${JSON.stringify(topicSubtopics)}.
      Include standard definitions, formulas if applicable, and clean section titles.
    `
  },
  readiness: {
    compileReadinessSummary: (readinessData) => `
      You are an AI Academic Coach.
      Analyze the student's exam readiness metrics across these subjects:
      ${JSON.stringify(readinessData, null, 2)}

      Identify specific gaps or weak areas (e.g. scores < 70%).
      Provide a single concise paragraph (3-4 sentences max) with actionable advice and specific recommendations on where they should focus their attention next.
    `
  }
};
