'use client';

import React from 'react';
import { ChevronDown, Hand, Lock, Mic, Volume2, X } from 'lucide-react';
import { LANGUAGES } from '@/translator-plugin/types';
import { useTranslator } from './TranslatorProvider';

export default function TranslatorCustomControls() {
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

  const handleLangToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <>
      <div className="lk-button-group">
        <button
          type="button"
          className={`lk-button ${isMeSpeaking ? 'lk-button-active' : ''}`}
          onClick={toggleSpeak}
          disabled={(isSomeoneElseSpeaking && !isMeSpeaking) || isMeListening}
          aria-pressed={isMeSpeaking}
        >
          {isMeSpeaking ? (
            <X className="lk-icon" />
          ) : isSomeoneElseSpeaking || isMeListening ? (
            <Lock className="lk-icon opacity-50" />
          ) : (
            <Mic className="lk-icon" />
          )}
          {isMeSpeaking ? 'Stop' : 'Speak'}
        </button>
        </div>

        <div className="lk-button-group">
        <button
          type="button"
          className={`lk-button ${isMeListening ? 'lk-button-active' : ''}`}
          onClick={toggleListen}
          disabled={isMeSpeaking}
          aria-pressed={isMeListening}
        >
          <Volume2 className="lk-icon" />
          {isMeListening ? 'Live' : 'Listen'}
        </button>
        </div>

        <div className="lk-button-group">
        <button
          type="button"
          className="lk-button"
          onClick={handleLangToggle}
          disabled={isMeListening}
        >
          <span className="mr-2 text-lg">{selectedLanguage.flag}</span>
          <span className="text-xs font-bold uppercase mr-1">
            {selectedLanguage.code.split('-')[1] || selectedLanguage.code}
          </span>
          {isMeListening ? (
            <Lock className="w-3 h-3 opacity-50" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        
        {showLangs && !isMeListening && (
          <div className="lk-button-group-menu" style={{ bottom: '100%', marginBottom: '10px', height: '300px', overflowY: 'auto' }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className="lk-button"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => {
                  setSelectedLanguage(lang);
                  setShowLangs(false);
                }}
              >
                <span className="mr-2">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
        </div>

        <div className="lk-button-group">
        <button
          type="button"
          className={`lk-button ${isQueued ? 'lk-button-active' : ''}`}
          onClick={raiseHand}
          disabled={isMeSpeaking}
          aria-pressed={isQueued}
        >
          <Hand className="lk-icon" />
          {isQueued ? 'Queued' : 'Queue'}
        </button>
      </div>
    </>
  );
}
