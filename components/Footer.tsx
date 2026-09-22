import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-ivory-dark">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="font-serif text-xl tracking-[0.15em] text-charcoal">
              {SITE.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-charcoal-soft">
              Individually certified diamonds — curated for the stores and clients who appreciate
              rarity and craftsmanship.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-sm uppercase tracking-[0.2em] text-charcoal">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-charcoal-soft">
              <li>
                <a href={SITE.phoneHref} className="hover:text-gold-dark">
                  {SITE.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-gold-dark">
                  {SITE.email}
                </a>
              </li>
              <li>{SITE.hours}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-sm uppercase tracking-[0.2em] text-charcoal">
              Assurance
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-charcoal-soft">
              <li>GIA certified diamonds</li>
              <li>Handpicked for exceptional quality</li>
              <li>Trade pricing for retail partners</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-xs text-charcoal-soft/80">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
