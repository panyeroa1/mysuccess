// Code by Utsav Patel
"use client";
import { useState } from "react";
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
import { Users, LayoutList, Languages, Captions } from "lucide-react";

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
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [audioSource, setAudioSource] = useState<"microphone" | "system" | "both">("microphone");
  const [targetLang, setTargetLang] = useState("en");
  const { useCallCallingState } = useCallStateHooks();
  const { useMicrophoneState } = useCallStateHooks();
  const { selectedDevice } = useMicrophoneState();
  const { user } = useUser();
  const call = useCall();

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
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className=" flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn("h-[calc(100vh-86px)] hidden ml-2", {
            "show-block": showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>

      {user && call && showCaptions && (
        <Transcription 
            userId={user.id} 
            meetingId={call.id} 
            deviceId={selectedDevice} 
            targetLang={targetLang}
            audioSource={audioSource}
        />
      )}

      {/* video layout and call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 pb-5 flex-wrap px-4">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]" title="Change Layout">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {["Grid", "Speaker-Left", "Speaker-Right"].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger className={cn("cursor-pointer rounded-2xl px-4 py-2 hover:bg-[#4c535b]", showCaptions ? "bg-blue-600" : "bg-[#19232d]")} title="Caption Source">
                <Captions size={20} className="text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
                <DropdownMenuItem className="font-bold opacity-50" disabled>Caption Source</DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
                <DropdownMenuItem onClick={() => setShowCaptions(false)}>Off</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowCaptions(true); setAudioSource("microphone"); }}>Microphone</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowCaptions(true); setAudioSource("system"); }}>System Audio</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowCaptions(true); setAudioSource("both"); }}>Both (Mic + System)</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]" title="Translate To">
                <Languages size={20} className="text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white max-h-[300px] overflow-y-auto">
                <DropdownMenuItem disabled className="font-bold opacity-50">Select Language</DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
                {languages.map((lang) => (
                     <DropdownMenuItem 
                        key={lang.value} 
                        onClick={() => setTargetLang(lang.value)}
                        className={targetLang === lang.value ? "bg-blue-600" : ""}
                     >
                        {lang.label}
                     </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>

        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)} title="Participants">
          <div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
            <Users size={20} className="text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;
