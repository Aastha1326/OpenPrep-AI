const { splitIntoChunks } = require('../../utils/textChunking')

describe('splitIntoChunks', () => {
  it('returns an empty array for empty or null input', () => {
    expect(splitIntoChunks('', 100)).toEqual([])
    expect(splitIntoChunks(null, 100)).toEqual([])
    expect(splitIntoChunks('   ', 100)).toEqual([])
  })

  it('returns the whole text as a single chunk when within the limit', () => {
    const text = 'Short note that fits comfortably.'
    expect(splitIntoChunks(text, 1000)).toEqual([text])
  })

  it('never drops content when splitting long text', () => {
    const text = Array.from({ length: 5 }, (_, i) => `Chapter ${i + 1}. `.repeat(500)).join('\n\n')
    const chunks = splitIntoChunks(text, 11000)
    const normalized = (s) => s.replace(/\s+/g, ' ')
    const reassembled = normalized(chunks.join(' '))

    expect(chunks.length).toBeGreaterThan(1)
    for (let i = 1; i <= 5; i++) {
      const count = (reassembled.match(new RegExp(`Chapter ${i}\\.`, 'g')) || []).length
      expect(count).toBe(500)
    }
  })

  it('keeps every chunk within the max character limit', () => {
    const text = 'word '.repeat(10000)
    const chunks = splitIntoChunks(text, 11000)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(11000)
    }
  })

  it('prefers paragraph boundaries over hard cuts', () => {
    const paragraphA = 'a'.repeat(200)
    const paragraphB = 'b'.repeat(200)
    const text = `${paragraphA}\n\n${paragraphB}`

    const chunks = splitIntoChunks(text, 300)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toBe(paragraphA)
    expect(chunks[1]).toBe(paragraphB)
  })

  it('handles a single over-long word with a hard cut', () => {
    const longWord = 'x'.repeat(500)
    const chunks = splitIntoChunks(longWord, 200)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200)
    }
    expect(chunks.join('')).toBe(longWord)
  })
})
