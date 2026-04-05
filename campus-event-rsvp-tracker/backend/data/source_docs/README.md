# Source Documents (Local Only)

Place sensitive student roster PDFs in this folder locally.

Do not commit real PDF files to git.

Expected default import file name:
- students.pdf

Import command:
- npm --prefix backend run db:import:students -- backend/data/source_docs/students.pdf

Expected row formats in PDF text:
- 2001/18, John Student, john.student@campus.edu
- John Student, 2001/18, john.student@campus.edu

Student ID format must be 1234/18.
