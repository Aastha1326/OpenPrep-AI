/**
 * @fileoverview Simplified Conflict-Free Replicated Data Type (CRDT) logic for real-time collaborative editing.
 * Handles concurrent edits and prevents race conditions over WebSockets.
 */

/**
 * Applies an insert operation to the document state.
 * In a full CRDT, this would use unique character IDs and logical clocks.
 * Here, we simulate safe insertion at a specific index.
 * 
 * @param {string} currentText - The current document text.
 * @param {number} index - The position to insert.
 * @param {string} text - The text to insert.
 * @returns {string} The updated document text.
 */
function applyInsert(currentText, index, text) {
    const safeIndex = Math.max(0, Math.min(index, currentText.length));
    return currentText.slice(0, safeIndex) + text + currentText.slice(safeIndex);
}

/**
 * Applies a delete operation to the document state.
 * 
 * @param {string} currentText - The current document text.
 * @param {number} index - The starting position to delete.
 * @param {number} length - The number of characters to delete.
 * @returns {string} The updated document text.
 */
function applyDelete(currentText, index, length) {
    const safeIndex = Math.max(0, Math.min(index, currentText.length));
    const safeLength = Math.min(length, currentText.length - safeIndex);
    return currentText.slice(0, safeIndex) + currentText.slice(safeIndex + safeLength);
}

/**
 * Transforms an operation against a concurrent operation to maintain consistency.
 * Simplified OT logic for insert/insert conflicts.
 * 
 * @param {Object} op1 - The operation to transform.
 * @param {Object} op2 - The concurrent operation already applied.
 * @returns {Object} The transformed operation.
 */
function transformOperation(op1, op2) {
    if (op1.type === 'insert' && op2.type === 'insert') {
        if (op1.index <= op2.index) {
            return op1; // op1 is before op2, no change needed
        } else {
            return { ...op1, index: op1.index + op2.text.length }; // Shift op1 right
        }
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
        if (op1.index <= op2.index) {
            return op1; // op1 is before the deletion, no change
        } else if (op1.index >= op2.index + op2.length) {
            return { ...op1, index: op1.index - op2.length }; // Shift op1 left
        } else {
            // op1 is inside the deleted range, attach it to the end of the deletion
            return { ...op1, index: op2.index };
        }
    }

    // For simplicity, return op1 unchanged for other complex conflicts in this mock
    return op1;
}

module.exports = {
    applyInsert,
    applyDelete,
    transformOperation,
};
