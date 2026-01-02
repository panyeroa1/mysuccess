import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roleCards = [
  {
    title: "Teacher",
    description: "Host the class, create lessons, and share the classroom code.",
    href: "/sign-in?role=teacher",
    buttonLabel: "Login as Teacher",
    tone: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
  {
    title: "Student",
    description: "Access your classroom with your account and join live sessions.",
    href: "/sign-in?role=student",
    buttonLabel: "Login as Student",
    tone: "from-sky-400/20 via-sky-400/5 to-transparent",
  },
  {
    title: "Guest",
    description: "Join instantly with the 6-character classroom code.",
    href: "/join",
    buttonLabel: "Continue as Guest",
    tone: "from-emerald-400/20 via-emerald-400/5 to-transparent",
  },
];

const LandingPage = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-dark-2 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,120,249,0.25),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(255,163,26,0.2),_transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-16 pt-8">
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
              <p className="text-xs uppercase tracking-[0.3em] text-sky-2">
                Classroom Landing
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

        <section className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-dark-1 px-4 py-1 text-xs uppercase tracking-[0.4em] text-sky-2">
              Real-time learning
            </div>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Teach, translate, and connect in one classroom link.
            </h1>
            <p className="text-base text-sky-1 sm:text-lg">
              Success Class powers live lessons with instant captions and
              translation. Teachers share a five-character code, learners join in
              seconds on any tablet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-blue-1">
                <Link href="/sign-in?role=teacher">Start as Teacher</Link>
              </Button>
              <Button asChild className="bg-dark-1 border border-white/10">
                <Link href="/join">Join with Code</Link>
              </Button>
            </div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-dark-1/80 p-6">
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-1" />
                <div>
                  <p className="text-sm font-semibold">Live captioning</p>
                  <p className="text-sm text-sky-2">
                    Guests can follow captions and translations without accounts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-yellow-1" />
                <div>
                  <p className="text-sm font-semibold">One code, many devices</p>
                  <p className="text-sm text-sky-2">
                    Teachers share a simple code to onboard every tablet.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-1" />
                <div>
                  <p className="text-sm font-semibold">Focus on learning</p>
                  <p className="text-sm text-sky-2">
                    No emails required for learners who prefer fast access.
                  </p>
                </div>
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
        </section>
      </div>
    </main>
  );
};

export default LandingPage;
