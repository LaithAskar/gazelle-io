interface StudentOwnershipRecord {
  parent_id: string;
}

interface SessionOwnershipRecord {
  student_id: string;
}

/** Missing records and mismatched parents are both denied by default. */
export function isOwnedStudent(
  parentId: string,
  student: StudentOwnershipRecord | null | undefined,
): student is StudentOwnershipRecord {
  return Boolean(parentId && student && student.parent_id === parentId);
}

/** A session is usable only when it belongs to the already-authorized student. */
export function isSessionForStudent(
  studentId: string,
  session: SessionOwnershipRecord | null | undefined,
): session is SessionOwnershipRecord {
  return Boolean(studentId && session && session.student_id === studentId);
}
