import Image from "next/image";
import Link from "next/link";
import { shimmerBlurDataUrl } from "@/lib/blur";
import { formatCarat } from "@/lib/format";
import type { Diamond } from "@/lib/types";

/**
 * Pure image tile — no visible caption. Details appear in a hover overlay
 * (desktop: mouse hover; iPad/touch: first tap triggers the same :hover
 * state natively in Safari, a second tap on the still-hovered link then
 * navigates — no extra JS needed for the tap-tap pattern).
 */
export default function DiamondCard({ diamond }: { diamond: Diamond }) {
  const coverImage = diamond.images[0];

  return (
    <Link
      href={`/diamond/${diamond.sku}`}
      className="group relative block aspect-square overflow-hidden bg-ivory-dark animate-fade-in"
    >
      {coverImage ? (
        <Image
          src={coverImage}
          alt={diamond.title}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          placeholder="blur"
          blurDataURL={shimmerBlurDataUrl()}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-charcoal-soft/60">
          No image available
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-charcoal/80 p-4 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="font-serif text-lg leading-snug text-ivory">{diamond.title}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-gold-light">
          {diamond.shape} &middot; {formatCarat(diamond.carat)}
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-gold-light">
          Color {diamond.color} &middot; Clarity {diamond.clarity}
        </p>
      </div>
    </Link>
  );
}
