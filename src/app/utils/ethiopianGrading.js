/**
 * Ethiopian Curriculum Grading System
 * 
 * Based on the Ethiopian General Secondary Education Certificate standards
 * as defined by the Ministry of Education.
 * 
 * Reference: https://www.scholaro.com/pro/Countries/Ethiopia/Grading-System
 * 
 * Grading Scale:
 * - A (90-100%): Excellent
 * - B (80-89.99%): Very Good
 * - C (60-79.99%): Good
 * - D (50-59.99%): Satisfactory (Minimum Passing Grade)
 * - F (0-49.99%): Failure
 * 
 * Passing Mark: 50%
 * 
 * This system applies to:
 * - Primary Education (Grades 1-8)
 * - Secondary Education (Grades 9-12)
 */

export const ETHIOPIAN_GRADING_SCALE = {
  A: { min: 90, max: 100, description: 'Excellent', status: 'PASS' },
  B: { min: 80, max: 89.99, description: 'Very Good', status: 'PASS' },
  C: { min: 60, max: 79.99, description: 'Good', status: 'PASS' },
  D: { min: 50, max: 59.99, description: 'Satisfactory', status: 'PASS' },
  F: { min: 0, max: 49.99, description: 'Failure', status: 'FAIL' }
};

export const PASSING_PERCENTAGE = 50;

/**
 * Calculate letter grade based on percentage
 * @param {number} percentage - The percentage score (0-100)
 * @returns {string} Letter grade (A, B, C, D, or F)
 */
export function getLetterGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

/**
 * Calculate letter grade from marks obtained and maximum marks
 * @param {number} marksObtained - Marks scored by student
 * @param {number} maxMarks - Maximum possible marks
 * @returns {string} Letter grade (A, B, C, D, or F)
 */
export function buildGrade(marksObtained, maxMarks) {
  if (!maxMarks || maxMarks <= 0) return '';
  const percentage = (Number(marksObtained) / Number(maxMarks)) * 100;
  return getLetterGrade(percentage);
}

/**
 * Get grade description
 * @param {string} grade - Letter grade (A, B, C, D, or F)
 * @returns {string} Description of the grade
 */
export function getGradeDescription(grade) {
  return ETHIOPIAN_GRADING_SCALE[grade]?.description || '';
}

/**
 * Check if a percentage is passing
 * @param {number} percentage - The percentage score
 * @returns {boolean} True if passing (>= 50%), false otherwise
 */
export function isPassing(percentage) {
  return percentage >= PASSING_PERCENTAGE;
}

/**
 * Get pass/fail status from percentage
 * @param {number} percentage - The percentage score
 * @returns {string} 'PASS' or 'FAIL'
 */
export function getStatus(percentage) {
  return isPassing(percentage) ? 'PASS' : 'FAIL';
}

/**
 * Get grade color for UI display
 * @param {string} grade - Letter grade
 * @returns {string} Tailwind CSS color class
 */
export function getGradeColor(grade) {
  const colors = {
    A: 'text-green-600',
    B: 'text-blue-600',
    C: 'text-yellow-600',
    D: 'text-orange-600',
    F: 'text-red-600'
  };
  return colors[grade] || 'text-gray-600';
}

/**
 * Get all grading scale information
 * @returns {Array} Array of grade scale objects
 */
export function getGradingScale() {
  return Object.entries(ETHIOPIAN_GRADING_SCALE).map(([grade, info]) => ({
    grade,
    ...info
  }));
}
