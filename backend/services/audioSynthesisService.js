const podcastScriptService = require('./podcastScriptService');

class AudioSynthesisService {
  /**
   * Synthesizes audio metadata and WebVTT chapter tracks
   */
  generateEpisodeData(items = [], options = {}) {
    const { title = 'Study Podcast', thinkTimeSeconds = 5, subject = 'General' } = options;
    const scriptData = podcastScriptService.generatePodcastScript(items, title, thinkTimeSeconds);

    const vtt = this.generateWebVTT(scriptData.chapters);

    return {
      title,
      subject,
      durationSeconds: scriptData.totalDurationSeconds,
      cadenceSeconds: thinkTimeSeconds,
      chapters: scriptData.chapters,
      script: scriptData.script,
      vttTrack: vtt,
    };
  }

  /**
   * Generates standard WebVTT subtitle/cue track
   */
  generateWebVTT(chapters = []) {
    const formatTime = (secs) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `00:${m}:${s}.000`;
    };

    let vtt = ['WEBVTT', ''];
    chapters.forEach((ch, idx) => {
      vtt.push(`${idx + 1}`);
      vtt.push(`${formatTime(ch.startTime)} --> ${formatTime(ch.endTime)}`);
      vtt.push(ch.title);
      vtt.push('');
    });

    return vtt.join('\n');
  }
}

module.exports = new AudioSynthesisService();
