const { parseCSV, validateCSVHeaders } = require('../../utils/csvParser')

describe('parseCSV', () => {
  it('returns an empty array for empty or null input', () => {
    expect(parseCSV('')).toEqual([])
    expect(parseCSV(null)).toEqual([])
    expect(parseCSV('   ')).toEqual([])
  })

  it('returns an empty array when there is only a header row', () => {
    expect(parseCSV('front,back')).toEqual([])
  })

  it('parses a basic CSV with a header row', () => {
    const csv = 'front,back\nWhat is 2+2?,4\nCapital of France?,Paris'
    expect(parseCSV(csv)).toEqual([
      { front: 'What is 2+2?', back: '4' },
      { front: 'Capital of France?', back: 'Paris' },
    ])
  })

  it('lower-cases header names so "Front,Back,Tags" style headers work', () => {
    const csv = 'Front,Back,Tags\nQ1,A1,biology'
    const records = parseCSV(csv)
    expect(records).toEqual([{ front: 'Q1', back: 'A1', tags: 'biology' }])
  })

  it('handles quoted fields containing commas', () => {
    const csv = 'front,back\n"What is A, B?",Answer'
    expect(parseCSV(csv)).toEqual([{ front: 'What is A, B?', back: 'Answer' }])
  })

  it('handles escaped double-quotes inside quoted fields', () => {
    const csv = 'front,back\n"He said ""hello""",Reply'
    expect(parseCSV(csv)).toEqual([{ front: 'He said "hello"', back: 'Reply' }])
  })

  it('skips Anki-style "#"-prefixed metadata lines', () => {
    const csv = [
      '#separator:Comma',
      '#html:true',
      '#columns:Front,Back,Tags',
      'front,back,tags',
      'Q1,A1,chapter1',
    ].join('\n')
    expect(parseCSV(csv)).toEqual([{ front: 'Q1', back: 'A1', tags: 'chapter1' }])
  })

  it('skips blank lines between rows', () => {
    const csv = 'front,back\nQ1,A1\n\nQ2,A2'
    expect(parseCSV(csv)).toEqual([
      { front: 'Q1', back: 'A1' },
      { front: 'Q2', back: 'A2' },
    ])
  })

  describe('quoted fields spanning multiple lines', () => {
    it('keeps a newline inside a quoted field as part of the value', () => {
      const csv = 'front,back\n"Line one\nLine two",Answer'
      expect(parseCSV(csv)).toEqual([{ front: 'Line one\nLine two', back: 'Answer' }])
    })

    it('keeps a multi-line value in the last column', () => {
      const csv = 'front,back\nQuestion,"Step 1\nStep 2\nStep 3"'
      expect(parseCSV(csv)).toEqual([{ front: 'Question', back: 'Step 1\nStep 2\nStep 3' }])
    })

    it('parses the rows following a multi-line card correctly', () => {
      const csv = 'front,back\n"Multi\nline",A1\nQ2,A2'
      expect(parseCSV(csv)).toEqual([
        { front: 'Multi\nline', back: 'A1' },
        { front: 'Q2', back: 'A2' },
      ])
    })

    it('handles a multi-line field that also contains commas and quotes', () => {
      const csv = 'front,back\n"He said ""go"",\nthen left",Answer'
      expect(parseCSV(csv)).toEqual([{ front: 'He said "go",\nthen left', back: 'Answer' }])
    })

    it('normalises CRLF inside a quoted field to LF', () => {
      const csv = 'front,back\r\n"Line one\r\nLine two",Answer'
      expect(parseCSV(csv)).toEqual([{ front: 'Line one\nLine two', back: 'Answer' }])
    })
  })

  describe('rows whose content starts with "#"', () => {
    it('keeps a card whose front begins with "#"', () => {
      const csv = 'front,back\n#include <stdio.h> does what?,Includes I/O header'
      expect(parseCSV(csv)).toEqual([
        { front: '#include <stdio.h> does what?', back: 'Includes I/O header' },
      ])
    })

    it('keeps a "#" line inside a quoted multi-line field', () => {
      const csv = 'front,back\n"What is\n#1 rule?",Answer'
      expect(parseCSV(csv)).toEqual([{ front: 'What is\n#1 rule?', back: 'Answer' }])
    })

    it('does not drop "#" rows that appear between ordinary rows', () => {
      const csv = 'front,back\nQ1,A1\n#define does what?,Macro\nQ3,A3'
      expect(parseCSV(csv)).toEqual([
        { front: 'Q1', back: 'A1' },
        { front: '#define does what?', back: 'Macro' },
        { front: 'Q3', back: 'A3' },
      ])
    })

    it('still strips an Anki "#columns:" line even though it contains commas', () => {
      const csv = [
        '#separator:Comma',
        '#html:true',
        '#columns:Front,Back,Tags',
        'front,back,tags',
        'Q1,A1,chapter1',
      ].join('\n')
      expect(parseCSV(csv)).toEqual([{ front: 'Q1', back: 'A1', tags: 'chapter1' }])
    })
  })

  describe('header handling', () => {
    it('suffixes duplicate header names instead of overwriting the column', () => {
      const csv = 'Front,Back,Front\nQ1,A1,Q2'
      expect(parseCSV(csv)).toEqual([{ front: 'Q1', back: 'A1', front_2: 'Q2' }])
    })

    it('names an unlabelled column by position', () => {
      const csv = 'front,back,\nQ1,A1,extra'
      expect(parseCSV(csv)).toEqual([{ front: 'Q1', back: 'A1', column3: 'extra' }])
    })

    it('fills missing trailing columns with an empty string', () => {
      const csv = 'front,back,tags\nQ1,A1'
      expect(parseCSV(csv)).toEqual([{ front: 'Q1', back: 'A1', tags: '' }])
    })
  })

  describe('file endings', () => {
    it('does not emit a trailing empty record for a file ending in a newline', () => {
      expect(parseCSV('front,back\nQ1,A1\n')).toEqual([{ front: 'Q1', back: 'A1' }])
    })

    it('parses a final row with no trailing newline', () => {
      expect(parseCSV('front,back\nQ1,A1')).toEqual([{ front: 'Q1', back: 'A1' }])
    })

    it('handles CRLF line endings throughout', () => {
      expect(parseCSV('front,back\r\nQ1,A1\r\nQ2,A2')).toEqual([
        { front: 'Q1', back: 'A1' },
        { front: 'Q2', back: 'A2' },
      ])
    })

    it('handles bare CR line endings', () => {
      expect(parseCSV('front,back\rQ1,A1')).toEqual([{ front: 'Q1', back: 'A1' }])
    })
  })

  describe('round-tripping the export format', () => {
    // exportFlashcards writes quoted fields with doubled quotes; anything it
    // writes must survive a re-import unchanged.
    it('reads back a card containing every special character', () => {
      const front = 'What does "x, y"\nmean?'
      const back = 'A pair'
      const escape = (value) => `"${value.replace(/"/g, '""')}"`
      const csv = `front,back\n${escape(front)},${escape(back)}`

      expect(parseCSV(csv)).toEqual([{ front, back }])
    })
  })
})

describe('validateCSVHeaders', () => {
  it('returns an error message for an empty record set', () => {
    expect(validateCSVHeaders([])).toMatch(/empty or missing a header row/)
    expect(validateCSVHeaders(null)).toMatch(/empty or missing a header row/)
  })

  it('returns an error message when required columns are missing', () => {
    const records = [{ question: 'Q1', answer: 'A1' }]
    expect(validateCSVHeaders(records)).toMatch(/must include "Front" and "Back"/)
  })

  it('returns null when front and back columns are present', () => {
    const records = [{ front: 'Q1', back: 'A1' }]
    expect(validateCSVHeaders(records)).toBeNull()
  })

  it('returns null when optional tags/hint columns are also present', () => {
    const records = [{ front: 'Q1', back: 'A1', tags: 'x', hint: 'y' }]
    expect(validateCSVHeaders(records)).toBeNull()
  })
})