"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";

import Loader from "@/components/Loader";

type GuestStreamAuth = {
  token: string;
  userId: string;
  name?: string;
};

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const GuestStreamClientProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [hasAuth, setHasAuth] = useState(true);

  useEffect(() => {
    if (!apiKey) {
      console.error("Stream API key missing");
      return;
    }

    const stored =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("guestStreamAuth")
        : null;

    if (!stored) {
      setHasAuth(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as GuestStreamAuth;
      if (!parsed?.token || !parsed?.userId) {
        setHasAuth(false);
        return;
      }

      const nextClient = new StreamVideoClient({
        apiKey,
        user: {
          id: parsed.userId,
          name: parsed.name || parsed.userId,
        },
        tokenProvider: async () => parsed.token,
      });

      setClient(nextClient);
    } catch (error) {
      console.error("Failed to load guest session", error);
      setHasAuth(false);
    }
  }, []);

  useEffect(() => {
    if (!hasAuth) router.push("/join");
  }, [hasAuth, router]);

  if (!client) return <Loader />;

  return <StreamVideo client={client}>{children}</StreamVideo>;
};

export default GuestStreamClientProvider;
