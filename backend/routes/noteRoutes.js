const express = require('express');
const { uploadNote, getNotes, downloadNote, deleteNote, summarizeNote, uploadVoiceNote } = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateUploadNote } = require('../middleware/validators');

const cacheMiddleware = require('../middleware/cache');
const clearCache = require('../middleware/clearCache');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Note upload, retrieval, and summarization
 */

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Upload a new note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *               - subjectId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "My Lecture Notes"
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               content:
 *                 type: string
 *                 example: "Optional text content"
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *     responses:
 *       201:
 *         description: Note uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Note'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/', protect, upload.single('file'), validateUploadNote, clearCache('notes:*'), uploadNote);
router.post('/voice', protect, upload.single('file'), validateUploadNote, clearCache('notes:*'), uploadVoiceNote);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by subject
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by topic
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/', protect, cacheMiddleware(req => `notes:${req.user.id}:${req.originalUrl}`), getNotes);

/**
 * @swagger
 * /api/notes/{id}/download:
 *   put:
 *     summary: Download a note file
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to access this file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.put('/:id/download', protect, downloadNote); // downloading doesn't change state

/**
 * @swagger
 * /api/notes/{id}/summarize:
 *   post:
 *     summary: Generate AI summary of a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note summarized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       example: "This note covers the fundamentals of calculus..."
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/:id/summarize', protect, summarizeNote);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Note deleted successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.delete('/:id', protect, clearCache('notes:*'), deleteNote);

module.exports = router;
