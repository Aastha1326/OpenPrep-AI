/**
 * @fileoverview Controller for PYQ auto-segmentation and OCR processing.
 */
const pdfCroppingService = require('../services/pdfCroppingService');
const mathOcrService = require('../services/mathOcrService');

// Mock job store for async processing
const segmentationJobs = new Map();

/**
 * Uploads raw PDF and triggers OCR and bounding-box segmentation
 */
const autoSegment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'PDF file is required' });
        }

        const jobId = `seg_${Date.now()}`;
        segmentationJobs.set(jobId, { status: 'processing', progress: 20, result: null });

        // Async processing
        (async () => {
            try {
                const segments = await pdfCroppingService.segmentPDF(req.file.buffer);

                // Process diagrams for OCR if needed
                for (const seg of segments) {
                    if (seg.hasDiagram) {
                        // Mock diagram OCR
                        seg.ocrText = await mathOcrService.extractLaTeX(Buffer.from('mock'));
                    }
                }

                segmentationJobs.set(jobId, {
                    status: 'completed',
                    progress: 100,
                    result: segments
                });
            } catch (error) {
                segmentationJobs.set(jobId, { status: 'failed', progress: 0, error: error.message });
            }
        })();

        res.status(202).json({
            success: true,
            jobId,
            message: 'PDF uploaded. Segmentation started.'
        });
    } catch (error) {
        console.error('Error auto-segmenting PDF:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Fetches parsed questions for review and editing
 */
const getSegmentedQuestions = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = segmentationJobs.get(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.status(200).json({ success: true, data: job });
    } catch (error) {
        console.error('Error fetching segmented questions:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    autoSegment,
    getSegmentedQuestions,
};
