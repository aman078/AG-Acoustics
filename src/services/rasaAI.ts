import { RAGAS_DATABASE, Raga } from '../data/ragas';

export interface RasaAnalysisResult {
  primaryRaga: Raga;
  secondaryRaga: Raga;
  detectedEmotion: string;
  detectedKeywords: string[];
  empatheticReflection: string;
  timeContext: string;
  userPromptPreview: string;
}

// Global browser SpeechRecognition interface
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

/**
 * Native Speech-to-Text Listener
 */
export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }
        if (this.onResultCallback) {
          this.onResultCallback(transcript, isFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error || 'Speech recognition error');
        }
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public start(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }
    if (this.isListening) return;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onEndCallback = onEnd || null;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn('Speech start error:', e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();

/**
 * Get current time of day label and hour
 */
export function getCurrentTimeContext(): { hour: number; label: string; period: string } {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 9) {
    return { hour, label: 'Dawn & Early Morning', period: 'Morning Prahar' };
  } else if (hour >= 9 && hour < 12) {
    return { hour, label: 'Late Morning Sun', period: 'Morning Prahar' };
  } else if (hour >= 12 && hour < 16) {
    return { hour, label: 'Bright Afternoon', period: 'Afternoon Prahar' };
  } else if (hour >= 16 && hour < 19) {
    return { hour, label: 'Sunset & Dusk (Sandhya)', period: 'Twilight Prahar' };
  } else if (hour >= 19 && hour < 22) {
    return { hour, label: 'Quiet Evening', period: 'Evening Prahar' };
  } else if (hour >= 22 || hour < 2) {
    return { hour, label: 'Late Night', period: 'Night Prahar' };
  } else {
    return { hour, label: 'Deep Midnight & Pre-Dawn', period: 'Midnight Prahar' };
  }
}

/**
 * Analyze user's emotional story & match to authentic Indian Raags
 */
export function analyzeMoodAndMatchRaag(storyText: string): RasaAnalysisResult {
  const textClean = storyText.toLowerCase().trim();
  const timeContext = getCurrentTimeContext();
  const currentHour = timeContext.hour;

  // Emotional keyword scoring maps
  const scores: Record<string, number> = {};
  RAGAS_DATABASE.forEach((r) => {
    scores[r.id] = 0;

    // 1. Time of day affinity (+3 points if matches current natural hours)
    const [startH, endH] = r.idealHours;
    if (startH <= endH) {
      if (currentHour >= startH && currentHour <= endH) scores[r.id] += 3.5;
    } else {
      // Overnight range, e.g. 23 to 2
      if (currentHour >= startH || currentHour <= endH) scores[r.id] += 3.5;
    }
  });

  // Emotional Keyword dictionary mapping to specific raag flavors
  const keywordMappings: Record<string, string[]> = {
    yaman: [
      'peace', 'peaceful', 'calm', 'serene', 'sunset', 'evening', 'love', 'grateful',
      'romantic', 'relax', 'relaxed', 'unwind', 'soothing', 'gentle', 'blessed', 'happy', 'sweet'
    ],
    bhairavi: [
      'sad', 'sadness', 'crying', 'cry', 'tears', 'alone', 'lonely', 'breakup', 'heartbreak',
      'hurt', 'pain', 'exhausted', 'tired', 'drained', 'letting go', 'miss', 'missing', 'longing',
      'nostalgic', 'solace', 'bittersweet', 'melancholy', 'lost', 'burnout', 'traffic', 'stress'
    ],
    darbari: [
      'midnight', 'insomnia', 'cant sleep', 'dark', 'heavy', 'existential', 'deep', 'overwhelmed',
      'thoughts', 'overthinking', 'heavy heart', 'anxious', 'alone in the dark', 'hollow', 'storm', 'night'
    ],
    kafi: [
      'rain', 'raining', 'monsoon', 'earth', 'wet', 'blues', 'groove', 'chill', 'playful',
      'coffee', 'cozy', 'winter', 'cloudy', 'jam', 'creative', 'alive', 'vibe'
    ],
    bhopali: [
      'confident', 'inspired', 'hope', 'hopeful', 'clear', 'light', 'clean', 'victorious',
      'triumphant', 'energy', 'fresh', 'proud', 'simple', 'honest', 'uplifted'
    ],
    malkauns: [
      'meditation', 'meditating', 'trance', 'silence', 'silent', 'spiritual', 'mystic', 'mystery',
      'intense', 'focus', 'deep work', 'cosmos', 'universe', 'void', 'hypnotic'
    ],
    khamaj: [
      'warm', 'flirtatious', 'spark', 'cozy', 'crush', 'butterflies', 'charming', 'nostalgia',
      'reminiscing', 'old memories', 'laughter', 'candle', 'date'
    ],
    bilawal: [
      'morning', 'fresh start', 'dawn', 'sunrise', 'wake up', 'motivated', 'gym', 'workout',
      'new day', 'excited', 'ready', 'clarity', 'sunshine', 'bright'
    ]
  };

  const detectedKeywords: string[] = [];

  // Score keywords found in user story
  Object.entries(keywordMappings).forEach(([raagId, words]) => {
    words.forEach((w) => {
      // Regex check for word boundary
      const regex = new RegExp(`\\b${w}\\b`, 'i');
      if (regex.test(textClean)) {
        scores[raagId] = (scores[raagId] || 0) + 2.5;
        if (!detectedKeywords.includes(w)) {
          detectedKeywords.push(w);
        }
      }
    });
  });

  // Sort raags by matched score
  const sortedRaags = [...RAGAS_DATABASE].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  const primaryRaga = sortedRaags[0] || RAGAS_DATABASE[0];
  const secondaryRaga = sortedRaags[1] || RAGAS_DATABASE[1];

  // Synthesize custom empathetic reflection
  let reflection = '';
  if (primaryRaga.id === 'bhairavi') {
    reflection = 'We sense the weight you’ve been carrying today. Bhairavi is your sanctuary tonight—let its gentle minor notes wrap around your tiredness and bring you solace.';
  } else if (primaryRaga.id === 'yaman') {
    reflection = 'You’re seeking peace and emotional warmth. Yaman is the classic evening sunset melody, designed to slow your heartbeat and fill the room with serene gratitude.';
  } else if (primaryRaga.id === 'darbari') {
    reflection = 'Your mind is active and deep in thought late at night. Darbari Kanada was played for midnight emperors to still their racing thoughts into deep royal stillness.';
  } else if (primaryRaga.id === 'kafi') {
    reflection = 'There is an earthy, reflective groove in how you feel. Kafi mirrors the warmth of rain on the windowpane—soulful, grounded, and playfully honest.';
  } else if (primaryRaga.id === 'bhopali') {
    reflection = 'You are seeking clarity and inner confidence. Bhopali clears all clutter with 5 pure, uplifting notes that inspire honest momentum.';
  } else if (primaryRaga.id === 'malkauns') {
    reflection = 'You are in a meditative, searching space. Malkauns takes you beyond everyday surface thoughts into deep midnight stillness.';
  } else if (primaryRaga.id === 'khamaj') {
    reflection = 'There is a warm, nostalgic charm in your feeling. Khamaj weaves sweet memories and romantic warmth like candlelight in a quiet room.';
  } else {
    reflection = 'A fresh energy is calling you. Bilawal mirrors the pure clarity of the morning sun cutting through the mist, ready for a new chapter.';
  }

  let emotionLabel = primaryRaga.rasa;
  if (detectedKeywords.length > 0) {
    emotionLabel = `${detectedKeywords.slice(0, 3).map((w) => w.toUpperCase()).join(' • ')} (${primaryRaga.rasa.split('(')[0].trim()})`;
  }

  return {
    primaryRaga,
    secondaryRaga,
    detectedEmotion: emotionLabel,
    detectedKeywords,
    empatheticReflection: reflection,
    timeContext: `${timeContext.label} (${timeContext.period})`,
    userPromptPreview: storyText.length > 80 ? storyText.slice(0, 80) + '...' : storyText
  };
}
