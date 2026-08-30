/**
 * @fileoverview Controller for handling audio lecture upload and transcription jobs.
 */
const audioProcessingService = require('../services/audioProcessingService');
const transcriptionService = require('../services/transcriptionService');
const noteSummarizerService = require('../services/noteSummarizerService'); // Assumed to exist or mocked

// Mock job store
const transcriptionJobs = new Map();

/**
 * Ingests audio file and initiates asynchronous transcription job
 */
const uploadLecture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Audio file is required' });
        }

        const jobId = `job_${Date.now()}`;
        transcriptionJobs.set(jobId, { status: 'processing', progress: 10, result: null });

        // Asynchronous processing
        (async () => {
            try {
                const processedPath = await audioProcessingService.preprocessAudio(
                    req.file.path,
                    req.file.path.replace(path.extname(req.file.path), '_processed.wav')
                );

                transcriptionJobs.set(jobId, { status: 'processing', progress: 50, result: null });

                const transcription = await transcriptionService.transcribeAudio(processedPath);
                const notes = await noteSummarizerService.generateStructuredNotes(transcription.fullText);

                transcriptionJobs.set(jobId, {
                    status: 'completed',
                    progress: 100,
                    result: { transcription, notes }
                });
            } catch (error) {
                transcriptionJobs.set(jobId, { status: 'failed', progress: 0, error: error.message });
            }
        })();

        res.status(202).json({
            success: true,
            jobId,
            message: 'Audio uploaded successfully. Transcription started.'
        });
    } catch (error) {
        console.error('Error uploading lecture:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Polls processing status and progress percentage
 */
const getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = transcriptionJobs.get(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.status(200).json({ success: true, data: job });
    } catch (error) {
        console.error('Error fetching job status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    uploadLecture,
    getJobStatus,
};
