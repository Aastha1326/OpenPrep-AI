/**
 * Minimal RFC 4180 CSV reader for flashcard imports.
 *
 * The input is walked one character at a time rather than split on newlines
 * first, because a quoted field is allowed to contain the record separator.
 * Splitting on "\n" up front makes that case unrepresentable: the parser can
 * never carry an open quote across a line break, so a two-line card arrives as
 * two broken records. Anki produces multi-line fields constantly (HTML
 * exports, cloze notes, code snippets), so this is the common path, not an
 * edge case.
 */

const QUOTE = '"';
const FIELD_SEPARATOR = ',';

/**
 * Split raw CSV text into records of raw string fields.
 *
 * Quote state is tracked across the whole document, so a newline inside a
 * quoted field is content and a newline outside one ends the record.
 *
 * @param {string} text raw CSV file contents (newlines already normalised)
 * @returns {Array<string[]>} one array of fields per record
 */
function tokenize(text) {
  const records = [];
  let fields = [];
  let field = '';
  let inQuote = false;
  // Tracks whether the current field was written as a quoted field, so an
  // empty quoted field ("") stays distinguishable from a bare empty field.
  let fieldWasQuoted = false;

  const endField = () => {
    fields.push(field);
    field = '';
    fieldWasQuoted = false;
  };

  const endRecord = () => {
    endField();
    records.push(fields);
    fields = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuote) {
      if (char === QUOTE) {
        if (text[i + 1] === QUOTE) {
          // "" inside a quoted field is a literal double-quote
          field += QUOTE;
          i += 1;
        } else {
          inQuote = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === QUOTE) {
      inQuote = true;
      fieldWasQuoted = true;
      continue;
    }

    if (char === FIELD_SEPARATOR) {
      endField();
      continue;
    }

    if (char === '\n') {
      endRecord();
      continue;
    }

    field += char;
  }

  // A file that doesn't end with a newline still has a final record; one that
  // does would otherwise emit a spurious empty trailing record.
  if (field.length > 0 || fieldWasQuoted || fields.length > 0) {
    endRecord();
  }

  return records;
}

/** True when a record carries no content at all (blank line). */
function isBlankRecord(record) {
  return record.every((value) => value.trim() === '');
}

/**
 * Drop the leading Anki metadata block.
 *
 * Anki prefixes exports with lines like "#separator:Comma", "#html:true" and
 * "#columns:Front,Back,Tags". They only ever appear *before* the header row,
 * so the scan stops at the first record that doesn't start with '#' — that
 * record is the header, and headers never begin with '#'.
 *
 * Everything after the header is left alone. Filtering the whole file instead
 * — as the previous implementation did — silently deleted any card whose
 * front began with '#', which is ordinary content for a programming deck
 * ("#include <stdio.h> does what?", "#1 rule of ...").
 *
 * Note the metadata line can itself contain commas ("#columns:Front,Back"),
 * so it may tokenize into several fields; only the first one is inspected.
 *
 * @param {Array<string[]>} records
 * @returns {Array<string[]>} records from the header row onward
 */
function stripMetadataPreamble(records) {
  let start = 0;

  while (start < records.length) {
    const record = records[start];
    if (isBlankRecord(record)) {
      start += 1;
      continue;
    }
    if (record[0].trim().startsWith('#')) {
      start += 1;
      continue;
    }
    break;
  }

  return records.slice(start);
}

/**
 * Build unique, lower-cased column keys from the header record.
 *
 * Duplicate names are suffixed rather than allowed to overwrite each other, so
 * a "Front,Back,Front" header keeps both columns instead of losing one.
 *
 * @param {string[]} headerRecord
 * @returns {string[]}
 */
function normaliseHeaders(headerRecord) {
  const seen = new Map();

  return headerRecord.map((raw, index) => {
    const base = raw.trim().toLowerCase() || `column${index + 1}`;
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

/**
 * Parse a CSV export into an array of objects keyed by lower-cased header name.
 *
 * Handles quoted fields, escaped double-quotes, fields containing commas or
 * newlines, and Anki's leading "#"-prefixed metadata lines.
 *
 * @param {string} text raw CSV file contents
 * @returns {Array<Object>} parsed records keyed by lower-cased header name
 */
function parseCSV(text) {
  if (!text || !text.trim()) return [];

  const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const records = stripMetadataPreamble(tokenize(normalised));
  if (records.length < 2) return [];

  const headers = normaliseHeaders(records[0]);
  const rows = [];

  for (let i = 1; i < records.length; i += 1) {
    const values = records[i];
    if (isBlankRecord(values)) continue;

    const row = {};
    headers.forEach((header, index) => {
      const value = values[index];
      row[header] = value === undefined ? '' : value.trim();
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Validate that parsed CSV records contain the minimum columns required for
 * flashcard import ("front" and "back"). "tags" and "hint" are optional.
 * @param {Array<Object>} records
 * @returns {string|null} a human-readable error, or null when valid
 */
function validateCSVHeaders(records) {
  if (!records || records.length === 0) {
    return 'The CSV file is empty or missing a header row';
  }
  const headers = Object.keys(records[0]);
  if (!headers.includes('front') || !headers.includes('back')) {
    return 'CSV must include "Front" and "Back" columns (Tags and Hint are optional)';
  }
  return null;
}

module.exports = { parseCSV, validateCSVHeaders };
