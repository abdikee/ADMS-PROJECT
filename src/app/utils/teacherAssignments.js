export function getTeacherAssignedClassIds(teacher, classes = []) {
  const directIds = Array.isArray(teacher?.assignedClassIds)
    ? teacher.assignedClassIds.map((value) => String(value)).filter(Boolean)
    : teacher?.assignedClassId
      ? [String(teacher.assignedClassId)]
      : [];

  if (directIds.length > 0) {
    return [...new Set(directIds)];
  }

  const assignedNames = Array.isArray(teacher?.assignedClassNames)
    ? teacher.assignedClassNames
    : teacher?.assignedClassName
      ? [teacher.assignedClassName]
      : [];

  if (assignedNames.length === 0) {
    return [];
  }

  const normalizedNames = assignedNames.map((value) => String(value).trim().toLowerCase()).filter(Boolean);

  return classes
    .filter((classItem) => normalizedNames.includes(String(classItem.name || '').trim().toLowerCase()))
    .map((classItem) => String(classItem.id));
}

export function getTeacherAssignedClasses(teacher, classes = []) {
  const assignedIds = getTeacherAssignedClassIds(teacher, classes);

  return classes.filter((classItem) => assignedIds.includes(String(classItem.id)));
}

export function formatTeacherClassLabel(classItem) {
  if (!classItem) return '';

  const gradeLabel = classItem.grade ? `Grade ${classItem.grade}` : '';
  const sectionLabel = classItem.section ? ` (${classItem.section})` : '';

  return [classItem.name, gradeLabel ? `- ${gradeLabel}${sectionLabel}` : sectionLabel]
    .filter(Boolean)
    .join(' ')
    .trim();
}
