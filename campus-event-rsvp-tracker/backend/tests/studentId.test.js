const { normalizeStudentId, isValidStudentId } = require("../utils/studentId");

describe("studentId utility", () => {
  test("normalizes whitespace around slash", () => {
    expect(normalizeStudentId(" 1234 / 18 ")).toBe("1234/18");
  });

  test("accepts strict 1234/18 shape", () => {
    expect(isValidStudentId("1234/18")).toBe(true);
  });

  test("rejects old STU- style IDs", () => {
    expect(isValidStudentId("STU-1001")).toBe(false);
  });

  test("rejects malformed ids", () => {
    expect(isValidStudentId("1234-18")).toBe(false);
    expect(isValidStudentId("12/18")).toBe(false);
    expect(isValidStudentId("abcd/18")).toBe(false);
  });
});
