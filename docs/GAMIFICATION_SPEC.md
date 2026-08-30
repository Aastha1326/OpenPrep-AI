# OpenPrep AI Gamification & Retention Specification

## System Architecture

```
+-------------------------------------------------------------+
|                      Gamification Engine                    |
+-------------------------------------------------------------+
   |                        |                      |
   v                        v                      v
+------------+       +-------------+        +---------------+
| XP & Levels|       | Badges / DB |        | Streak Freezes|
+------------+       +-------------+        +---------------+
   |                        |                      |
   +------------------------+----------------------+
                            |
                            v
               +--------------------------+
               |  UI Celebration & Grid   |
               +--------------------------+
```

## Level Progression Formula
$$Level = \lfloor\sqrt{\frac{XP}{100}}\rfloor + 1$$

## Tiered Badge Categories
1. **STREAK**: Rewarding daily active study consistency (Ignition -> Centurion).
2. **QUIZ**: Rewarding mastery, question completion volume, and accuracy.
3. **STUDY_TIME**: Rewarding dedicated focus session hours.
4. **MASTERY**: Rewarding spaced repetition recall efficiency.

## Streak Freezes & Economy
- **Inventory Limit**: Up to 3 streak freezes per account.
- **Acquisition**: Can be unlocked at major milestone levels or purchased with 300 XP.
- **Activation**: Automatically shields an active streak when an active study day is missed.
