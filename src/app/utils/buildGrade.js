export function buildGrade(marksObtained, maxMarks) {
  if (!maxMarks || maxMarks <= 0) return '';
  const percentage = (Number(marksObtained) / Number(maxMarks)) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  if (percentage >= 50) return 'E';
  return 'F';
}
