import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowUp,
  BadgeCheck,
  GraduationCap,
  MoveUpRight,
  Sparkles,
} from "lucide-react";

const NAME = "Shailesh Tiwari";
const COLLEGE = "Indo Global College of Engineering";

const badges = [
  { icon: GraduationCap, label: "5th Semester" },
  { icon: BadgeCheck, label: "IGCE" },
  { icon: Sparkles, label: "Creator" },
];

const PORTRAIT_SRC = "/assets/shalu.png";
const DRAG_SOUND_SRC = "/assets/click-sound.mp3";

type Point = { x: number; y: number };
type PortraitBox = Point & { width: number; height: number };

const KEYBOARD_DELTA: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const clampToViewport = (
  x: number,
  y: number,
  width: number,
  height: number,
): Point => ({
  x: clampValue(x, 0, window.innerWidth - width),
  y: clampValue(y, 0, window.innerHeight - height),
});

const rewindAudio = (audio: HTMLAudioElement) => {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Resetting a media element that is still loading can throw.
  }
};

type PortraitVisualProps = {
  portraitOk: boolean;
  floating?: boolean;
  onError: () => void;
};

const PortraitVisual = ({
  portraitOk,
  floating = false,
  onError,
}: PortraitVisualProps) => {
  if (portraitOk) {
    return (
      <img
        src={PORTRAIT_SRC}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={onError}
        onDragStart={(event) => event.preventDefault()}
        className={`mx-auto block select-none object-contain mix-blend-screen ${
          floating
            ? "h-full w-full"
            : "h-auto max-h-40 w-auto max-w-full sm:max-h-56 lg:max-h-72"
        }`}
      />
    );
  }

  return (
    <div
      className={`grid place-items-center gap-2 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-sky-500/20 via-slate-950/80 to-fuchsia-500/20 shadow-[0_30px_70px_-25px_rgba(139,92,246,0.65)] backdrop-blur ${
        floating ? "h-full w-full" : "h-40 w-28 sm:h-56 sm:w-36 lg:h-72 lg:w-44"
      }`}
    >
      <span className="bg-gradient-to-br from-white via-sky-200 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
        ST
      </span>
      <span className="text-[9px] uppercase tracking-[0.28em] text-white/40">
        Shailesh
      </span>
    </div>
  );
};

export const CreatorFooter = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const hangingHandleRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const dragSizeRef = useRef({ width: 0, height: 0 });
  const livePositionRef = useRef<Point>({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const focusDraggedRef = useRef(false);
  const focusHangingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBrokenRef = useRef(false);

  const [imageOk, setImageOk] = useState(true);
  const [portraitOk, setPortraitOk] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [portraitBox, setPortraitBox] = useState<PortraitBox | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const portrait = portraitRef.current;
    const marquee = marqueeRef.current;
    const title = titleRef.current;
    if (!section || !portrait) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let queued = false;

    const apply = () => {
      queued = false;

      if (media.matches) {
        portrait.style.transform = "";
        if (marquee) marquee.style.transform = "";
        if (title) title.style.transform = "";
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const raw = (viewport - rect.top) / (viewport + rect.height);
      const progress = Math.min(1, Math.max(0, raw));

      portrait.style.transform = `translate3d(0, ${(
        (0.5 - progress) *
        170
      ).toFixed(2)}px, 0) scale(${(0.92 + progress * 0.08).toFixed(3)})`;

      if (marquee) {
        marquee.style.transform = `translate3d(${(
          (0.5 - progress) *
          240
        ).toFixed(2)}px, 0, 0)`;
      }

      if (title) {
        title.style.transform = `translate3d(${(
          (progress - 0.5) *
          56
        ).toFixed(2)}px, 0, 0)`;
      }
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  const stopDragSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    rewindAudio(audio);
  }, []);

  const startDragSound = useCallback(() => {
    if (audioBrokenRef.current) return;

    let audio = audioRef.current;

    if (!audio) {
      const created = new Audio(DRAG_SOUND_SRC);
      created.loop = true;
      created.volume = 0.6;
      created.preload = "auto";
      created.addEventListener("error", () => {
        audioBrokenRef.current = true;
        created.pause();
      });
      audioRef.current = created;
      audio = created;
    }

    rewindAudio(audio);

    const playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {
        // Autoplay policies, missing files, or decode errors are non-fatal.
      });
    }
  }, []);

  const finishDrag = useCallback(
    (options: { returnToHanging?: boolean } = {}) => {
      const wasDragging = draggingRef.current;
      const activePointer = activePointerRef.current;
      const dragHandle = dragHandleRef.current;

      draggingRef.current = false;
      activePointerRef.current = null;
      stopDragSound();

      if (dragHandle && activePointer !== null) {
        try {
          if (dragHandle.hasPointerCapture?.(activePointer)) {
            dragHandle.releasePointerCapture(activePointer);
          }
        } catch {
          // Capture may already be gone after cancellation.
        }
      }

      setIsDragging(false);

      if (wasDragging && dragHandle && !options.returnToHanging) {
        const rect = dragHandle.getBoundingClientRect();
        const next = clampToViewport(
          rect.left,
          rect.top,
          dragSizeRef.current.width,
          dragSizeRef.current.height,
        );
        livePositionRef.current = next;
        setPortraitBox((previous) =>
          previous ? { ...previous, x: next.x, y: next.y } : previous,
        );
      }

      if (options.returnToHanging) {
        setPortraitBox(null);
        focusHangingRef.current = true;
      }
    },
    [stopDragSound],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const handle = event.currentTarget;
      const rect = handle.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      event.preventDefault();
      try {
        handle.focus({ preventScroll: true });
      } catch {
        // Older browsers may not support focus options.
      }

      dragSizeRef.current = { width: rect.width, height: rect.height };
      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      livePositionRef.current = { x: rect.left, y: rect.top };
      activePointerRef.current = event.pointerId;
      draggingRef.current = true;
      focusDraggedRef.current = true;

      setPortraitBox({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
      setIsDragging(true);
      startDragSound();
    },
    [startDragSound],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" || event.key === "Home") {
        if (portraitBox || draggingRef.current) {
          event.preventDefault();
          finishDrag({ returnToHanging: true });
        }
        return;
      }

      const direction = KEYBOARD_DELTA[event.key];
      if (!direction) return;

      event.preventDefault();
      const step = event.shiftKey ? 48 : 12;

      let base = portraitBox;
      if (!base) {
        const hangingHandle = hangingHandleRef.current;
        if (!hangingHandle) return;
        const rect = hangingHandle.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        base = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
        dragSizeRef.current = { width: rect.width, height: rect.height };
        focusDraggedRef.current = true;
      }

      const next = clampToViewport(
        base.x + direction.x * step,
        base.y + direction.y * step,
        base.width,
        base.height,
      );
      const nextBox = { ...base, x: next.x, y: next.y };
      livePositionRef.current = next;
      setPortraitBox(nextBox);

      if (dragHandleRef.current) {
        dragHandleRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      }
    },
    [finishDrag, portraitBox],
  );

  const preventNativeDrag = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  useEffect(() => {
    if (portraitBox && focusDraggedRef.current) {
      focusDraggedRef.current = false;
      dragHandleRef.current?.focus({ preventScroll: true });
    }

    if (!portraitBox && focusHangingRef.current) {
      focusHangingRef.current = false;
      hangingHandleRef.current?.focus({ preventScroll: true });
    }
  }, [portraitBox]);

  useEffect(() => {
    if (!isDragging || !portraitBox) return;

    const handle = dragHandleRef.current;
    const pointerId = activePointerRef.current;
    if (!handle || pointerId === null) return;

    try {
      handle.setPointerCapture(pointerId);
    } catch {
      // Pointer capture is best-effort; window listeners still finish the drag.
    }
  }, [isDragging, portraitBox]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (
        activePointerRef.current !== null &&
        event.pointerId !== activePointerRef.current
      ) {
        return;
      }

      event.preventDefault();
      const { width, height } = dragSizeRef.current;
      const next = clampToViewport(
        event.clientX - dragOffsetRef.current.x,
        event.clientY - dragOffsetRef.current.y,
        width,
        height,
      );

      livePositionRef.current = next;
      if (dragHandleRef.current) {
        dragHandleRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [isDragging]);

  useEffect(() => {
    const matchesActivePointer = (event: PointerEvent) =>
      activePointerRef.current === null ||
      event.pointerId === activePointerRef.current;

    const handlePointerUp = (event: PointerEvent) => {
      if (draggingRef.current && matchesActivePointer(event)) {
        finishDrag();
      }
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (draggingRef.current && matchesActivePointer(event)) {
        finishDrag();
      }
    };

    const handleWindowBlur = () => {
      if (draggingRef.current) finishDrag();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && draggingRef.current) finishDrag();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && draggingRef.current) {
        event.preventDefault();
        finishDrag({ returnToHanging: true });
      }
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [finishDrag]);

  useEffect(() => {
    if (!portraitBox || isDragging) return;

    const keepInViewport = () => {
      setPortraitBox((previous) => {
        if (!previous) return previous;
        const next = clampToViewport(
          previous.x,
          previous.y,
          previous.width,
          previous.height,
        );
        return next.x === previous.x && next.y === previous.y
          ? previous
          : { ...previous, ...next };
      });
    };

    window.addEventListener("resize", keepInViewport);
    return () => window.removeEventListener("resize", keepInViewport);
  }, [isDragging, portraitBox]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const resetTilt = useCallback(() => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.style.transform = "rotateX(0deg) rotateY(0deg)";
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tilt = tiltRef.current;
      if (!tilt) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      tilt.style.transform = `rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(
        x * 20
      ).toFixed(2)}deg)`;
    },
    [],
  );

  return (
    <section
      ref={sectionRef}
      id="creator"
      className="relative isolate overflow-hidden border-t border-white/5 bg-slate-950 px-6 pb-10 pt-24 text-white sm:px-10"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.12),transparent_45%),radial-gradient(circle_at_85%_65%,rgba(168,85,247,0.16),transparent_50%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Designed &amp; developed by
            </p>

            <div ref={titleRef} className="mt-5 will-change-transform">
              <h2 className="animate-name-shimmer bg-gradient-to-r from-sky-300 via-white to-fuchsia-300 bg-clip-text text-5xl font-black leading-[0.95] tracking-tight text-transparent sm:text-6xl lg:text-7xl">
                {NAME}
              </h2>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
              5th semester student at{" "}
              <span className="text-white/85">{COLLEGE}</span>, building this
              campus events experience from the ground up.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {badges.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/65"
                >
                  <Icon className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#events"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
              >
                Explore the events
                <MoveUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#top"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
              >
                <ArrowUp className="h-4 w-4" />
                Back to top
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm [perspective:1400px]">
            <div
              className="pointer-events-none absolute inset-x-6 top-1/2 h-64 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-fuchsia-500/20 blur-3xl"
              aria-hidden="true"
            />

            <div
              ref={portraitRef}
              className="relative will-change-transform"
            >
              <div className="animate-float-slow [transform-style:preserve-3d]">
                <div
                  ref={tiltRef}
                  onPointerMove={handlePointerMove}
                  onPointerLeave={resetTilt}
                  onPointerCancel={resetTilt}
                  className="relative rounded-[2.25rem] [transform-style:preserve-3d] transition-transform duration-150 ease-out"
                >
                  <div
                    className="absolute inset-0 translate-x-5 translate-y-6 rotate-3 rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-sky-500/20 to-transparent"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 -translate-x-4 translate-y-3 -rotate-2 rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-fuchsia-500/20 to-transparent"
                    aria-hidden="true"
                  />

                  <div className="relative overflow-hidden rounded-[2.25rem] border border-white/15 bg-slate-900/80 p-3 shadow-[0_35px_90px_-25px_rgba(56,189,248,0.45)] backdrop-blur-xl">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-sky-500/25 via-slate-900 to-fuchsia-500/25">
                      {imageOk ? (
                        <img
                          src="/assets/portrait.png"
                          alt="Portrait of Shailesh Tiwari"
                          loading="lazy"
                          decoding="async"
                          onError={() => setImageOk(false)}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <div className="relative grid h-full place-items-center">
                          <span className="absolute h-60 w-60 rounded-full border border-white/10" />
                          <span className="absolute h-44 w-44 rounded-full border border-dashed border-sky-300/30" />
                          <span className="absolute h-28 w-28 animate-spin-slow rounded-full border border-fuchsia-300/40 border-t-transparent" />
                          <span className="bg-gradient-to-br from-white via-sky-200 to-fuchsia-200 bg-clip-text text-7xl font-black tracking-tight text-transparent">
                            ST
                          </span>
                          <span className="absolute bottom-24 text-[10px] uppercase tracking-[0.32em] text-white/40">
                            Shailesh Tiwari
                          </span>
                        </div>
                      )}

                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"
                        aria-hidden="true"
                      />
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-sky-300/25 to-transparent"
                        aria-hidden="true"
                      />

                      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur">
                        <div>
                          <p className="text-sm font-semibold">{NAME}</p>
                          <p className="text-[11px] text-white/50">
                            5th Semester · IGCE
                          </p>
                        </div>
                        <BadgeCheck
                          className="h-5 w-5 text-sky-300"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute -left-5 top-10 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left shadow-lg backdrop-blur"
                    style={{ transform: "translate3d(0, 0, 60px)" }}
                  >
                    <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
                      <GraduationCap className="h-3.5 w-3.5 text-sky-300" />
                      Semester
                    </p>
                    <p className="mt-1 text-lg font-semibold leading-none">05</p>
                  </div>

                  <div
                    className="absolute -right-4 bottom-16 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left shadow-lg backdrop-blur"
                    style={{ transform: "translate3d(0, 0, 80px)" }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                      College
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-tight">
                      Indo Global
                    </p>
                    <p className="text-[10px] text-white/45">
                      College of Engineering
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-20 overflow-hidden border-y border-white/5 py-6">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-950 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-950 to-transparent"
            aria-hidden="true"
          />
          <div ref={marqueeRef} className="will-change-transform">
            <div className="animate-marquee flex w-max items-center gap-10">
              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={index}
                  className="flex items-center gap-10 whitespace-nowrap text-2xl font-semibold uppercase tracking-[0.2em] text-white/15 sm:text-3xl"
                >
                  {NAME}
                  <Sparkles
                    className="h-4 w-4 text-sky-300/50"
                    aria-hidden="true"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        <footer
          id="creator-footer"
          className="relative mt-14 flex min-h-[15rem] flex-col border-t border-white/5 pt-8 sm:min-h-[20rem] lg:min-h-[24rem]"
        >
          <div
            className="pointer-events-none absolute left-0 top-0 z-0 hidden w-[19rem] sm:block lg:w-[22rem]"
            aria-hidden="true"
          >
            <div className="relative">
              <div
                className="web-motif absolute -left-12 -top-12 h-48 w-48 rounded-full opacity-50"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(from 0deg, rgba(125, 211, 252, 0.34) 0deg 0.7deg, transparent 0.7deg 15deg)",
                  WebkitMaskImage:
                    "radial-gradient(circle, #000 58%, transparent 72%)",
                  maskImage:
                    "radial-gradient(circle, #000 58%, transparent 72%)",
                }}
              />
              <span className="web-breathe absolute -left-12 -top-12 h-48 w-48 rounded-full border border-sky-300/15" />
              <span className="absolute left-1 top-1 h-28 w-28 rounded-full border border-sky-300/15" />
              <span className="absolute left-8 top-8 h-14 w-14 rounded-full border border-sky-300/15" />

              <div
                className="absolute -right-2 -top-4 grid h-14 w-14 place-items-center bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-[0_0_34px_rgba(168,85,247,0.6)]"
                style={{
                  clipPath:
                    "polygon(50% 0%, 61% 34%, 97% 26%, 70% 53%, 88% 88%, 56% 68%, 30% 98%, 37% 60%, 2% 52%, 39% 42%)",
                }}
              >
                <span className="-rotate-6 text-[8px] font-black uppercase tracking-[0.14em]">
                  Thwip!
                </span>
              </div>

              <div className="relative ml-4 mt-2 rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_0_50px_-12px_rgba(139,92,246,0.6)] backdrop-blur">
                <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-sky-300/80">
                  Your friendly neighborhood
                </p>
                <p className="mt-1 bg-gradient-to-r from-white via-sky-200 to-fuchsia-300 bg-clip-text text-2xl font-black uppercase leading-none tracking-tight text-transparent">
                  Spider-Man
                </p>
                <div className="mt-3 flex items-start gap-2 border-t border-white/10 pt-3">
                  <span className="relative mt-1 flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-white/80">
                      Grab Spidey. Swing him anywhere.
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-white/40">
                      He hangs around until you refresh the page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mb-5 flex sm:hidden" aria-hidden="true">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-sky-200/75">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />
              Grab Spidey
            </span>
          </div>

          <div className="relative z-10 mt-auto flex flex-col items-start justify-between gap-6 pb-2 pr-32 sm:flex-row sm:items-center sm:pr-52 lg:pr-64">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 text-sm font-black tracking-tight text-white">
                ST
              </span>
              <div>
                <p className="text-sm font-semibold">{NAME}</p>
                <p className="text-[11px] text-white/45">
                  5th Semester · {COLLEGE}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45">
              <span>© {new Date().getFullYear()} IGCE Events</span>
              <span className="hidden h-3 w-px bg-white/10 sm:block" />
              <a
                href="#events"
                className="transition hover:text-white/80"
              >
                Events
              </a>
              <a
                href="#host"
                className="transition hover:text-white/80"
              >
                Host an event
              </a>
              <a
                href="#top"
                className="inline-flex items-center gap-1.5 transition hover:text-white/80"
              >
                Top
                <ArrowUp className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>

          {!portraitBox && (
            <div className="pointer-events-none absolute right-0 top-0 z-20 w-28 sm:-right-3 sm:w-40 lg:-right-6 lg:w-[12.5rem]">
              <div className="hanging-group group pointer-events-auto relative">
                <span
                  className="hanging-anchor absolute left-1/2 top-0 z-20 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  aria-hidden="true"
                />

                <div className="hanging-swing">
                  <svg
                    className="hanging-thread mx-auto block h-12 w-10 sm:h-16 lg:h-20"
                    viewBox="0 0 40 64"
                    preserveAspectRatio="none"
                    fill="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="hanging-web-thread"
                        x1="20"
                        y1="0"
                        x2="20"
                        y2="64"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#ffffff" stopOpacity="0.92" />
                        <stop offset="0.5" stopColor="#f4f1ff" stopOpacity="0.85" />
                        <stop offset="1" stopColor="#e6f2ff" stopOpacity="0.78" />
                      </linearGradient>
                    </defs>
                    <g
                      stroke="url(#hanging-web-thread)"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    >
                      <path
                        d="M20 0C18.6 12 21.4 22 20 34C18.6 46 21.4 55 20 64"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M20 11L11 18M20 11L29 18"
                        strokeWidth="0.8"
                        strokeOpacity="0.55"
                      />
                      <path
                        d="M20 30L12 36M20 30L28 36"
                        strokeWidth="0.8"
                        strokeOpacity="0.45"
                      />
                      <path
                        d="M20 48L13 53M20 48L27 53"
                        strokeWidth="0.8"
                        strokeOpacity="0.35"
                      />
                    </g>
                  </svg>

                  <div className="hanging-float -mt-0.5">
                    <div className="hanging-glow relative mx-auto w-fit">
                      <div
                        className="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.35),rgba(56,189,248,0.16),transparent_78%)] blur-2xl"
                        aria-hidden="true"
                      />

                      <div
                        ref={hangingHandleRef}
                        role="button"
                        tabIndex={0}
                        aria-roledescription="draggable Spider-Man portrait"
                        aria-label="Spider-Man is hanging from a web. Drag him with a pointer, or use the arrow keys to move him. Press Home or Escape to hang him back up."
                        onPointerDown={handlePointerDown}
                        onKeyDown={handleKeyDown}
                        onDragStart={preventNativeDrag}
                        className="relative w-fit cursor-grab touch-none select-none rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:cursor-grabbing"
                      >
                        <PortraitVisual
                          portraitOk={portraitOk}
                          onError={() => setPortraitOk(false)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </footer>
      </div>

      {portraitBox &&
        createPortal(
          <div
            ref={dragHandleRef}
            role="button"
            tabIndex={0}
            aria-roledescription="draggable Spider-Man portrait"
            aria-label="Spider-Man. Drag to move him around the page, use the arrow keys to nudge him, or press Home or Escape to hang him back up."
            aria-grabbed={isDragging}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            onDragStart={preventNativeDrag}
            onLostPointerCapture={() => {
              if (draggingRef.current) finishDrag();
            }}
            className={`fixed left-0 top-0 touch-none select-none rounded-2xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              width: portraitBox.width,
              height: portraitBox.height,
              transform: `translate3d(${portraitBox.x}px, ${portraitBox.y}px, 0)`,
              zIndex: 2147483000,
              willChange: isDragging ? "transform" : undefined,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.35),rgba(56,189,248,0.16),transparent_78%)] blur-2xl"
              aria-hidden="true"
            />
            <div className="hanging-glow h-full w-full">
              <PortraitVisual
                portraitOk={portraitOk}
                floating
                onError={() => setPortraitOk(false)}
              />
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
};
