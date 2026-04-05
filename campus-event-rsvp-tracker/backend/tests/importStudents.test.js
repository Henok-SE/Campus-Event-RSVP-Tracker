const { parseCliArgs, parseStudentLine, parseStudentRecord } = require("../scripts/importStudents");

describe("importStudents script", () => {
  test("parses replace and dry-run flags with file path", () => {
    const parsed = parseCliArgs([
      "--replace",
      "--dry-run",
      "backend/data/Finalized Members 1 - Sheet1.pdf"
    ]);

    expect(parsed.replaceMode).toBe(true);
    expect(parsed.dryRunMode).toBe(true);
    expect(parsed.inputPath).toBe("backend/data/Finalized Members 1 - Sheet1.pdf");
  });

  test("parses valid student rows in both supported orders", () => {
    const idNameEmail = parseStudentLine("3001/18, Jane Doe, jane@campus.edu");
    const nameIdEmail = parseStudentLine("Jane Doe, 3001/18, jane@campus.edu");

    expect(idNameEmail).toEqual({
      student_id: "3001/18",
      name: "Jane Doe",
      email: "jane@campus.edu"
    });
    expect(nameIdEmail).toEqual({
      student_id: "3001/18",
      name: "Jane Doe",
      email: "jane@campus.edu"
    });
  });

  test("returns null for unsupported row shape", () => {
    expect(parseStudentLine("not,a,student,row")).toBeNull();
  });

  test("parses unstructured PDF-like record text", () => {
    const record = parseStudentRecord("Genene Fitsumfitsumgenene7@gmail.com0020/18");

     expect(record).toBeTruthy();
     expect(record.student_id).toBe("0020/18");
     expect(record.name).toBeTruthy();
     expect(record.email).toMatch(/@/);
  });

  test("parses multiline-style assembled text", () => {
    const record = parseStudentRecord("Abenezer Tizazu Degnet tizazuabenezer02@gmail.com0002/18");

    expect(record).toEqual({
      student_id: "0002/18",
      name: "Abenezer Tizazu Degnet",
      email: "tizazuabenezer02@gmail.com"
    });
  });
});
