"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface TranscriptionProps {
  userId: string;
  meetingId: string;
}

const Transcription = ({ userId, meetingId }: TranscriptionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Default to English

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + " " + finalTranscript);
        saveTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
        // Automatically restart if supposed to be listening (simple keep-alive)
        // But for this simple implementation, we might let it stop.
        // To be robust, one would handle restarting here.
       // setIsListening(false); 
    };

    recognition.start();
    
    // Cleanup function to stop if component unmounts
    return () => {
        recognition.stop();
    }

  }, [userId, meetingId]);

  const saveTranscript = async (text: string) => {
    try {
      const { error } = await supabase.from("translations").insert({
        user_id: userId,
        meeting_id: meetingId,
        source_lang: "en",
        target_lang: "en",
        original_text: text,
        translated_text: text, // Saving original as translated for now since no translation logic involved
      });

      if (error) {
        console.error("Error saving transcript:", error);
      } else {
        console.log("Transcript saved successfully");
      }
    } catch (err) {
      console.error("Unexpected error saving transcript:", err);
    }
  };

  useEffect(() => {
    // Start listening automatically when component mounts, or provide a button.
    // Given usage in a meeting, maybe auto-start or button?
    // Let's provide a visible indicator/button for now to be safe, or auto-start.
    // User request: "add transcription from a speaking user".
    // I'll make it auto-start for now to be seamless, but log errors if permission denied.
    
    // Actually, simple auto-start might be blocked by browser policy without user interaction.
    // But since they are already in a meeting (handling media), maybe it's fine.
    // Let's return a UI component that shows status.
  }, []);

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-dark-1 p-2 rounded-lg text-white opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <p className="text-xs">{isListening ? 'Transcribing...' : 'Transcription Off'}</p>
        <button 
            onClick={startListening} 
            className="text-xs bg-blue-1 px-2 py-1 rounded ml-2"
            disabled={isListening}
        >
            {isListening ? 'Active' : 'Start'}
        </button>
      </div>
      {transcript && (
          <div className="mt-2 max-h-20 max-w-[200px] overflow-y-auto text-[10px] text-gray-300">
              {transcript.slice(-100)}...
          </div>
      )}
    </div>
  );
};

export default Transcription;
