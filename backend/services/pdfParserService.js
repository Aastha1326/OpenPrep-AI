/**
 * PDF Parser Service MVP
 * Simulates a long-running extraction and generation process.
 */
exports.parseAndGenerate = async (pdfBuffer) => {
  return new Promise((resolve) => {
    // Simulate processing delay (e.g. BullMQ worker + LLM API call)
    setTimeout(() => {
      resolve([
        {
          deckName: "Auto-Generated: Chapter 1 Overview",
          cards: [
            { front: "What is the primary topic of the uploaded document?", back: "Simulated extracted concept 1" },
            { front: "Define the key term found on page 3.", back: "Simulated extracted concept 2" }
          ]
        },
        {
          deckName: "Auto-Generated: Important Formulas",
          cards: [
            { front: "Formula for X", back: "Y = mx + b" }
          ]
        }
      ]);
    }, 2500);
  });
};
