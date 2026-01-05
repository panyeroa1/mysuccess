export type AppMode = 'idle' | 'speaking' | 'listening';
export type ListenPreference = 'raw' | 'translated';
export type AudioSource = 'mic' | 'system';

export type EmotionType = 'neutral' | 'joy' | 'sadness' | 'anger' | 'fear' | 'calm' | 'excited';

export interface SpeakerInfo {
  userId: string;
  userName: string;
  sessionId: string;
  since: number;
}

export interface QueueEntry {
  userId: string;
  userName: string;
  requestedAt: number;
}

export interface Caption {
  id: string;
  text: string;
  sourceLang: string;
  speakerUserId: string;
  speakerName: string;
  timestamp: number;
  isFinal: boolean;
  emotion?: EmotionType;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  emotion: EmotionType;
  pronunciationGuide: string;
}

export const LANGUAGES: Language[] = [
  // --- English World ---
  { code: 'en-US', name: 'English (United States)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', flag: '🇬🇧' },
  { code: 'en-CA', name: 'English (Canada)', flag: '🇨🇦' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-NZ', name: 'English (New Zealand)', flag: '🇳🇿' },
  { code: 'en-IE', name: 'English (Ireland)', flag: '🇮🇪' },
  { code: 'en-ZA', name: 'English (South Africa)', flag: '🇿🇦' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'en-PH', name: 'English (Philippines)', flag: '🇵🇭' },
  { code: 'en-SG', name: 'English (Singapore)', flag: '🇸🇬' },
  { code: 'en-MY', name: 'English (Malaysia)', flag: '🇲🇾' },
  { code: 'en-HK', name: 'English (Hong Kong)', flag: '🇭🇰' },
  { code: 'en-KE', name: 'English (Kenya)', flag: '🇰🇪' },
  { code: 'en-GH', name: 'English (Ghana)', flag: '🇬🇭' },
  { code: 'en-NG', name: 'English (Nigeria)', flag: '🇳🇬' },
  { code: 'en-PK', name: 'English (Pakistan)', flag: '🇵🇰' },

  // --- Spanish World ---
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'es-US', name: 'Spanish (United States)', flag: '🇺🇸' },
  { code: 'es-AR', name: 'Spanish (Argentina)', flag: '🇦🇷' },
  { code: 'es-BO', name: 'Spanish (Bolivia)', flag: '🇧🇴' },
  { code: 'es-CL', name: 'Spanish (Chile)', flag: '🇨🇱' },
  { code: 'es-CO', name: 'Spanish (Colombia)', flag: '🇨🇴' },
  { code: 'es-CR', name: 'Spanish (Costa Rica)', flag: '🇨🇷' },
  { code: 'es-CU', name: 'Spanish (Cuba)', flag: '🇨🇺' },
  { code: 'es-DO', name: 'Spanish (Dominican Republic)', flag: '🇩🇴' },
  { code: 'es-EC', name: 'Spanish (Ecuador)', flag: '🇪🇨' },
  { code: 'es-SV', name: 'Spanish (El Salvador)', flag: '🇸🇻' },
  { code: 'es-GT', name: 'Spanish (Guatemala)', flag: '🇬🇹' },
  { code: 'es-HN', name: 'Spanish (Honduras)', flag: '🇭🇳' },
  { code: 'es-NI', name: 'Spanish (Nicaragua)', flag: '🇳🇮' },
  { code: 'es-PA', name: 'Spanish (Panama)', flag: '🇵🇦' },
  { code: 'es-PY', name: 'Spanish (Paraguay)', flag: '🇵🇾' },
  { code: 'es-PE', name: 'Spanish (Peru)', flag: '🇵🇪' },
  { code: 'es-PR', name: 'Spanish (Puerto Rico)', flag: '🇵🇷' },
  { code: 'es-UY', name: 'Spanish (Uruguay)', flag: '🇺🇾' },
  { code: 'es-VE', name: 'Spanish (Venezuela)', flag: '🇻🇪' },

  // --- Portuguese World ---
  { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'pt-AO', name: 'Portuguese (Angola)', flag: '🇦🇴' },
  { code: 'pt-MZ', name: 'Portuguese (Mozambique)', flag: '🇲🇿' },

  // --- French World ---
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', flag: '🇨🇦' },
  { code: 'fr-BE', name: 'French (Belgium)', flag: '🇧🇪' },
  { code: 'fr-CH', name: 'French (Switzerland)', flag: '🇨🇭' },
  { code: 'fr-LU', name: 'French (Luxembourg)', flag: '🇱🇺' },
  { code: 'fr-SN', name: 'French (Senegal)', flag: '🇸🇳' },
  { code: 'fr-CI', name: "French (Côte d'Ivoire)", flag: '🇨🇮' },

  // --- Germanic (Core) ---
  { code: 'de-DE', name: 'German (Germany)', flag: '🇩🇪' },
  { code: 'de-AT', name: 'German (Austria)', flag: '🇦🇹' },
  { code: 'de-CH', name: 'German (Switzerland)', flag: '🇨🇭' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)', flag: '🇳🇱' },
  { code: 'nl-BE', name: 'Dutch (Belgium / Flemish Standard)', flag: '🇧🇪' },

  // --- Belgium Regional Languages / Dialects ---
  { code: 'vls-BE', name: 'West Flemish (Belgium)', flag: '🇧🇪' },
  { code: 'zea-BE', name: 'Zeelandic (Belgium)', flag: '🇧🇪' },
  { code: 'lim-BE', name: 'Limburgish (Belgium)', flag: '🇧🇪' },
  { code: 'wa-BE', name: 'Walloon (Belgium)', flag: '🇧🇪' },
  { code: 'de-BE', name: 'German (Belgium)', flag: '🇧🇪' },
  { code: 'pcd-BE', name: 'Picard (Belgium)', flag: '🇧🇪' },

  // --- Italy & Neighbors ---
  { code: 'it-IT', name: 'Italian (Italy)', flag: '🇮🇹' },
  { code: 'it-CH', name: 'Italian (Switzerland)', flag: '🇨🇭' },
  { code: 'rm-CH', name: 'Romansh (Switzerland)', flag: '🇨🇭' },

  // --- Nordics ---
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da-DK', name: 'Danish', flag: '🇩🇰' },
  { code: 'nb-NO', name: 'Norwegian Bokmal', flag: '🇳🇴' },
  { code: 'nn-NO', name: 'Norwegian Nynorsk', flag: '🇳🇴' },
  { code: 'fi-FI', name: 'Finnish', flag: '🇫🇮' },
  { code: 'is-IS', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'fo-FO', name: 'Faroese', flag: '🇫🇴' },

  // --- Western & Central Europe ---
  { code: 'ga-IE', name: 'Irish', flag: '🇮🇪' },
  { code: 'gd-GB', name: 'Scottish Gaelic', flag: '🏴' },
  { code: 'cy-GB', name: 'Welsh', flag: '🏴' },
  { code: 'br-FR', name: 'Breton', flag: '🇫🇷' },
  { code: 'eu-ES', name: 'Basque', flag: '🇪🇸' },
  { code: 'ca-ES', name: 'Catalan', flag: '🇪🇸' },
  { code: 'gl-ES', name: 'Galician', flag: '🇪🇸' },
  { code: 'oc-FR', name: 'Occitan', flag: '🇫🇷' },
  { code: 'lb-LU', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'mt-MT', name: 'Maltese', flag: '🇲🇹' },

  // --- Balkans & Eastern Europe ---
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
  { code: 'cs-CZ', name: 'Czech', flag: '🇨🇿' },
  { code: 'sk-SK', name: 'Slovak', flag: '🇸🇰' },
  { code: 'hu-HU', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro-RO', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg-BG', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'sl-SI', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'hr-HR', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sr-RS', name: 'Serbian (Serbia)', flag: '🇷🇸' },
  { code: 'bs-BA', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'mk-MK', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'sq-AL', name: 'Albanian', flag: '🇦🇱' },
  { code: 'el-GR', name: 'Greek', flag: '🇬🇷' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'uk-UA', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'be-BY', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'et-EE', name: 'Estonian', flag: '🇪🇪' },
  { code: 'lv-LV', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt-LT', name: 'Lithuanian', flag: '🇱🇹' },

  // --- Caucasus & Central Asia ---
  { code: 'ka-GE', name: 'Georgian', flag: '🇬🇪' },
  { code: 'hy-AM', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az-AZ', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'kk-KZ', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'ky-KG', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'uz-UZ', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'tk-TM', name: 'Turkmen', flag: '🇹🇲' },
  { code: 'tg-TJ', name: 'Tajik', flag: '🇹🇯' },

  // --- Middle East (Semitic/Iranic/Turkic) ---
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'he-IL', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'fa-IR', name: 'Persian (Iran)', flag: '🇮🇷' },
  { code: 'fa-AF', name: 'Dari (Afghanistan)', flag: '🇦🇫' },
  { code: 'ps-AF', name: 'Pashto (Afghanistan)', flag: '🇦🇫' },
  { code: 'ku-TR', name: 'Kurdish (Kurmanji)', flag: '🇹🇷' },
  { code: 'ckb-IQ', name: 'Kurdish (Sorani)', flag: '🇮🇶' },

  // Arabic regional variants
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', flag: '🇸🇦' },
  { code: 'ar-AE', name: 'Arabic (UAE)', flag: '🇦🇪' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', flag: '🇪🇬' },
  { code: 'ar-MA', name: 'Arabic (Morocco)', flag: '🇲🇦' },

  // --- South Asia ---
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)', flag: '🇵🇰' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)', flag: '🇧🇩' },
  { code: 'pa-IN', name: 'Punjabi (India)', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil (India)', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'ne-NP', name: 'Nepali', flag: '🇳🇵' },
  { code: 'si-LK', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'my-MM', name: 'Burmese (Myanmar)', flag: '🇲🇲' },

  // --- East Asia ---
  { code: 'zh-Hans', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },

  // --- Southeast Asia ---
  { code: 'id-ID', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay (Malaysia)', flag: '🇲🇾' },
  { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th-TH', name: 'Thai', flag: '🇹🇭' },
  { code: 'km-KH', name: 'Khmer (Cambodia)', flag: '🇰🇭' },
  { code: 'lo-LA', name: 'Lao', flag: '🇱🇦' },
  { code: 'tl-PH', name: 'Tagalog (Filipino)', flag: '🇵🇭' },

  // --- Africa ---
  { code: 'sw-KE', name: 'Swahili (Kenya)', flag: '🇰🇪' },
  { code: 'am-ET', name: 'Amharic', flag: '🇪🇹' },
  { code: 'yo-NG', name: 'Yoruba (Nigeria)', flag: '🇳🇬' },
  { code: 'ig-NG', name: 'Igbo (Nigeria)', flag: '🇳🇬' },
  { code: 'ha-NG', name: 'Hausa (Nigeria)', flag: '🇳🇬' },
  { code: 'zu-ZA', name: 'Zulu (South Africa)', flag: '🇿🇦' },

  // --- Oceania ---
  { code: 'mi-NZ', name: 'Maori (New Zealand)', flag: '🇳🇿' },

  // --- Constructed ---
  { code: 'eo', name: 'Esperanto', flag: '🌐' },
];

export interface RoomState {
  activeSpeaker: SpeakerInfo | null;
  raiseHandQueue: QueueEntry[];
  lockVersion: number;
}
