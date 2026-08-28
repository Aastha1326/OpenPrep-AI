/**
 * @fileoverview Service for chunking, embedding, and retrieving user notes using a mocked vector store.
 * Implements semantic similarity search for Retrieval-Augmented Generation (RAG).
 */

/**
 * Mock function to split text into overlapping chunks.
 * 
 * @param {string} text - The full text to chunk.
 * @param {number} chunkSize - Maximum characters per chunk.
 * @param {number} overlap - Number of overlapping characters.
 * @returns {Array} Array of text chunks.
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Mock function to calculate cosine similarity between a query and stored chunks.
 * In production, use a real embedding model (e.g., OpenAI embeddings) and vector DB (e.g., Pinecone).
 * 
 * @param {string} query - The user's question.
 * @param {Array} userDocuments - Array of { id, content, metadata } representing user notes.
 * @returns {Array} Top 3 most relevant chunks sorted by mock similarity score.
 */
function retrieveRelevantContext(query, userDocuments) {
    // Mock scoring: assign higher scores to chunks containing query keywords
    const queryWords = query.toLowerCase().split(' ');

    const scoredChunks = userDocuments.flatMap(doc => {
        const chunks = chunkText(doc.content);
        return chunks.map((chunk, index) => {
            const lowerChunk = chunk.toLowerCase();
            const matchCount = queryWords.filter(word => lowerChunk.includes(word)).length;
            const mockScore = matchCount / queryWords.length; // Simple keyword overlap score

            return {
                docId: doc.id,
                chunkIndex: index,
                content: chunk,
                score: mockScore,
                metadata: doc.metadata
            };
        });
    });

    // Sort by score descending and return top 3
    return scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .filter(chunk => chunk.score > 0); // Only return relevant chunks
}

module.exports = {
    chunkText,
    retrieveRelevantContext,
};
