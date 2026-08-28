# OpenPrep AI Foreign Language Conjugator & Grammar Dependency Tree Engine

## Architecture

```
+-------------------------------------------------------------+
|              Language Grammar & Syntax Studio               |
+-------------------------------------------------------------+
   |                                                        |
   v                                                        v
+-----------------------------+              +-----------------------------+
| Multi-Lingual Conjugation   |              | Sentence Syntax Dependency  |
| Matrix Engine (ES, FR, DE)  |              | Tree Parser & POS Tagging   |
+--------------+--------------+              +--------------+--------------+
               |                                            |
               +----------------------+---------------------+
                                      |
                                      v
+-------------------------------------------------------------+
| Active Recall Drill Table & Levenshtein Diff Feedback       |
+-------------------------------------------------------------+
```

## Features
- **Conjugation Matrix**: Full paradigms across Present, Preterite, Imperfect tenses.
- **POS Dependency Hierarchy**: Visual node-link tree showing subject-verb-object relationships.
- **Typo & Accent Diffing**: Detects missing accents (á, é, í, ó, ú) and single-letter errors.
