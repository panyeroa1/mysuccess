'use client';

import React from 'react';
import { AppMode, Language, LANGUAGES, RoomState, AudioSource, EmotionType } from './types';
import { ChevronDown, Mic, Volume2, Hand, X, Lock, Loader2 } from 'lucide-react';
import styles from '@/styles/TranslatorDock.module.css';

interface TranslatorDockProps {
  mode: AppMode;
  roomState: RoomState;
  selectedLanguage: Language;
  myUserId: string;
  onSpeakToggle: () => void;
  onListenToggle: () => void;
  onLanguageChange: (lang: Language) => void;
  onRaiseHand: () => void;
  audioData?: Uint8Array;
  audioSource: AudioSource;
  onAudioSourceToggle: () => void;
  liveStreamText?: string;
  translatedStreamText?: string;
  isTtsLoading?: boolean;
  emotion?: EmotionType;
}

const emotionClasses: Record<EmotionType, string> = {
  neutral: styles.emotionNeutral,
  joy: styles.emotionJoy,
  sadness: styles.emotionSadness,
  anger: styles.emotionAnger,
  fear: styles.emotionFear,
  calm: styles.emotionCalm,
  excited: styles.emotionExcited,
};

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

const AudioVisualizer: React.FC<{ data: Uint8Array; color: string }> = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const bars = Array.from(data.slice(3, 11));
  const hasSignal = bars.some((v: number) => v > 4);
  if (!hasSignal) return null;

  return (
    <div className={styles.audioVisualizer}>
      {bars.map((val: number, i) => {
        const height = Math.max(2, (val / 255) * 14);
        return (
          <div
            key={i}
            className={styles.audioBar}
            style={{
              height: `${height}px`,
              opacity: 0.3 + (val / 255) * 0.7,
              backgroundColor: color,
              boxShadow: val > 120 ? `0 0 6px ${color}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

const TranslatorDock: React.FC<TranslatorDockProps> = (props) => {
  const {
    mode,
    roomState,
    selectedLanguage,
    myUserId,
    onSpeakToggle,
    onListenToggle,
    onLanguageChange,
    onRaiseHand,
    audioData,
    liveStreamText,
    translatedStreamText,
    isTtsLoading,
    emotion = 'neutral',
  } = props;
  const isSomeoneElseSpeaking =
    roomState.activeSpeaker && roomState.activeSpeaker.userId !== myUserId;
  const isMeSpeaking = mode === 'speaking';
  const isMeListening = mode === 'listening';

  const [showLangs, setShowLangs] = React.useState(false);
  const myQueuePosition = roomState.raiseHandQueue.findIndex((q) => q.userId === myUserId);
  const isQueued = myQueuePosition !== -1;

  const displayText = isMeListening ? translatedStreamText : liveStreamText;
  const isTranslation = isMeListening && !!translatedStreamText;

  return (
    <div className={styles.dockWrap} onClick={(e) => e.stopPropagation()}>
      <div className={styles.subtitleArea}>
        <div className={styles.subtitleInner}>
          {displayText && (
            <p
              className={cx(
                styles.subtitleText,
                isTranslation ? emotionClasses[emotion] : styles.emotionNeutral,
              )}
            >
              {displayText}
            </p>
          )}
        </div>
      </div>

      <div className={styles.dock}>
        <div className={styles.segment}>
          <button
            onClick={onSpeakToggle}
            disabled={!!(isSomeoneElseSpeaking && !isMeSpeaking)}
            className={cx(
              styles.dockButton,
              styles.speakButton,
              isMeSpeaking ? styles.speakActive : styles.dockIdle,
            )}
          >
            {isMeSpeaking ? (
              <X className={styles.icon} />
            ) : isSomeoneElseSpeaking ? (
              <Lock className={cx(styles.icon, styles.lockedIcon)} />
            ) : (
              <Mic className={styles.icon} />
            )}
            <span className={styles.buttonLabel}>Speak</span>
            {isMeSpeaking && audioData && <AudioVisualizer data={audioData} color="#ffffff" />}
          </button>
        </div>

        <div className={styles.segment}>
          <button
            onClick={onListenToggle}
            disabled={isMeSpeaking}
            className={cx(
              styles.dockButton,
              styles.listenButton,
              isMeListening ? styles.listenActive : styles.dockIdle,
            )}
          >
            {isTtsLoading ? (
              <Loader2 className={cx(styles.icon, styles.spinner)} />
            ) : (
              <Volume2 className={styles.icon} />
            )}
            <span className={styles.buttonLabel}>{isMeListening ? 'Live Aloud' : 'Listen'}</span>
            {isMeListening && audioData && <AudioVisualizer data={audioData} color="#bfdbfe" />}
          </button>
        </div>

        <div className={cx(styles.segment, styles.languageSegment)}>
          <button
            onClick={() => setShowLangs(!showLangs)}
            className={cx(styles.dockButton, styles.languageButton)}
            type="button"
          >
            <span className={styles.languageFlag}>{selectedLanguage.flag}</span>
            <div className={styles.languageMeta}>
              <span className={styles.languageCode}>
                {selectedLanguage.code.split('-')[1] || selectedLanguage.code}
              </span>
              <span className={styles.languageName}>{selectedLanguage.name}</span>
            </div>
            <ChevronDown className={styles.chevron} />
          </button>

          {showLangs && (
            <div className={styles.languageMenu}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang);
                    setShowLangs(false);
                  }}
                  className={cx(
                    styles.languageOption,
                    selectedLanguage.code === lang.code
                      ? styles.languageOptionActive
                      : styles.languageOptionIdle,
                  )}
                  type="button"
                >
                  <span className={styles.languageOptionFlag}>{lang.flag}</span>
                  <span className={styles.languageOptionName}>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.segment}>
          <button
            onClick={onRaiseHand}
            disabled={isMeSpeaking}
            className={cx(
              styles.dockButton,
              styles.queueButton,
              isQueued ? styles.queueActive : styles.dockIdle,
            )}
          >
            <Hand className={cx(styles.icon, isQueued ? styles.queueIconQueued : undefined)} />
            <span className={styles.buttonLabel}>{isQueued ? 'Queued' : 'Queue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslatorDock;
