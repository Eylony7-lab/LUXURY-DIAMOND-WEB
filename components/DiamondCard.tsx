import Image from "next/image";
import Link from "next/link";
import { shimmerBlurDataUrl } from "@/lib/blur";
import { formatCarat } from "@/lib/format";
import type { Diamond } from "@/lib/types";

export default function DiamondCard({ diamond }: { diamond: Diamond }) {
  const coverImage = diamond.images[0];

  return (
    <Link
      href={`/diamond/${diamond.sku}`}
      className="group block animate-fade-in"
    >
      <div className="relative aspect-square overflow-hidden bg-ivory-dark">
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
        <div className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-500 group-hover:border-gold/40" />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-soft">
            {diamond.shape} &middot; {formatCarat(diamond.carat)}
          </p>
          <h3 className="mt-1 font-serif text-lg leading-snug text-charcoal">
            {diamond.title}
          </h3>
        </div>
      </div>
      <p className="mt-1 text-sm tracking-wide text-gold-dark">
        Color {diamond.color} &middot; Clarity {diamond.clarity}
      </p>
    </Link>
  );
}
