// Code by Utsav Patel
"use client";
import { useState, useEffect } from "react";
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from "@stream-io/video-react-sdk";
import { useRouter, useSearchParams } from "next/navigation";
import { languages } from "@/constants/languages";
import { Users, LayoutList, Languages, Captions, Globe, UserPlus } from "lucide-react";
import { useToast } from "./ui/use-toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Loader from "./Loader";
import EndCallButton from "./EndCallButton";
import { cn } from "@/lib/utils";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

import { useUser } from "@clerk/nextjs";
import Transcription from "./Transcription";

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const router = useRouter();
  const { toast } = useToast();
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [audioSource, setAudioSource] = useState<"microphone" | "system" | "both">("microphone");
  const [targetLang, setTargetLang] = useState("en");
  const {
    useCallCallingState,
    useMicrophoneState,
    useLocalParticipant,
    useRemoteParticipants,
    useScreenShareState,
  } = useCallStateHooks();
  const { selectedDevice } = useMicrophoneState();
  const { status: screenShareStatus, mediaStream: screenShareStream } = useScreenShareState();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const activeSpeaker =
    remoteParticipants.find((participant) => participant.isSpeaking) ??
    remoteParticipants[0];
  const sharedAudioParticipant = remoteParticipants.find(
    (participant) => participant.screenShareAudioStream
  );
  const sharedAudioStream =
    localParticipant?.screenShareAudioStream ??
    sharedAudioParticipant?.screenShareAudioStream ??
    null;
  const speakerAudioStream =
    activeSpeaker?.screenShareAudioStream ?? activeSpeaker?.audioStream ?? null;
  const { user } = useUser();
  const call = useCall();
  
  const amISharing = screenShareStatus === "enabled";
  // amISharing derived logic provided in useEffect below is sufficient
  
  // Auto-switch to "both" when screen sharing is active
  useEffect(() => {
    if (amISharing) {
        setAudioSource("both");
        setShowCaptions(true); 
    } else {
        setAudioSource("microphone");
    }
  }, [amISharing]);

  const handleInvite = () => {
    const meetingLink = window.location.href;
    const meetingId = call?.id;
    const passcode = call?.state?.custom?.password || "None";
    
    const inviteText = `
Join Meeting: ${meetingLink}
Meeting ID: ${meetingId}
Passcode: ${passcode === "None" ? "(No Passcode)" : passcode}
    `.trim();

    navigator.clipboard.writeText(inviteText);
    toast({
      title: "Invite Copied",
      description: "Meeting details copied to clipboard ready to share!",
    });
  };

  const iconButtonBase =
    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-[#1b2430]/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-[#243244] hover:border-white/20";
  const menuContentClass =
    "border-white/10 bg-[#0f141c]/95 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur";

  // for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-[#0b0f14] text-white min-h-[100svh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.12),_transparent_40%)]" />
      <div className="relative flex size-full">
        {/* Added padding pb-24 to prevent control bar overlap */}
        <div className="relative flex size-full items-center justify-center pb-24">
          <div className="relative size-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f141c]/80 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
            <CallLayout />
          </div>
        </div>
        <div
          className={cn(
            "pointer-events-auto absolute right-4 top-4 bottom-24 hidden w-[320px] max-w-[90vw]",
            {
              "show-block": showParticipants,
            }
          )}
        >
          <div className="h-full rounded-2xl border border-white/10 bg-[#0f141c]/90 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        </div>

        {/* Translator Sidebar */}
        <div
          className={cn(
            "pointer-events-auto absolute right-4 top-4 bottom-24 hidden w-[400px] max-w-[90vw]",
            {
              "show-block": showTranslator,
            }
          )}
        >
          <div className="h-full rounded-2xl border border-white/10 bg-[#0f141c]/90 overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur">
             <iframe 
                src="https://eburon.ai/classroom/" 
                className="w-full h-full border-none"
                allow="autoplay; microphone; camera; display-capture; fullscreen"
                title="Eburon Classroom"
             />
          </div>
        </div>
      </div>

      {user && call && showCaptions && (
        <Transcription 
            userId={user.id} 
            meetingId={call.id} 
            deviceId={selectedDevice} 
            targetLang={targetLang}
            audioSource={audioSource}
            screenShareAudioStream={sharedAudioStream}
            speakerAudioStream={speakerAudioStream}
        />
      )}

      {/* video layout and call controls */}
      <div className="fixed bottom-4 left-1/2 z-20 flex w-[min(1100px,95vw)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0f141c]/80 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger
              className={cn(iconButtonBase)}
              title="Change Layout"
            >
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className={menuContentClass}>
            {["Grid", "Speaker-Left", "Speaker-Right"].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-white/10" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={handleInvite}
          title="Invite Participants"
          className={cn(iconButtonBase)}
        >
          <UserPlus size={20} className="text-white" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              iconButtonBase,
              showCaptions && "bg-[#2563eb]/90 hover:bg-[#1d4ed8] border-[#60a5fa]/50"
            )}
            title="Caption Source"
          >
            <Captions size={20} className="text-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className={menuContentClass}>
            <DropdownMenuItem className="font-bold opacity-50" disabled>
              Caption Source
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-white/10" />
            <DropdownMenuItem onClick={() => setShowCaptions(false)}>
              Off
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setShowCaptions(true);
                setAudioSource("microphone");
              }}
            >
              Microphone
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setShowCaptions(true);
                setAudioSource("system");
              }}
            >
              System Audio
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setShowCaptions(true);
                setAudioSource("both");
              }}
            >
              Both (Mic + System)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={iconButtonBase}
            title="Translate To"
          >
            <Languages size={20} className="text-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={`${menuContentClass} max-h-[300px] overflow-y-auto`}
          >
            <DropdownMenuItem disabled className="font-bold opacity-50">
              Select Language
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-white/10" />
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.value}
                onClick={() => setTargetLang(lang.value)}
                className={cn(
                  "focus:bg-[#1b2430]",
                  targetLang === lang.value && "bg-[#1d4ed8]/40"
                )}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

         <button
          onClick={() => {
              setShowTranslator((prev) => !prev);
              setShowParticipants(false); 
          }}
          title="Translator / Videoke"
          className={cn(iconButtonBase, showTranslator && "bg-blue-600 border-blue-400")}
        >
          <Globe size={20} className="text-white" />
        </button>

        <CallStatsButton />
        <button
          onClick={() => {
            setShowParticipants((prev) => !prev);
            setShowTranslator(false);
          }}
          title="Participants"
          className={iconButtonBase}
        >
          <Users size={20} className="text-white" />
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;
