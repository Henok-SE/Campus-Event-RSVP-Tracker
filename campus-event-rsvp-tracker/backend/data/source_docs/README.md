# Source Documents (Local Only)

Place sensitive student roster PDFs in this folder locally.

Do not commit real PDF files to git.

Expected default import file name:
- students.pdf

Import command:
- npm --prefix backend run db:import:students -- backend/data/source_docs/students.pdf
