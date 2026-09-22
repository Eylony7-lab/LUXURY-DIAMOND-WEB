import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-ivory-dark">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="font-serif text-xl tracking-[0.15em] text-charcoal">
              AURELIA
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-charcoal-soft">
              Ethically sourced, individually certified diamonds — curated for those who
              appreciate rarity and craftsmanship.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-sm uppercase tracking-[0.2em] text-charcoal">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-charcoal-soft">
              {/* TODO: replace placeholder contact details with real business info. */}
              <li>
                <a href="tel:+12125550148" className="hover:text-gold-dark">
                  +1 (212) 555-0148
                </a>
              </li>
              <li>
                <a href="mailto:concierge@aurelia-diamonds.example" className="hover:text-gold-dark">
                  concierge@aurelia-diamonds.example
                </a>
              </li>
              <li>By appointment only &mdash; New York, NY</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-sm uppercase tracking-[0.2em] text-charcoal">
              Assurance
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-charcoal-soft">
              <li>GIA certified diamonds</li>
              <li>Complimentary insured shipping</li>
              <li>30-day return policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-xs text-charcoal-soft/80">
          &copy; {new Date().getFullYear()} Aurelia Diamonds. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
