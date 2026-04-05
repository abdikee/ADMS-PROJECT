/**
 * Returns the list of class IDs assigned to a teacher.
 * Handles both assignedClassIds array and legacy single assignedClassId.
 */
export function getTeacherAssignedClassIds(teacher, classes = []) {
  if (!teacher) return [];

  // Prefer the multi-class array
  if (Array.isArray(teacher.assignedClassIds) && teacher.assignedClassIds.length > 0) {
    return teacher.assignedClassIds.map(String);
  }

  // Fall back to single assigned class
  if (teacher.assignedClassId) {
    return [String(teacher.assignedClassId)];
  }

  // Fall back to homeroom class
  if (teacher.homeroomClassId) {
    return [String(teacher.homeroomClassId)];
  }

  return [];
}

/**
 * Returns the class objects assigned to a teacher.
 */
export function getTeacherAssignedClasses(teacher, classes = []) {
  const ids = getTeacherAssignedClassIds(teacher, classes);
  if (ids.length === 0) return [];
  return classes.filter((cls) => ids.includes(String(cls.id)));
}

/**
 * Returns a display label for a class in the marks entry form.
 */
export function formatTeacherClassLabel(cls) {
  if (!cls) return '';
  const grade = cls.grade ? `Grade ${cls.grade}` : '';
  const section = cls.section ? ` (${cls.section})` : '';
  return `${cls.name}${grade ? ` - ${grade}` : ''}${section}`.trim();
}
