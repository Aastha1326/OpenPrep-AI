/**
 * Enterprise Collaborative Shared Notes & PDF Annotation Service
 */
import CollaborativeSharedNote from '../models/CollaborativeSharedNoteModel.js';

class CollaborativeSharedNoteService {
  /**
   * Adds PDF annotation highlight to shared note and awards collaboration XP.
   */
  static async addPdfAnnotation(noteId, authorId, pageNumber, boundingCoords, annotationText) {
    let note = await CollaborativeSharedNote.findOne({ noteId });

    if (!note) {
      note = new CollaborativeSharedNote({
        noteId,
        authorStudentId: authorId,
      });
    }

    note.pdfAnnotations.push({
      pageNumber,
      boundingCoords,
      annotationText,
      authorId,
    });

    note.earnedSharedXP += 10;
    await note.save();
    return note;
  }
}

export default CollaborativeSharedNoteService;

// ==============================================================================
// ENTERPRISE SERVICE LAYER SPECIFICATIONS
// ------------------------------------------------------------------------------
// Business logic engine handling PDF annotations, markdown note sharing, and XP rewards.
// ==============================================================================
