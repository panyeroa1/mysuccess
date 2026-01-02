import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const entryCards = [
  {
    title: "Teacher",
    description: "Launch the training, share the class code, and guide the room.",
    href: "/sign-in?role=teacher",
    buttonLabel: "Login as Teacher",
    tone: "from-blue-500/25 via-blue-500/5 to-transparent",
  },
  {
    title: "Student",
    description: "Join the live lesson and follow captions in your language.",
    href: "/sign-in?role=student",
    buttonLabel: "Login as Student",
    tone: "from-sky-400/25 via-sky-400/5 to-transparent",
  },
  {
    title: "Guest",
    description: "Enter fast with the 6-character training code.",
    href: "/join",
    buttonLabel: "Join with Code",
    tone: "from-emerald-400/25 via-emerald-400/5 to-transparent",
  },
];

const highlights = [
  {
    label: "Active languages",
    value: "24",
  },
  {
    label: "Average join time",
    value: "30 sec",
  },
  {
    label: "Training sessions",
    value: "Live daily",
  },
];

const LandingPage = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f16] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,120,249,0.45),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,163,26,0.35),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="pointer-events-none absolute -left-24 top-32 h-56 w-56 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-12 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/hero-background.png"
          alt=""
          fill
          className="object-cover opacity-10"
        />
      </div>

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
                Student Training Hub
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
              Train in real time with
              <span className="block bg-gradient-to-r from-sky-200 via-blue-300 to-blue-500 bg-clip-text text-transparent">
                live translation and captions.
              </span>
            </h1>
            <p className="text-base text-sky-1 sm:text-lg">
              Your classroom runs like a training floor. Teachers share one
              code, learners join in seconds, and every instruction lands in the
              language they understand.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-blue-1">
                <Link href="/sign-in?role=teacher">Start a Training</Link>
              </Button>
              <Button asChild className="bg-dark-1 border border-white/10">
                <Link href="/join">Enter Class Code</Link>
              </Button>
              <Button asChild className="bg-dark-1 border border-white/10">
                <Link href="/supabase-auth">Email / Anonymous Login</Link>
              </Button>
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/10 bg-dark-1/70 p-5 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-dark-2/80 p-4"
                >
                  <p className="text-lg font-bold text-white">{item.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-sky-2">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/10 bg-dark-1/80 p-6">
              {[
                {
                  title: "Step 1 - Share the code",
                  detail: "Teacher displays the 6-character code to the class.",
                },
                {
                  title: "Step 2 - Pick a language",
                  detail: "Learners choose their listening language instantly.",
                },
                {
                  title: "Step 3 - Train together",
                  detail: "Captions + translation keep everyone aligned live.",
                },
              ].map((step) => (
                <div key={step.title} className="flex gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="text-sm text-sky-2">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-sky-2">
                  Live Training Session
                </p>
                <span className="rounded-full border border-white/10 bg-dark-1 px-3 py-1 text-xs">
                  Live
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <h2 className="text-2xl font-bold">Workplace Safety Basics</h2>
                <p className="text-sm text-sky-2">
                  Train vocabulary and instructions with instant translation for
                  every learner.
                </p>
              </div>
              <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-dark-1/80 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sky-2">Coach</span>
                  <span className="font-semibold">Claude</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sky-2">Live captions</span>
                  <span className="font-semibold text-emerald-300">On</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sky-2">Training code</span>
                  <span className="font-semibold tracking-[0.35em]">123456</span>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-dark-2/80 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-sky-2">
                  <span>Modules</span>
                  <span>Week 1</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-sky-1">
                  <div className="flex items-center justify-between">
                    <span>Safety check-in</span>
                    <span>05:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tools and materials</span>
                    <span>12:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hands-on practice</span>
                    <span>20:00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {entryCards.map((card) => (
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
      </div>
    </main>
  );
};

export default LandingPage;
