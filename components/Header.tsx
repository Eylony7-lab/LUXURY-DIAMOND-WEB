import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

const NAV_LINKS = [
  { href: "/", label: "Diamonds" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-serif text-2xl tracking-[0.15em] text-charcoal transition-colors hover:text-gold-dark"
        >
          {SITE.name}
        </Link>

        <nav className="hidden items-center gap-10 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide text-charcoal-soft transition-colors hover:text-gold-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={SITE.phoneHref}
            aria-label={`Call us at ${SITE.phoneDisplay}`}
            title={SITE.phoneDisplay}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-charcoal-soft transition-colors hover:border-gold hover:text-gold-dark"
          >
            <Phone size={16} strokeWidth={1.5} />
          </a>
          <a
            href={SITE.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message us on WhatsApp"
            title="WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-charcoal-soft transition-colors hover:border-gold hover:text-gold-dark"
          >
            <MessageCircle size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </header>
  );
}
