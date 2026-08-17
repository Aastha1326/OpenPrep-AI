import { vi } from 'vitest'

import geminiService from '../../services/geminiService'

const { summarizeNoteChunks, buildNotesDigestFromChunks, mergeNoteSummaries, GeminiRateLimitError } = geminiService

const chunkResult = (label) => ({
  summary: `Summary of ${label}`,
  keyConcepts: [`Concept ${label} A`, `Concept ${label} B`],
  examTips: [`Tip ${label}`],
})

// Three ~7.5K-char paragraphs = ~22.5K chars total -> 3 chunks at 11000 max.
const buildLongNote = () =>
  ['First', 'Second', 'Third']
    .map((label) => `${label} chapter content. `.repeat(300))
    .join('\n\n')

describe('summarizeNoteChunks (multi-pass chunking)', () => {
  it('summarizes short notes in a single pass without truncation', async () => {
    const content = 'Short note that fits in one chunk. '.repeat(50)
    const summarizeFn = vi.fn().mockResolvedValue(chunkResult('whole'))

    const result = await summarizeNoteChunks(content, summarizeFn, 'Biology')

    expect(summarizeFn).toHaveBeenCalledTimes(1)
    expect(summarizeFn).toHaveBeenCalledWith(content)
    expect(result.summary).toBe('Summary of whole')
    expect(result.keyConcepts).toEqual(['Concept whole A', 'Concept whole B'])
  })

  it('summarizes long notes across multiple passes and merges the results', async () => {
    const note = buildLongNote()
    const summarizeFn = vi
      .fn()
      .mockResolvedValueOnce(chunkResult('First'))
      .mockResolvedValueOnce(chunkResult('Second'))
      .mockResolvedValueOnce(chunkResult('Third'))

    const result = await summarizeNoteChunks(note, summarizeFn, 'Chemistry')

    expect(summarizeFn).toHaveBeenCalledTimes(3)
    expect(result.summary).toContain('Summary of First')
    expect(result.summary).toContain('Summary of Second')
    expect(result.summary).toContain('Summary of Third')
    expect(result.keyConcepts).toContain('Concept First A')
    expect(result.keyConcepts).toContain('Concept Third B')
  })

  it('passes every chunk to the summarizer so no later chapter is dropped', async () => {
    const note = buildLongNote()
    const received = []
    const summarizeFn = vi.fn().mockImplementation(async (chunk) => {
      received.push(chunk)
      return chunkResult('Chunk')
    })

    await summarizeNoteChunks(note, summarizeFn, 'Physics')

    const combined = received.join(' ')
    expect(combined).toContain('First chapter content')
    expect(combined).toContain('Second chapter content')
    expect(combined).toContain('Third chapter content')
  })

  it('falls back per chunk on a generic failure instead of failing the whole summary', async () => {
    const note = buildLongNote()
    const summarizeFn = vi
      .fn()
      .mockResolvedValueOnce(chunkResult('First'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(chunkResult('Third'))

    const result = await summarizeNoteChunks(note, summarizeFn, 'Physics')

    expect(summarizeFn).toHaveBeenCalledTimes(3)
    expect(result.summary).toContain('Summary of First')
    expect(result.summary).toContain('Summary of Third')
    expect(result.keyConcepts.length).toBeGreaterThan(0)
  })

  it('rethrows rate limit errors from a chunk instead of masking them', async () => {
    const note = buildLongNote()
    const summarizeFn = vi.fn().mockRejectedValue(new GeminiRateLimitError('quota exceeded', 60))

    await expect(summarizeNoteChunks(note, summarizeFn, 'Physics')).rejects.toMatchObject({
      name: 'GeminiRateLimitError',
      status: 429,
    })
  })

  it('returns mock data for empty content without invoking the summarizer', async () => {
    const summarizeFn = vi.fn()
    const result = await summarizeNoteChunks('   ', summarizeFn, 'Biology')

    expect(summarizeFn).not.toHaveBeenCalled()
    expect(result.summary.length).toBeGreaterThan(0)
  })
})

describe('mergeNoteSummaries', () => {
  it('de-duplicates and caps merged key concepts and exam tips', () => {
    const results = [
      chunkResult('A'),
      chunkResult('A'),
      { summary: 'Summary of B', keyConcepts: ['dup', 'dup'], examTips: ['t1', 't2', 't3', 't4', 't5', 't6'] },
    ]
    const merged = mergeNoteSummaries(results)

    expect(merged.keyConcepts.filter((c) => c === 'Concept A A')).toHaveLength(1)
    expect(merged.examTips).toHaveLength(5)
  })

  it('joins summaries and tolerates empty results', () => {
    const merged = mergeNoteSummaries([{ summary: 'One' }, { summary: 'Two' }, {}])
    expect(merged.summary).toBe('One\n\nTwo')
    expect(merged.keyConcepts).toEqual([])
  })
})

describe('buildNotesDigestFromChunks', () => {
  it('passes short notes through unchanged without calling the summarizer', async () => {
    const short = 'Concise context. '.repeat(200)
    const summarizeFn = vi.fn()

    const digest = await buildNotesDigestFromChunks(short, summarizeFn)

    expect(digest).toBe(short)
    expect(summarizeFn).not.toHaveBeenCalled()
  })

  it('condenses long notes into a summarized digest covering all chunks', async () => {
    const note = buildLongNote()
    const summarizeFn = vi
      .fn()
      .mockResolvedValueOnce(chunkResult('First'))
      .mockResolvedValueOnce(chunkResult('Second'))
      .mockResolvedValueOnce(chunkResult('Third'))

    const digest = await buildNotesDigestFromChunks(note, summarizeFn)

    expect(summarizeFn).toHaveBeenCalledTimes(3)
    expect(digest).toContain('Summary of First')
    expect(digest).toContain('Summary of Third')
  })

  it('returns an empty string for empty notes', async () => {
    const summarizeFn = vi.fn()
    expect(await buildNotesDigestFromChunks('', summarizeFn)).toBe('')
    expect(await buildNotesDigestFromChunks('   ', summarizeFn)).toBe('')
    expect(summarizeFn).not.toHaveBeenCalled()
  })
})
