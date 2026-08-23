# Ebbinghaus Forgetting Curve & Memory Decay Modeling

## Mathematical Formulation

The retention rate $R$ after elapsed time $t$ given memory stability $S$ is modeled as:

$$R(t) = e^{-\frac{t}{S}}$$

Where:
- $R \in [0, 1]$ represents retention probability / recall likelihood.
- $t \ge 0$ is time in days since the last active recall session.
- $S > 0$ is the memory stability factor (days until retention decays to $e^{-1} \approx 36.8\%$).

```
100% |  \
     |   \
 80% |----\--- Optimal Review Window (Target R = 85%)
     |     \
 40% |------\-- Danger Zone
  0% +-----------------------------
     0   2   4   6   8  10  12  14 Days
```

## Review Scheduling
Optimal review interval $t_{opt}$ to trigger revision before retention falls below $R_{target}$:

$$t_{opt} = -S \cdot \ln(R_{target})$$

## Stability Adaptation
- **Grade 0 (Blackout)**: $S_{new} = \max(1, S_{prev} \times 0.4)$
- **Grade 1 (Hard)**: $S_{new} = \max(1.2, S_{prev} \times 0.9)$
- **Grade 2 (Good)**: $S_{new} = S_{prev} \times 1.5$
- **Grade 3 (Easy)**: $S_{new} = S_{prev} \times 2.2$
