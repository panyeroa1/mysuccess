'use client';

import React from 'react';
import TranslatorDock from '@/translator-plugin (2)/components/TranslatorDock';
import { useTranslator } from './TranslatorProvider';

export default function TranslatorDockPanel() {
  const {
    mode,
    roomState,
    selectedLanguage,
    userId,
    toggleSpeak,
    toggleListen,
    setSelectedLanguage,
    raiseHand,
    audioData,
    audioSource,
    toggleAudioSource,
    liveStreamText,
    translatedStreamText,
    isTtsLoading,
    emotion,
  } = useTranslator();

  return (
    <TranslatorDock
      mode={mode}
      roomState={roomState}
      selectedLanguage={selectedLanguage}
      myUserId={userId}
      onSpeakToggle={toggleSpeak}
      onListenToggle={toggleListen}
      onLanguageChange={setSelectedLanguage}
      onRaiseHand={raiseHand}
      audioData={audioData}
      audioSource={audioSource}
      onAudioSourceToggle={toggleAudioSource}
      liveStreamText={liveStreamText}
      translatedStreamText={translatedStreamText}
      isTtsLoading={isTtsLoading}
      emotion={emotion}
      hideControls={true}
    />
  );
}
