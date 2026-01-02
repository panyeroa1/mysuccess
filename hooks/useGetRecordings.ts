import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { supabase } from "@/lib/supabase";

export type RecordingRow = {
  id: string;
  title: string | null;
  storage_url: string;
  started_at: string | null;
  call_id: string;
};

export const useGetRecordings = () => {
  const { user } = useUser();
  const [recordings, setRecordings] = useState<RecordingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRecordings = async () => {
      if (!user?.id) {
        setRecordings([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("recordings")
        .select("id, title, storage_url, started_at, call_id")
        .eq("owner_id", user.id)
        .order("started_at", { ascending: false });

      if (error) {
        console.error("Failed to load recordings", error);
        setRecordings([]);
      } else {
        setRecordings(data ?? []);
      }
      setIsLoading(false);
    };

    loadRecordings();
  }, [user?.id]);

  return { recordings, isLoading };
};
