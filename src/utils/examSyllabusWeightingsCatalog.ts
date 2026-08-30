/**
 * Medical & Engineering Exam Syllabus High-Yield Weightings Catalog
 */

export const EXAM_SYLLABUS_WEIGHTINGS_CATALOG = [
  { examCode: 'USMLE_STEP_1', subjectName: 'Cardiovascular System', highYieldWeightPercent: 14.0 },
  { examCode: 'USMLE_STEP_1', subjectName: 'Renal & Urinary System', highYieldWeightPercent: 9.0 },
  { examCode: 'USMLE_STEP_1', subjectName: 'Microbiology & Immunology', highYieldWeightPercent: 12.0 },
  { examCode: 'GATE_CS', subjectName: 'Data Structures & Algorithms', highYieldWeightPercent: 20.0 },
];

/**
 * Calculates recommended study hours allocated per subject based on high-yield weighting.
 */
export function calculateSubjectStudyHoursAllocation(
  subjectName: string,
  totalStudyHoursAvailable: number
): number {
  const match = EXAM_SYLLABUS_WEIGHTINGS_CATALOG.find(item => item.subjectName === subjectName);
  const weight = match ? match.highYieldWeightPercent : 10.0;
  return Math.round((totalStudyHoursAvailable * (weight / 100.0)) * 10) / 10;
}
