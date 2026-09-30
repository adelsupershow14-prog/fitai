// Voice Feedback Service with Voice Trainer Toggle & Emoji Stripping

/**
 * Strips all emoji and extended pictographs to prevent TTS engines from reading out emoji names
 */
export function cleanSpeechText(text) {
  if (!text) return '';
  return text
    // Remove all Unicode emojis and extended pictographs
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu, '')
    // Remove decorative symbols, dingbats, arrows and miscellaneous symbols
    .replace(/[\u2190-\u21FF\u2300-\u23FF\u2600-\u27BF\u2B50\u2B55\u3030\u303D]/gu, '')
    // Clean up multiple spaces and trim
    .replace(/\s+/g, ' ')
    .trim();
}

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.audioCtx = null;
    this.lastSpokenText = '';
    this.lastSpokenTime = 0;
    this.isVoiceEnabled = true;
  }

  setVoiceEnabled(enabled) {
    this.isVoiceEnabled = enabled;
    if (!enabled && this.synth) {
      this.stop();
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.warn('Speech cancellation error:', e);
      }
    }
  }

  initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  speak(text, priority = false, onEnd = null) {
    if (!this.isVoiceEnabled || !this.synth) {
      return;
    }

    const cleanedText = cleanSpeechText(text);
    if (!cleanedText) {
      if (onEnd) onEnd();
      return;
    }

    const now = Date.now();
    if (!priority && cleanedText === this.lastSpokenText && now - this.lastSpokenTime < 3500) {
      return;
    }

    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      this.lastSpokenText = cleanedText;
      this.lastSpokenTime = now;

      let handled = false;
      if (onEnd) {
        utterance.onend = (e) => {
          if (!handled) {
            handled = true;
            onEnd(e);
          }
        };
        utterance.onerror = (e) => {
          if (!handled) {
            handled = true;
            // Only trigger callback if not deliberately cancelled
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
              onEnd(e);
            }
          }
        };
      }

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis speak error:', err);
      if (onEnd) onEnd(err);
    }
  }

  playRepChime(isPerfect = true) {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isPerfect ? 587.33 : 440, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isPerfect ? 880 : 523.25, this.audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch (err) {
      console.warn('Audio chime error:', err);
    }
  }

  playRestCompleteChime() {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      [523.25, 659.25, 783.99].forEach((freq, index) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + index * 0.1 + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + index * 0.1);
        osc.stop(this.audioCtx.currentTime + index * 0.1 + 0.2);
      });
    } catch (err) {
      console.warn('Rest chime error:', err);
    }
  }
}

export const voiceService = new VoiceService();
