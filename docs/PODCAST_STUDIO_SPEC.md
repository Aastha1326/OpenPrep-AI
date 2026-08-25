# OpenPrep AI Audio Podcast Studio & Spaced Repetition Commuter Mode

## Overview & Architecture

```
+-------------------------------------------------------------+
|               Flashcard Deck / Topic Summary                |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                 Podcast Script Orchestrator                 |
| - Question Prompt Delivery                                  |
| - Configurable Silent Thinking Interval (3s - 12s)          |
| - Answer & Conceptual Elaboration                           |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              Audio Synthesis & Chapter Engine               |
| - Web Speech / TTS Voice Modulation                         |
| - WebVTT Chapter Timecodes                                  |
| - HTML5 Audio & navigator.mediaSession Lockscreen Controls  |
+-------------------------------------------------------------+
```

## Audio Cadence Sequencing
1. **Intro Host Narrative**: Greets student, introduces topic scope and card count.
2. **Concept Cue**: States the question prompt with clear auditory inflection.
3. **Chime & Think Interval**: Configurable active-recall pause (default 5s) prompting student mental retrieval.
4. **Detailed Solution**: Explains correct answer and context.
5. **Outro Summary**: Recaps session and updates spaced repetition score.
