"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { shimmerBlurDataUrl } from "@/lib/blur";

export default function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-ivory-dark text-sm uppercase tracking-widest text-charcoal-soft/60">
        No images available
      </div>
    );
  }

  function goTo(index: number) {
    setActiveIndex((index + images.length) % images.length);
  }

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden bg-ivory-dark">
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${alt} — image ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="animate-fade-in object-cover"
          placeholder="blur"
          blurDataURL={shimmerBlurDataUrl()}
        />

        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          aria-label="Zoom image"
          className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-charcoal shadow transition-transform hover:scale-105"
        >
          <ZoomIn size={18} strokeWidth={1.5} />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-charcoal opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-charcoal opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border transition-colors ${
                index === activeIndex
                  ? "border-gold"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {isZoomOpen && (
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
              src={images[activeIndex]}
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
