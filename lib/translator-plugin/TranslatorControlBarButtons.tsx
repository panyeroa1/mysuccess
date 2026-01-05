'use client';

import React from 'react';
import { ChevronDown, Hand, Lock, Mic, Volume2, X } from 'lucide-react';
import { LANGUAGES } from '@/translator-plugin (2)/types';
import { useTranslator } from './TranslatorProvider';

export default function TranslatorControlBarButtons() {
  const {
    mode,
    roomState,
    selectedLanguage,
    userId,
    toggleSpeak,
    toggleListen,
    setSelectedLanguage,
    raiseHand,
  } = useTranslator();

  const [showLangs, setShowLangs] = React.useState(false);
  const isSomeoneElseSpeaking =
    roomState.activeSpeaker && roomState.activeSpeaker.userId !== userId;
  const isMeSpeaking = mode === 'speaking';
  const isMeListening = mode === 'listening';
  const isQueued = roomState.raiseHandQueue.some((q) => q.userId === userId);

  const handleLangToggle = () => {
    if (!isMeListening) {
      setShowLangs(!showLangs);
    }
  };

  React.useEffect(() => {
    if (isMeListening) {
      setShowLangs(false);
    }
  }, [isMeListening]);

  return (
    <div className="translator-control-bar">
      <button
        type="button"
        className="lk-button translator-control-button"
        onClick={toggleSpeak}
        disabled={(isSomeoneElseSpeaking && !isMeSpeaking) || isMeListening}
        aria-pressed={isMeSpeaking}
      >
        {isMeSpeaking ? (
          <X className="translator-control-icon" />
        ) : isSomeoneElseSpeaking || isMeListening ? (
          <Lock className="translator-control-icon translator-control-muted" />
        ) : (
          <Mic className="translator-control-icon" />
        )}
        <span>Speak</span>
      </button>
      <button
        type="button"
        className="lk-button translator-control-button"
        onClick={toggleListen}
        disabled={isMeSpeaking}
        aria-pressed={isMeListening}
      >
        <Volume2 className="translator-control-icon" />
        <span>{isMeListening ? 'Live Aloud' : 'Listen'}</span>
      </button>
      <div className="translator-control-menu">
        <button
          type="button"
          className="lk-button translator-control-button"
          onClick={handleLangToggle}
          disabled={isMeListening}
        >
          <span className="translator-control-lang-flag">{selectedLanguage.flag}</span>
          <span className="translator-control-lang-code">
            {selectedLanguage.code.split('-')[1] || selectedLanguage.code}
          </span>
          {isMeListening ? (
            <Lock className="translator-control-icon translator-control-muted" />
          ) : (
            <ChevronDown className="translator-control-icon" />
          )}
        </button>
        {showLangs && !isMeListening && (
          <div className="translator-control-menu-list">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className="translator-control-menu-item"
                onClick={() => {
                  setSelectedLanguage(lang);
                  setShowLangs(false);
                }}
              >
                <span className="translator-control-lang-flag">{lang.flag}</span>
                <span className="translator-control-menu-name">{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        className="lk-button translator-control-button"
        onClick={raiseHand}
        disabled={isMeSpeaking}
        aria-pressed={isQueued}
      >
        <Hand className="translator-control-icon" />
        <span>{isQueued ? 'Queued' : 'Queue'}</span>
      </button>
    </div>
  );
}
