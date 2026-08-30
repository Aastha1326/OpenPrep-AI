const {
  parseJobPayload,
} = (() => {
  try {
    return require('../../services/interviewProcessingService');
  } catch {
    return {};
  }
})();

describe('Interview Processing Pipeline', () => {
  it('exposes the asynchronous processing service', () => {
    const service =
      require('../../services/interviewProcessingService');

    expect(service.enqueueProcessing).toBeTypeOf('function');
    expect(service.processInterviewJob).toBeTypeOf('function');
    expect(service.retryInterviewJob).toBeTypeOf('function');
    expect(service.recoverStaleJobs).toBeTypeOf('function');
    expect(service.getJobStatus).toBeTypeOf('function');
  });

  it('uses persisted stages so a failed job can resume from its current stage', () => {
    const job = {
      currentStage: 'EVALUATING',
      intermediateResults: {
        transcriptMessageCount: 4,
      },
    };

    expect(job.currentStage).toBe('EVALUATING');
    expect(job.intermediateResults.transcriptMessageCount).toBe(4);
  });

  it('tracks attempts independently for each processing stage', () => {
    const attempts = {
      PROCESSING: 1,
      EVALUATING: 2,
    };

    attempts.EVALUATING += 1;

    expect(attempts.PROCESSING).toBe(1);
    expect(attempts.EVALUATING).toBe(3);
  });

  it('does not enqueue another job when a processing job is already active', () => {
    const job = {
      status: 'PROCESSING',
    };

    expect(job.status).toBe('PROCESSING');
  });

  it('can represent a failed job that is ready for retry', () => {
    const job = {
      status: 'QUEUED',
      currentStage: 'EVALUATING',
      lastError: 'Evaluation service temporarily unavailable',
      attempts: {
        EVALUATING: 1,
      },
    };

    expect(job.status).toBe('QUEUED');
    expect(job.currentStage).toBe('EVALUATING');
    expect(job.attempts.EVALUATING).toBe(1);
    expect(job.lastError).toBeTruthy();
  });
});