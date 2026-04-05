# Source Documents (Local Only)

Place sensitive student roster PDFs in this folder locally.

Do not commit real PDF files to git.

Expected default import file name:
- students.pdf

Import command:
- npm --prefix backend run db:import:students -- data/source_docs/students.pdf

Strict replace import command (recommended):
- npm --prefix backend run db:import:students:finalized:replace

Dry-run command for preview:
- npm --prefix backend run db:import:students:finalized:dry-run

Current canonical roster file:
- backend/data/Finalized Members 1 - Sheet1.pdf

Expected row formats in PDF text:
- 2001/18, John Student, john.student@campus.edu
- John Student, 2001/18, john.student@campus.edu

Student ID format must be 1234/18.
