import {
  ArrowRight,
  CalendarDays,
  Clock,
  Code2,
  MapPin,
  Music2,
  Palette,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

const categories = [
  { label: "Technology", icon: Code2 },
  { label: "Culture", icon: Music2 },
  { label: "Sports", icon: Trophy },
  { label: "Design", icon: Palette },
];

const events = [
  {
    title: "Hack the Campus",
    description:
      "A 24-hour build sprint for student teams shipping campus-first products.",
    date: "14 Mar",
    time: "9:00 AM",
    venue: "Innovation Lab",
    seats: "240 seats",
    tag: "Technology",
    tagClass: "bg-sky-500/15 text-sky-300 ring-sky-400/20",
    glow: "from-sky-500/25",
  },
  {
    title: "Rhythm Night",
    description:
      "Live music, open-mic sets and a closing performance from the college band.",
    date: "22 Mar",
    time: "6:30 PM",
    venue: "Open Air Theatre",
    seats: "800 seats",
    tag: "Culture",
    tagClass: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/20",
    glow: "from-fuchsia-500/25",
  },
  {
    title: "Design Sprint",
    description:
      "A hands-on studio day on design systems, prototyping and critique.",
    date: "05 Apr",
    time: "10:00 AM",
    venue: "Studio B",
    seats: "120 seats",
    tag: "Design",
    tagClass: "bg-amber-500/15 text-amber-300 ring-amber-400/20",
    glow: "from-amber-500/25",
  },
];

export const EventsSection = () => {
  return (
    <section
      id="events"
      className="relative overflow-hidden border-t border-white/5 bg-slate-950 px-6 py-20 text-white sm:px-10"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              What&apos;s on
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Upcoming events on campus
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/55">
              Curated by the student council. Reservations open two weeks before
              each event and close once seats run out.
            </p>
          </div>
          <a
            href="#host"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            View full calendar
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div id="categories" className="mt-10 flex flex-wrap gap-2">
          {categories.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/65"
            >
              <Icon className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {events.map((event) => (
            <article
              key={event.title}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20"
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${event.glow} to-transparent blur-2xl transition group-hover:scale-125`}
                aria-hidden="true"
              />

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${event.tagClass}`}
                >
                  {event.tag}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {event.seats}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {event.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
                {event.description}
              </p>

              <div className="mt-6 space-y-2 text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className="h-3.5 w-3.5 text-sky-300"
                    aria-hidden="true"
                  />
                  {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock
                    className="h-3.5 w-3.5 text-sky-300"
                    aria-hidden="true"
                  />
                  {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin
                    className="h-3.5 w-3.5 text-sky-300"
                    aria-hidden="true"
                  />
                  {event.venue}
                </div>
              </div>

              <a
                href="#host"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition group-hover:text-sky-300"
              >
                Reserve a seat
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
            </article>
          ))}
        </div>

        <div
          id="host"
          className="relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-fuchsia-500/15 p-8 sm:p-10"
        >
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-medium text-white/80">
                <Ticket className="h-3.5 w-3.5 text-sky-300" />
                For clubs and faculty
              </span>
              <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Ready to host your own event?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/60">
                Submit a proposal, reserve a venue and publish your event to
                every student on campus in a few minutes.
              </p>
            </div>

            <a
              href="mailto:events@igce.edu?subject=Event%20proposal"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
            >
              Start a proposal
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
