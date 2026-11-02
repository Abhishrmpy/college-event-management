import { ArrowRight, Calendar, Sparkles, Ticket, Users } from "lucide-react";
import ParticleText from "./ui/particle-text";

const stats = [
  { icon: Calendar, value: "120+", label: "Events a year" },
  { icon: Users, value: "8,400", label: "Active students" },
  { icon: Ticket, value: "45", label: "Clubs & societies" },
];

export const HeroSection = () => {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.18),transparent_50%)]"
        aria-hidden="true"
      />

      <ParticleText
        lines={["INDO GLOBAL", "COLLEGE OF", "ENGINEERING"]}
        preset="aurora"
        particleSize={2.6}
        density={2}
        fontSize={108}
        textVerticalPosition={0.27}
        maxParticles={45000}
        ariaLabel="Indo Global College of Engineering"
        className="absolute inset-0 z-0 h-full"
      />

      <div
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950"
        aria-hidden="true"
      />

      <div className="pointer-events-none relative z-20 flex min-h-screen flex-col">
        <header className="pointer-events-auto flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 text-sm font-black tracking-tight">
              IG
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold tracking-wide">
                Indo Global
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                College of Engineering
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a className="transition hover:text-white" href="#events">
              Events
            </a>
            <a className="transition hover:text-white" href="#categories">
              Categories
            </a>
            <a className="transition hover:text-white" href="#host">
              Host an event
            </a>
            <a className="transition hover:text-white" href="#creator">
              Creator
            </a>
          </nav>

          <a
            href="#events"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
          >
            Sign in
          </a>
        </header>

        <main className="pointer-events-none flex flex-1 flex-col items-center justify-end px-6 pb-14 pt-24 text-center">
          <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            Registrations open for the 2026 season
          </span>

          <p className="mt-6 max-w-xl text-balance text-base text-white/60 sm:text-lg">
            Discover workshops, fests, hackathons and cultural nights. Build
            your calendar, grab your pass, and show up for the moments that
            matter.
          </p>

          <div className="pointer-events-auto mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row">
            <a
              href="#events"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-100 sm:w-auto"
            >
              Browse events
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href="#host"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10 sm:w-auto"
            >
              <Ticket className="h-4 w-4" />
              Host an event
            </a>
          </div>

          <dl className="mt-8 grid w-full max-w-3xl grid-cols-3 gap-2 sm:mt-12 sm:gap-3">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center backdrop-blur-sm sm:flex-row sm:gap-3 sm:px-5 sm:py-4 sm:text-left"
              >
                <Icon
                  className="h-4 w-4 text-sky-300 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-base font-semibold leading-none sm:text-lg">
                    {value}
                  </dt>
                  <dd className="mt-1 text-[10px] text-white/50 sm:text-xs">
                    {label}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </main>
      </div>
    </section>
  );
};
