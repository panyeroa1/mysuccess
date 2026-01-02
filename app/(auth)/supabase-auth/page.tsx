"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const SupabaseAuthPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonSubmitting, setIsAnonSubmitting] = useState(false);

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({ title: "Enter your email address." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/join`,
        },
      });

      if (error) {
        toast({ title: "Unable to send login link." });
        return;
      }

      toast({ title: "Check your email for the login link." });
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to send login link." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnonymousAuth = async () => {
    setIsAnonSubmitting(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        toast({ title: "Unable to sign in anonymously." });
        return;
      }
      router.push("/join");
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to sign in anonymously." });
    } finally {
      setIsAnonSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-dark-2 px-6 py-14 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-sky-2">
            Supabase Auth
          </p>
          <h1 className="text-3xl font-extrabold">
            Sign in for Classroom Access
          </h1>
          <p className="text-sm text-sky-1">
            Use your email or continue anonymously before joining a class.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-dark-1 p-6">
            <h2 className="text-xl font-bold">Email login</h2>
            <p className="mt-2 text-sm text-sky-2">
              We will send you a secure link to continue.
            </p>
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleEmailAuth}>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="submit" disabled={isSubmitting} className="bg-blue-1">
                {isSubmitting ? "Sending..." : "Send login link"}
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-dark-1 p-6">
            <h2 className="text-xl font-bold">Anonymous access</h2>
            <p className="mt-2 text-sm text-sky-2">
              Continue without an account for fast classroom entry.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                onClick={handleAnonymousAuth}
                disabled={isAnonSubmitting}
                className="bg-dark-3 border border-white/10"
              >
                {isAnonSubmitting ? "Signing in..." : "Continue anonymously"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default SupabaseAuthPage;
