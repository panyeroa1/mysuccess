"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  DEFAULT_JOIN_CODE,
  DEFAULT_STUDENT_NAME,
  DEFAULT_TEACHER_ID,
} from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const JoinPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [name, setName] = useState(DEFAULT_TEACHER_ID);
  const [code, setCode] = useState(DEFAULT_JOIN_CODE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const prefillName = searchParams.get("name");
    const prefill = searchParams.get("code");
    if (prefillName) {
      setName(prefillName.slice(0, 60));
    }
    if (!prefill) return;
    const normalized = prefill
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    if (normalized) setCode(normalized);
  }, [searchParams]);

  useEffect(() => {
    if (code || !name.trim()) return;
    if (name.trim().toUpperCase() === DEFAULT_STUDENT_NAME) {
      setCode(DEFAULT_JOIN_CODE);
    }
  }, [code, name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const normalizedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      toast({ title: "Please enter your name." });
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      toast({ title: "Enter a valid 6-character code." });
      return;
    }

    setIsSubmitting(true);
    try {
      let authUser = (await supabase.auth.getSession()).data.session?.user;
      if (!authUser) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) {
          toast({ title: "Unable to authenticate anonymously." });
          return;
        }
        authUser = data.user;
      }

      const { error: profileError } = await supabase
        .from("anonymous_users")
        .upsert(
          {
            auth_user_id: authUser.id,
            display_name: trimmedName,
            class_code: normalizedCode,
          },
          { onConflict: "auth_user_id" }
        );

      if (profileError) {
        toast({ title: "Unable to save your profile." });
        return;
      }

      const response = await fetch("/api/guest-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, code: normalizedCode }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast({ title: payload?.error || "Unable to join classroom." });
        return;
      }

      window.sessionStorage.setItem(
        "guestStreamAuth",
        JSON.stringify(payload)
      );
      router.push(`/classroom/${payload.callId}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to join classroom." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-dark-2 px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-1 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <h1 className="text-3xl font-bold">Join Classroom</h1>
        <p className="mt-2 text-sm text-sky-2">
          Enter the 6-character code from your teacher and your name.
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 60))}
            placeholder="Your name"
            autoComplete="name"
            className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Input
            value={code}
            onChange={(event) => {
              const next = event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 6);
              setCode(next);
            }}
            placeholder="Class code"
            inputMode="text"
            autoComplete="one-time-code"
            className="border-none bg-dark-3 text-center text-lg tracking-[0.3em] uppercase focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-1"
          >
            {isSubmitting ? "Joining..." : "Join Classroom"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default JoinPage;
