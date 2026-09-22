import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import SpecTable from "@/components/SpecTable";
import InquireButton from "@/components/InquireButton";
import StorePriceTag from "@/components/StorePriceTag";
import { getAllDiamonds, getDiamondBySku } from "@/lib/diamonds";

export function generateStaticParams() {
  return getAllDiamonds().map((diamond) => ({ sku: diamond.sku }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  const diamond = getDiamondBySku(sku);

  if (!diamond) {
    return { title: "Diamond Not Found | Aurelia Diamonds" };
  }

  return {
    title: `${diamond.title} | Aurelia Diamonds`,
    description: diamond.description,
    openGraph: {
      title: diamond.title,
      description: diamond.description,
      images: diamond.images[0] ? [diamond.images[0]] : undefined,
    },
  };
}

export default async function DiamondDetailPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const diamond = getDiamondBySku(sku);

  if (!diamond) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-charcoal-soft transition-colors hover:text-gold-dark"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        Back to Collection
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <ImageGallery images={diamond.images} alt={diamond.title} />

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-charcoal-soft">
            {diamond.shape} &middot; {diamond.certificate} Certified
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-charcoal sm:text-4xl">
            {diamond.title}
          </h1>

          <div className="mt-8 border-t border-line pt-8">
            <SpecTable diamond={diamond} />
          </div>

          <div className="mt-8">
            <h2 className="font-serif text-lg text-charcoal">Description</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
              {diamond.description}
            </p>
          </div>

          <div className="mt-10 border-t border-line pt-8">
            <p className="text-xs uppercase tracking-[0.18em] text-charcoal-soft">
              Your Price
            </p>
            <div className="mt-3">
              <StorePriceTag sku={diamond.sku} />
            </div>
          </div>

          <div className="mt-8">
            <InquireButton sku={diamond.sku} title={diamond.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
