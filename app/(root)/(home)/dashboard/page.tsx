import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const portalCards = [
  {
    title: "Teacher Portal",
    description:
      "Create meetings, schedule lessons, and share the classroom code.",
    href: "/dashboard/teacher",
    buttonLabel: "Enter Teacher Portal",
    tone: "from-blue-500/25 via-blue-500/5 to-transparent",
    features: ["Create meetings", "Schedule lessons", "Share join code"],
  },
  {
    title: "Student Portal",
    description:
      "Join sessions, pick your language, and follow live captions.",
    href: "/dashboard/student",
    buttonLabel: "Enter Student Portal",
    tone: "from-emerald-400/25 via-emerald-400/5 to-transparent",
    features: ["Join by code", "Live captions", "Session history"],
  },
];

const DashboardHome = () => {
  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="rounded-2xl border border-white/10 bg-dark-1 p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-sky-2">
          Training Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">
          Choose your portal
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-sky-2">
          Select the portal that matches your role. Teachers manage sessions,
          students join and follow live training.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="bg-blue-1">
            <Link href="/dashboard/teacher">Teacher Portal</Link>
          </Button>
          <Button asChild className="bg-dark-3 border border-white/10">
            <Link href="/dashboard/student">Student Portal</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {portalCards.map((card) => (
          <div
            key={card.title}
            className={cn(
              "rounded-2xl border border-white/10 bg-gradient-to-br p-6",
              card.tone
            )}
          >
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-bold">{card.title}</h2>
                <p className="mt-2 text-sm text-sky-2">{card.description}</p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-sky-1">
                {card.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="bg-dark-1 border border-white/10">
                <Link href={card.href}>{card.buttonLabel}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardHome;
