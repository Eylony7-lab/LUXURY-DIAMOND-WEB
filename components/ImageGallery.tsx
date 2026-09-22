"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";
import { shimmerBlurDataUrl } from "@/lib/blur";

type Media = { type: "image"; src: string } | { type: "video"; src: string };

export default function ImageGallery({
  images,
  video,
  alt,
}: {
  images: string[];
  video?: string | null;
  alt: string;
}) {
  const media: Media[] = [
    ...images.map((src): Media => ({ type: "image", src })),
    ...(video ? [{ type: "video", src: video } as Media] : []),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-ivory-dark text-sm uppercase tracking-widest text-charcoal-soft/60">
        No images available
      </div>
    );
  }

  const active = media[activeIndex];

  function goTo(index: number) {
    setActiveIndex((index + media.length) % media.length);
  }

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden bg-ivory-dark">
        {active.type === "video" ? (
          <video
            key={active.src}
            src={active.src}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls
          />
        ) : (
          <Image
            key={active.src}
            src={active.src}
            alt={`${alt} — image ${activeIndex + 1}`}
            fill
            priority={activeIndex === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-in object-cover"
            placeholder="blur"
            blurDataURL={shimmerBlurDataUrl()}
          />
        )}

        {active.type === "image" && (
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            aria-label="Zoom image"
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-charcoal shadow transition-transform hover:scale-105"
          >
            <ZoomIn size={18} strokeWidth={1.5} />
          </button>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-charcoal opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-charcoal opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
          {media.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={item.type === "video" ? "Play video" : `View image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border transition-colors ${
                index === activeIndex
                  ? "border-gold"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-charcoal">
                  <Play size={20} strokeWidth={1.5} className="text-ivory" fill="currentColor" />
                </div>
              ) : (
                <Image src={item.src} alt="" fill sizes="80px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {isZoomOpen && active.type === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 p-4 sm:p-10"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close zoom"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 text-ivory hover:border-gold"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
          <div
            className="relative h-full w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={`${alt} — zoomed image ${activeIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
