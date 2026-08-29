/**
 * @fileoverview Controller for handling RAG-based AI tutor chat interactions.
 */
const vectorStoreService = require('../services/vectorStoreService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Processes a user query, retrieves relevant context, and generates a cited response.
 */
const chatWithTutor = async (req, res) => {
    try {
        const { query, useFallback } = req.body;
        // const userId = req.user.id;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Query is required.' });
        }

        // Mock user documents (in production, fetch from DB based on userId)
        const mockUserDocuments = [
            {
                id: 'note_1',
                content: 'The Krebs cycle, also known as the citric acid cycle, is a series of chemical reactions used by all aerobic organisms to release stored energy through the oxidation of acetyl-CoA derived from carbohydrates, fats, and proteins.',
                metadata: { type: 'note', title: 'Biology: Cellular Respiration' }
            },
            {
                id: 'flashcard_1',
                content: 'Q: What is the primary output of the Krebs cycle? A: ATP, NADH, FADH2, and CO2.',
                metadata: { type: 'flashcard', title: 'Biology Flashcards' }
            }
        ];

        // Step 1: Retrieve relevant context
        const relevantContext = vectorStoreService.retrieveRelevantContext(query, mockUserDocuments);

        let finalPrompt = query;
        let citations = [];

        // Step 2: Augment prompt if context is found, otherwise use fallback
        if (relevantContext.length > 0 && !useFallback) {
            const contextText = relevantContext.map(ctx =>
                `[Source: ${ctx.metadata.title}] ${ctx.content}`
            ).join('\n\n');

            finalPrompt = `
        You are a helpful AI tutor. Answer the user's question using ONLY the provided context from their personal notes. 
        If the context does not contain the answer, state that clearly.
        Always cite your sources using the format [Source: Title].

        Context:
        ${contextText}

        User Question: ${query}
      `;

            citations = relevantContext.map(ctx => ({
                source: ctx.metadata.title,
                snippet: ctx.content.substring(0, 100) + '...'
            }));
        } else {
            finalPrompt = `
        You are a helpful AI tutor. The user asked: "${query}".
        Note: No relevant personal notes were found, so please answer using your general knowledge, but mention that this is not from their notes.
      `;
        }

        // Step 3: Generate response
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const answer = response.text();

        res.status(200).json({
            success: true,
            data: {
                answer,
                citations,
                usedPersonalNotes: relevantContext.length > 0 && !useFallback
            }
        });
    } catch (error) {
        console.error('[RAGTutorController] Chat error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during RAG processing.' });
    }
};

module.exports = {
    chatWithTutor,
};
