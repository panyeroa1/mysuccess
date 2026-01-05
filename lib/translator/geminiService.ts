import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { TranslationResult, EmotionType } from './types';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function warnMissingKey() {
  if (!apiKey) {
    console.warn('Missing NEXT_PUBLIC_GEMINI_API_KEY. Translator AI features are disabled.');
  }
}

/**
 * Deep Analysis Translation: Detects language, analyzes emotion,
 * provides grammar-corrected translation and phonetic vocabulary references.
 */
export async function translateAndAnalyze(
  text: string,
  targetLangName: string,
): Promise<TranslationResult> {
  if (!ai) {
    warnMissingKey();
    return {
      translatedText: text,
      detectedLanguage: 'unknown',
      emotion: 'neutral',
      pronunciationGuide: '',
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING },
            emotion: {
              type: Type.STRING,
              enum: ['neutral', 'joy', 'sadness', 'anger', 'fear', 'calm', 'excited'],
            },
            pronunciationGuide: {
              type: Type.STRING,
              description: 'Phonetic guidance and vocabulary references for native-like performance.',
            },
          },
          required: ['translatedText', 'detectedLanguage', 'emotion', 'pronunciationGuide'],
        },
      },
      contents: `You are a world-class linguist and emotional intelligence expert.
      Analyze the text provided:
      1. Detect the original language automatically.
      2. Translate it into ${targetLangName} using perfect grammar and cultural nuance.
      3. Identify the speaker's emotional state.
      4. Provide a "pronunciationGuide" which includes specific vocabulary hints or phonetic markers to ensure a native human-like reading.

      Text to translate: "${text}"`,
    });

    return JSON.parse(response.text || '{}') as TranslationResult;
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      translatedText: text,
      detectedLanguage: 'unknown',
      emotion: 'neutral',
      pronunciationGuide: '',
    };
  }
}

/**
 * Live API Session for Expressive "Native Read Aloud".
 * Uses Gemini 2.5 Flash Native Audio for hyper-realistic human speech.
 * Strictly "read-only" (mic disabled in this session).
 */
export async function playLiveReadAloud(
  text: string,
  emotion: EmotionType,
  targetLangName: string,
  pronunciationGuide: string,
  audioCtx: AudioContext,
  onAudioData: (data: Uint8Array) => void,
  onEnd: () => void,
) {
  if (!ai) {
    warnMissingKey();
    onEnd();
    return;
  }

  let nextStartTime = 0;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
      },
      systemInstruction: `You are a native speaker of ${targetLangName}.
      Read the text provided with a/an ${emotion} tone.
      GRAMMAR & STYLE: Use native prosody, natural pauses, and perfect grammar.
      PHONETIC GUIDANCE: ${pronunciationGuide}
      BEHAVIOR: Act like a human interpreter. Do not sound like a computer.
      Only read the text provided, never add your own comments.`,
    },
    callbacks: {
      onopen: () => {
        sessionPromise.then((s) =>
          s.sendClientContent({
            turns: [{ parts: [{ text }] }],
          }),
        );
      },
      onmessage: async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
          const rawData = decode(base64Audio);
          onAudioData(rawData);

          nextStartTime = Math.max(nextStartTime, audioCtx.currentTime);
          const buffer = await decodeAudioData(rawData, audioCtx);
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);

          source.start(nextStartTime);
          nextStartTime += buffer.duration;
        }

        if (message.serverContent?.turnComplete) {
          const waitTime = Math.max(0, (nextStartTime - audioCtx.currentTime) * 1000);
          setTimeout(onEnd, waitTime + 200);
        }
      },
      onclose: () => onEnd(),
      onerror: () => onEnd(),
    },
  });
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
