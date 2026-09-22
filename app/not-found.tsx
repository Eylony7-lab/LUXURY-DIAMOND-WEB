import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <h1 className="font-serif text-3xl text-charcoal">Page Not Found</h1>
      <p className="mt-3 text-sm text-charcoal-soft">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-charcoal px-6 py-3 text-sm uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-gold-dark"
      >
        Back to Collection
      </Link>
    </div>
  );
}
