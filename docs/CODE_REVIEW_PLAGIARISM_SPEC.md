# OpenPrep AI Code Review & Plagiarism Engine Specification

## System Architecture

```
+-------------------------------------------------------------+
|               Student Code Submission Engine                |
+-------------------------------------------------------------+
   |                                                        |
   v                                                        v
+-----------------------------+              +-----------------------------+
|    AST Token Normalization  |              |   Static & Complexity Probe |
| (Identifier Abstraction)    |              | (Cyclomatic & Halstead)     |
+--------------+--------------+              +--------------+--------------+
               |                                            |
               v                                            v
+-----------------------------+              +-----------------------------+
|   Winnowing Fingerprinting  |              |     AI Review Evaluator     |
| (Rabin-Karp Rolling Hashes) |              |  (Time/Space Complexity)    |
+--------------+--------------+              +--------------+--------------+
               |                                            |
               +----------------------+---------------------+
                                      |
                                      v
                       +-----------------------------+
                       | Visual Diff & Similarity UI |
                       +-----------------------------+
```

## Winnowing Fingerprinting Algorithm
1. Tokenize source code into abstract structural tokens (`KW_IF`, `ID_1`, `STR_LIT`).
2. Generate $k$-grams of token sequences ($k = 5$).
3. Hash each $k$-gram using MD5/Rabin-Karp.
4. Apply sliding window of size $w = 4$ selecting the minimum hash in each window to form an immutable, size-reduced fingerprint.
5. Compute pairwise Jaccard Similarity against historical cohort submissions:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|} \times 100\%$$
