"use client";

import { useGetCalls } from "@/hooks/useGetCalls";
import { useGetRecordings } from "@/hooks/useGetRecordings";
import { useRouter } from "next/navigation";
import { Call } from "@stream-io/video-react-sdk";
import Loader from "./Loader";
import MeetingCard from "./MeetingCard";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, isLoading: isCallsLoading } =
    useGetCalls();
  const { recordings, isLoading: isRecordingsLoading } = useGetRecordings();

  const isLoading =
    type === "recordings" ? isRecordingsLoading : isCallsLoading;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {isLoading ? (
        <Loader />
      ) : type === "recordings" ? (
        recordings.length > 0 ? (
          recordings.map((recording) => (
            <MeetingCard
              key={recording.id}
              icon="/icons/recordings.svg"
              title={recording.title || "Class Recording"}
              date={
                recording.started_at
                  ? new Date(recording.started_at).toLocaleString()
                  : "No Date"
              }
              link={recording.storage_url}
              buttonIcon1="/icons/play.svg"
              buttonText="Play"
              handleClick={() =>
                window.open(recording.storage_url, "_blank", "noopener")
              }
            />
          ))
        ) : (
          <h1 className="text-2xl font-bold text-white">No Recordings</h1>
        )
      ) : type === "ended" ? (
        endedCalls && endedCalls.length > 0 ? (
          endedCalls.map((meeting: Call) => (
            <MeetingCard
              key={meeting.id}
              icon="/icons/previous.svg"
              title={meeting.state?.custom?.description || "No Description"}
              date={meeting.state?.startsAt?.toLocaleString() || "No Date"}
              isPreviousMeeting
              link={`${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.id}`}
              buttonText="Start"
              handleClick={() => router.push(`/meeting/${meeting.id}`)}
            />
          ))
        ) : (
          <h1 className="text-2xl font-bold text-white">No Previous Calls</h1>
        )
      ) : upcomingCalls && upcomingCalls.length > 0 ? (
        upcomingCalls.map((meeting: Call) => (
          <MeetingCard
            key={meeting.id}
            icon="/icons/upcoming.svg"
            title={meeting.state?.custom?.description || "No Description"}
            date={meeting.state?.startsAt?.toLocaleString() || "No Date"}
            link={`${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.id}`}
            buttonText="Start"
            handleClick={() => router.push(`/meeting/${meeting.id}`)}
          />
        ))
      ) : (
        <h1 className="text-2xl font-bold text-white">No Upcoming Calls</h1>
      )}
    </div>
  );
};

export default CallList;
