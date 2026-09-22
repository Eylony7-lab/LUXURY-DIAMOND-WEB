"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

type InquireButtonProps = {
  sku: string;
  title: string;
};

export default function InquireButton({ sku, title }: InquireButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire this up to a real backend / CRM (e.g. an API route that
    // forwards to email, a CRM like Salesforce/HubSpot, or a lead-capture
    // service). Currently the inquiry is not sent anywhere.
    setStatus("submitted");
  }

  function close() {
    setIsOpen(false);
    setStatus("idle");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex w-full items-center justify-center rounded-full bg-charcoal px-8 py-4 text-sm uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-gold-dark sm:w-auto"
      >
        Inquire About This Diamond
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/60 p-0 sm:items-center sm:p-6"
          onClick={close}
        >
          <div
            className="w-full max-w-md animate-fade-in rounded-t-2xl bg-ivory p-6 shadow-xl sm:rounded-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="font-serif text-xl text-charcoal">
                {status === "submitted" ? "Thank You" : "Inquire"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="text-charcoal-soft hover:text-gold-dark"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {status === "submitted" ? (
              <p className="mt-4 text-sm leading-relaxed text-charcoal-soft">
                Your inquiry about <span className="text-charcoal">{title}</span> ({sku})
                has been received. One of our diamond specialists will be in touch shortly.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <p className="text-sm text-charcoal-soft">
                  Regarding: <span className="text-charcoal">{title}</span> &middot; {sku}
                </p>

                <div>
                  <label htmlFor="inquire-name" className="text-xs uppercase tracking-wide text-charcoal-soft">
                    Name
                  </label>
                  <input
                    id="inquire-name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 w-full rounded border border-line bg-ivory px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="inquire-email" className="text-xs uppercase tracking-wide text-charcoal-soft">
                    Email
                  </label>
                  <input
                    id="inquire-email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 w-full rounded border border-line bg-ivory px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="inquire-phone" className="text-xs uppercase tracking-wide text-charcoal-soft">
                    Phone (optional)
                  </label>
                  <input
                    id="inquire-phone"
                    name="phone"
                    type="tel"
                    className="mt-1 w-full rounded border border-line bg-ivory px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="inquire-message" className="text-xs uppercase tracking-wide text-charcoal-soft">
                    Message
                  </label>
                  <textarea
                    id="inquire-message"
                    name="message"
                    rows={3}
                    defaultValue={`I'm interested in learning more about ${title} (${sku}).`}
                    className="mt-1 w-full resize-none rounded border border-line bg-ivory px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-charcoal px-6 py-3 text-sm uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-gold-dark"
                >
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
