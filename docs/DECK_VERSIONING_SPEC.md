# OpenPrep AI Peer-to-Peer Flashcard Deck Forking & Version Control Engine

## Architecture

```
+-------------------------------------------------------------+
|                Parent Public Deck (@author)                 |
+-------------------------------------------------------------+
                              |
                              | (Fork Deck)
                              v
+-------------------------------------------------------------+
|               Student Forked Deck (@student)                |
+-------------------------------------------------------------+
                              |
                              | (Submit Change Proposal)
                              v
+-------------------------------------------------------------+
|                 Deck Change Proposal / PR                   |
| - 3-Way Card Diff Engine (ADDED / MODIFIED / DELETED)       |
| - Visual Git-Style Diffs                                    |
| - 1-Click Author Merge Integration                          |
+-------------------------------------------------------------+
```

## 3-Way Card Diff Resolution
1. Cards mapped by stable UUID/front key.
2. Identifies cards present only in candidate (`ADDED`).
3. Identifies content/answer discrepancies (`MODIFIED`).
4. Identifies cards removed from original set (`DELETED`).
5. Allows deck owners to review atomic card proposals with diff highlights and merge directly.
