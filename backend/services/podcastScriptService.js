class PodcastScriptService {
  /**
   * Transforms flashcard items or study notes into a conversational active-recall podcast script
   */
  generatePodcastScript(items = [], title = 'Flashcard Audio Sprint', thinkTimeSeconds = 5) {
    const script = [];
    const chapters = [];
    let currentTimestamp = 0;

    // Intro
    const introText = `Welcome to your OpenPrep audio review session for ${title}. We will cover ${items.length} key concepts. When you hear the chime, pause and recall the answer before the explanation. Let's begin.`;
    script.push({
      speaker: 'HOST',
      text: introText,
      startSec: currentTimestamp,
      durationSec: 10,
    });
    currentTimestamp += 10;

    items.forEach((item, index) => {
      const chapterStart = currentTimestamp;
      const questionPrompt = `Concept number ${index + 1}: ${item.front || item.question || item.title}`;
      
      // Question block
      script.push({
        speaker: 'HOST',
        type: 'QUESTION',
        itemIndex: index,
        text: questionPrompt,
        startSec: currentTimestamp,
        durationSec: 6,
      });
      currentTimestamp += 6;

      // Thinking pause interval
      script.push({
        speaker: 'SYSTEM',
        type: 'THINK_PAUSE',
        durationSec: thinkTimeSeconds,
        startSec: currentTimestamp,
      });
      currentTimestamp += thinkTimeSeconds;

      // Answer block
      const answerPrompt = `Answer: ${item.back || item.answer || item.summary || 'Review complete.'}`;
      script.push({
        speaker: 'HOST',
        type: 'ANSWER',
        itemIndex: index,
        text: answerPrompt,
        startSec: currentTimestamp,
        durationSec: 8,
      });
      currentTimestamp += 8;

      chapters.push({
        title: (item.front || item.question || `Concept ${index + 1}`).substring(0, 40),
        startTime: chapterStart,
        endTime: currentTimestamp,
      });
    });

    // Outro
    script.push({
      speaker: 'HOST',
      text: 'Great work! You have completed this active recall audio session. Consistent recall strengthens memory stability.',
      startSec: currentTimestamp,
      durationSec: 6,
    });
    currentTimestamp += 6;

    return {
      title,
      totalDurationSeconds: currentTimestamp,
      cadenceSeconds: thinkTimeSeconds,
      chapters,
      script,
    };
  }
}

module.exports = new PodcastScriptService();
