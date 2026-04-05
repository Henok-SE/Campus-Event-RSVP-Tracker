const STUDENT_ID_PATTERN = /^\d{4}\/\d{2}$/;

const normalizeStudentId = (value = "") => String(value).trim().replace(/\s+/g, "");

const isValidStudentId = (value = "") => STUDENT_ID_PATTERN.test(normalizeStudentId(value));

module.exports = {
  STUDENT_ID_PATTERN,
  normalizeStudentId,
  isValidStudentId
};
