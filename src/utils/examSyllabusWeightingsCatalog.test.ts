/**
 * Unit Tests for Exam Syllabus Weightings Catalog Utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateSubjectStudyHoursAllocation, EXAM_SYLLABUS_WEIGHTINGS_CATALOG } from './examSyllabusWeightingsCatalog';

describe('ExamSyllabusWeightingsCatalog', () => {
  it('should calculate allocated study hours based on high-yield exam weightings', () => {
    const hours = calculateSubjectStudyHoursAllocation('Cardiovascular System', 100);
    expect(hours).toBe(14.0);
  });

  it('should contain catalog of high-yield exam syllabus weightings', () => {
    expect(EXAM_SYLLABUS_WEIGHTINGS_CATALOG.length).toBeGreaterThanOrEqual(4);
  });
});
