import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roleCards = [
  {
    title: "Teacher",
    description: "Run the session, broadcast translations, and share the class code.",
    href: "/sign-in?role=teacher",
    buttonLabel: "Login as Teacher",
    tone: "from-blue-500/30 via-blue-500/5 to-transparent",
  },
  {
    title: "Student",
    description: "Train live, choose your language, and follow captions in real time.",
    href: "/sign-in?role=student",
    buttonLabel: "Login as Student",
    tone: "from-sky-400/30 via-sky-400/5 to-transparent",
  },
  {
    title: "Guest",
    description: "Join instantly with the 6-character classroom code.",
    href: "/join",
    buttonLabel: "Continue as Guest",
    tone: "from-emerald-400/30 via-emerald-400/5 to-transparent",
  },
];

const LandingPage = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0f14] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,120,249,0.45),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(255,163,26,0.35),_transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute -left-20 top-40 h-48 w-48 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-12 h-56 w-56 rounded-full bg-amber-400/30 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/logo.svg"
              width={40}
              height={40}
              alt="Success Class"
            />
            <div>
              <p className="text-xl font-extrabold">Success Class</p>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-2">
                Student Training
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="hidden text-sm font-semibold text-sky-2 transition hover:text-white md:inline-flex"
          >
            Go to Dashboard
          </Link>
        </header>

        <section className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-dark-1/80 px-4 py-1 text-xs uppercase tracking-[0.45em] text-sky-2">
              Training for Students
            </div>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Build confidence in live lessons with
              <span className="block bg-gradient-to-r from-sky-300 via-blue-400 to-blue-600 bg-clip-text text-transparent">
                instant translation & captions.
              </span>
            </h1>
            <p className="text-base text-sky-1 sm:text-lg">
              Success Class turns every lesson into a hands-on training session.
              Teachers share a 6-character code, students join instantly, and
              everyone hears the lesson in their own language.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-blue-1">
                <Link href="/sign-in?role=teacher">Start a Training</Link>
              </Button>
              <Button asChild className="bg-dark-1 border border-white/10">
                <Link href="/join">Enter Class Code</Link>
              </Button>
            </div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-dark-1/80 p-6">
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-1" />
                <div>
                  <p className="text-sm font-semibold">Live translation loop</p>
                  <p className="text-sm text-sky-2">
                    Learners follow along without missing instructions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-yellow-1" />
                <div>
                  <p className="text-sm font-semibold">Zero-email access</p>
                  <p className="text-sm text-sky-2">
                    Classroom codes keep onboarding fast and stress-free.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-1" />
                <div>
                  <p className="text-sm font-semibold">Training ready devices</p>
                  <p className="text-sm text-sky-2">
                    Tablets sync in minutes with Wi-Fi and a single code.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-sky-2">
                  Today&apos;s Training
                </p>
                <span className="rounded-full border border-white/10 bg-dark-1 px-3 py-1 text-xs">
                  45 min
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <h2 className="text-2xl font-bold">Workplace French Basics</h2>
                <p className="text-sm text-sky-2">
                  Practice safety vocabulary, instructions, and daily routines
                  with real-time translation support.
                </p>
              </div>
              <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-dark-1/80 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sky-2">Coach</span>
                  <span className="font-semibold">M. Claude</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sky-2">Live captions</span>
                  <span className="font-semibold text-emerald-300">On</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sky-2">Training code</span>
                  <span className="font-semibold tracking-[0.35em]">
                    123456
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {roleCards.map((card) => (
                <div
                  key={card.title}
                  className={cn(
                    "rounded-2xl border border-white/10 bg-gradient-to-br p-6",
                    card.tone
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold">{card.title}</h2>
                    <p className="text-sm text-sky-2">{card.description}</p>
                    <Button asChild className="bg-dark-1 border border-white/10">
                      <Link href={card.href}>{card.buttonLabel}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 rounded-3xl border border-white/10 bg-dark-1/80 p-6 text-sm text-sky-2 md:grid-cols-3">
          {[
            {
              title: "1. Share the code",
              detail: "Teacher displays the 6-character code to every student.",
            },
            {
              title: "2. Pick a language",
              detail: "Each learner selects the language they understand best.",
            },
            {
              title: "3. Train together",
              detail: "Captions + translation keep everyone aligned live.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-dark-2/80 p-5"
            >
              <p className="text-base font-semibold text-white">{step.title}</p>
              <p className="mt-2">{step.detail}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default LandingPage;
