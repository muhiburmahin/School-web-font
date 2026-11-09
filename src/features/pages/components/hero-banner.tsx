"use client";

import { useEffect, useState } from "react";
import { CmsLink } from "@/components/safe/safe-link";
import { SafeImage } from "@/components/safe/safe-image";
import { useCopy } from "@/i18n/copy";
import type { PageBlock } from "../document";
import type { PageMedia } from "../types";

type HeroBlock = Extract<PageBlock, { type: "hero" }>;
type HeroButton = HeroBlock["buttons"][number];

interface BannerSlide {
  id: string;
  heading: string;
  text: string;
  alt: string;
  imageUrl: string | null;
}

const alignClass = { left: "text-left items-start", center: "text-center items-center", right: "text-right items-end" } as const;

export function HeroBanner({ block, media, previewBase }: { block: HeroBlock; media: PageMedia; previewBase?: string }) {
  const slides = visibleSlides(block, media);
  if (slides.length === 0) {
    return <HeroFrame heading={block.heading} text={block.text} alt="" imageUrl={null} align={block.align} buttons={block.buttons} fit={block.fit} position={block.position} previewBase={previewBase} />;
  }
  const slide = slides[0]!;
  if (slides.length === 1 && block.layout === "split" && slide.imageUrl) {
    return (
      <section className={`grid items-center gap-6 md:grid-cols-2 ${alignClass[block.align]}`}>
        <div className="grid gap-4 text-foreground">
          <h2 className="text-4xl font-semibold tracking-tight">{slide.heading}</h2>
          {slide.text ? <p className="whitespace-pre-wrap text-lg">{slide.text}</p> : null}
        </div>
        <div className="min-h-56 overflow-hidden rounded-2xl bg-[#042f2e]">
          <SafeImage className="h-full min-h-56 w-full object-cover" src={slide.imageUrl} alt={slide.alt} fallback="" />
        </div>
      </section>
    );
  }
  if (slides.length === 1) {
    return <HeroFrame heading={slide.heading} text={slide.text} alt={slide.alt} imageUrl={slide.imageUrl} align={block.align} buttons={block.buttons} fit={block.fit} position={block.position} previewBase={previewBase} />;
  }
  return <HeroSlider block={block} slides={slides} previewBase={previewBase} />;
}

function visibleSlides(block: HeroBlock, media: PageMedia): BannerSlide[] {
  const configured = (block.slides ?? []).filter((slide) => slide.enabled && (slide.mediaId || slide.heading.trim() || slide.text.trim())).map((slide) => ({
    id: slide.id,
    heading: slide.heading || block.heading,
    text: slide.text || block.text,
    alt: slide.alt || slide.heading || block.heading,
    imageUrl: imageUrl(slide.mediaId, media),
  }));
  const legacy = imageUrl(block.mediaId, media);
  const legacySlide = legacy && !configured.some((slide) => slide.imageUrl === legacy)
    ? [{ id: block.id, heading: block.heading, text: block.text, alt: block.heading, imageUrl: legacy }]
    : [];
  return [...legacySlide, ...configured];
}

function imageUrl(mediaId: string | null | undefined, media: PageMedia): string | null {
  if (!mediaId) return null;
  const item = media[mediaId];
  return item?.kind === "IMAGE" ? item.publicUrl : null;
}

function HeroSlider({ block, slides, previewBase }: { block: HeroBlock; slides: BannerSlide[]; previewBase?: string }) {
  const pageMessages = useCopy("pages");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduced = useReducedMotion();
  const interval = block.intervalSeconds ?? 5;
  const autoplay = block.autoplay !== false && !reduced;
  useEffect(() => {
    if (!autoplay || paused || hidden || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, interval * 1000);
    return () => window.clearInterval(timer);
  }, [autoplay, paused, hidden, slides.length, interval]);

  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const frame = (slide: BannerSlide) => (
    <HeroFrame heading={slide.heading} text={slide.text} alt={slide.alt} imageUrl={slide.imageUrl} align={block.align} buttons={block.buttons} fit={block.fit} position={block.position} previewBase={previewBase} />
  );
  return (
    <section
      aria-roledescription="carousel"
      aria-label={block.heading}
      className="relative min-h-80 overflow-hidden rounded-2xl sm:min-h-[28rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      {block.transition === "slide" ? (
        <div className="flex transition-transform duration-700 motion-reduce:transition-none" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, slideIndex) => <div key={slide.id} className="w-full shrink-0" aria-hidden={slideIndex !== index} inert={slideIndex === index ? undefined : true}>{frame(slide)}</div>)}
        </div>
      ) : (
        slides.map((slide, slideIndex) => (
          <div key={slide.id} aria-hidden={slideIndex !== index} inert={slideIndex === index ? undefined : true} className={slideIndex === index ? "relative" : "pointer-events-none absolute inset-0 opacity-0"}>
            {frame(slide)}
          </div>
        ))
      )}
      <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-between gap-3 px-4 sm:px-8">
        <button type="button" className="rounded-full bg-black/55 px-3 py-2 text-sm font-medium text-white underline decoration-2 underline-offset-4 focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none" onClick={() => setIndex((value) => (value - 1 + slides.length) % slides.length)}>
          {pageMessages.previousSlide}
        </button>
        <div className="flex items-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-current={slideIndex === index ? "true" : undefined}
              aria-label={`${slideIndex + 1}`}
              className={`size-2.5 rounded-full border-2 border-white focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none ${slideIndex === index ? "bg-white" : "bg-transparent"}`}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
        <button type="button" className="rounded-full bg-black/55 px-3 py-2 text-sm font-medium text-white underline decoration-2 underline-offset-4 focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none" onClick={() => setIndex((value) => (value + 1) % slides.length)}>
          {pageMessages.nextSlide}
        </button>
      </div>
    </section>
  );
}

function HeroFrame({
  heading,
  text,
  alt,
  imageUrl,
  align,
  buttons,
  fit,
  position,
  previewBase,
}: {
  heading: string;
  text: string;
  alt: string;
  imageUrl: string | null;
  align: HeroBlock["align"];
  buttons: HeroButton[];
  fit: HeroBlock["fit"];
  position: HeroBlock["position"];
  previewBase?: string;
}) {
  const imageFit = fit === "contain" ? "object-contain" : "object-cover";
  const imagePosition = position === "top" ? "object-top" : position === "bottom" ? "object-bottom" : "object-center";
  return (
    <section className={`relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl text-white shadow-sm sm:min-h-[28rem] ${alignClass[align]}`}>
      <div aria-hidden className="absolute inset-0 bg-[#042f2e]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(145deg,#083b38_0%,color-mix(in_srgb,var(--primary)_42%,#042f2e)_46%,#021716_100%)]" />
      <div aria-hidden className="absolute -left-20 top-0 size-72 rounded-full bg-white/10" />
      <div aria-hidden className="absolute right-0 bottom-0 size-64 rounded-full bg-black/25" />
      {imageUrl ? <SafeImage className={`absolute inset-0 h-full w-full ${imageFit} ${imagePosition}`} src={imageUrl} alt={alt} fallback="" /> : null}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
      <div className={`relative grid max-w-3xl gap-4 px-6 py-16 sm:px-12 sm:py-20 ${alignClass[align]}`}>
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">{heading}</h2>
        {text ? <p className="max-w-2xl whitespace-pre-wrap text-base text-white/90 sm:text-xl">{text}</p> : null}
        {buttons.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {buttons.map((button) => (
              <CmsLink key={button.url} href={button.url} previewBase={previewBase}>
                <span className="inline-flex rounded-md bg-white px-4 py-2 font-medium text-neutral-950 underline decoration-2 underline-offset-4">{button.label}</span>
              </CmsLink>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduced;
}

