# OpenPrep AI Academic Citation Manager & Reference Engine

## Architecture Overview

```
       +--------------------------------------------+
       |   Note / Study Material Rich Text Editor   |
       +---------------------+----------------------+
                             | (Insert in-text cite)
                             v
       +--------------------------------------------+
       |          Citation Manager Modal            |
       +---------------------+----------------------+
                             |
         +-------------------+--------------------+
         |                                        |
         v                                        v
+------------------+                    +------------------+
| CrossRef REST API|                    | OpenAlex REST API|
|  (DOI Resolver)  |                    | (Metadata Mirror)|
+--------+---------+                    +--------+---------+
         |                                        |
         +-------------------+--------------------+
                             |
                             v
               +----------------------------+
               |  Citation Formatter Engine |
               | (APA, IEEE, MLA, BibTeX)   |
               +-------------+--------------+
                             |
                             v
               +----------------------------+
               | PostgreSQL Citation Store  |
               +----------------------------+
```

## Supported Citation Standards
1. **APA 7th Edition**: Standard author-date citation format for social and computer science.
2. **IEEE**: Numerical in-text citation `[1]` with numbered reference list for engineering.
3. **MLA 9th Edition**: Humanities-focused author-page formatting.
4. **BibTeX (`.bib`)**: Direct raw export for LaTeX compiler integration.
5. **RIS (`.ris`)**: Standard format for Zotero, Mendeley, and EndNote.
