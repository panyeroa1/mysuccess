"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";

import GuestStreamClientProvider from "@/providers/GuestStreamClientProvider";
import { useGetCallById } from "@/hooks/useGetCallById";
import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import Loader from "@/components/Loader";

const ClassroomContent = () => {
  const { id } = useParams();
  const { call, isCallLoading } = useGetCallById(id);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (isCallLoading) return <Loader />;

  if (!call) {
    return (
      <p className="text-center text-3xl font-bold text-white">
        Classroom Not Found
      </p>
    );
  }

  return (
    <main className="h-[100svh] w-full min-h-[100svh]">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

const ClassroomPage = () => (
  <GuestStreamClientProvider>
    <ClassroomContent />
  </GuestStreamClientProvider>
);

export default ClassroomPage;
