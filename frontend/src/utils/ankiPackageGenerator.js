/**
 * @fileoverview Utility for triggering the download of an Anki package from the backend.
 */
import axios from 'axios';

/**
 * Fetches the .apkg file from the backend and triggers a browser download.
 * 
 * @param {string} deckId - The ID of the deck to export.
 * @param {string} deckName - The name of the deck (for the filename).
 * @returns {Promise<void>}
 */
export const downloadAnkiPackage = async (deckId, deckName) => {
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    try {
        const response = await axios.get(`${API_URL}/flashcards/export/${deckId}/anki`, {
            responseType: 'blob', // Important for binary file download
        });

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${deckName.replace(/\s+/g, '_')}.apkg`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Failed to download Anki package:', error);
        throw new Error('Failed to export deck. Please try again.');
    }
};
