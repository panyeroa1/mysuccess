import Link from "next/link";

import { Button } from "@/components/ui/button";
import CallList from "@/components/CallList";

const StudentPortal = () => {
  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="rounded-2xl border border-white/10 bg-dark-1 p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-sky-2">
          Student Portal
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">
          Join your training session
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-sky-2">
          Use the class code from your teacher or open a meeting link to start
          learning with live captions and translation.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="bg-blue-1">
            <Link href="/join">Enter Class Code</Link>
          </Button>
          <Button asChild className="bg-dark-3 border border-white/10">
            <Link href="/dashboard">Back to Portals</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-dark-1 p-6">
          <h2 className="text-xl font-bold">Upcoming Sessions</h2>
          <div className="mt-4">
            <CallList type="upcoming" />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-dark-1 p-6">
          <h2 className="text-xl font-bold">Completed Sessions</h2>
          <div className="mt-4">
            <CallList type="ended" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentPortal;
