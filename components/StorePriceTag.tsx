"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";

function storageKey(sku: string) {
  return `store-price:${sku}`;
}

/**
 * Lets the store representative holding the iPad type in whatever price
 * they want to quote for this stone. Saved to localStorage per SKU, so it's
 * local to this device only (no backend, no sync between stores) — exactly
 * what a fixed in-store kiosk needs.
 */
export default function StorePriceTag({ sku }: { sku: string }) {
  const [price, setPrice] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // localStorage doesn't exist during SSR, so hydrating from it genuinely
    // requires an effect (not derivable during render like other state here).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const saved = window.localStorage.getItem(storageKey(sku));
    if (saved) setPrice(Number(saved));
  }, [sku]);

  function startEditing() {
    setDraft(price !== null ? String(price) : "");
    setIsEditing(true);
  }

  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(draft);
    if (!Number.isFinite(value) || value <= 0) return;
    window.localStorage.setItem(storageKey(sku), String(value));
    setPrice(value);
    setIsEditing(false);
  }

  // Avoid a hydration mismatch: render nothing price-specific until we've
  // read localStorage on the client.
  if (!isMounted) {
    return <div className="h-9" />;
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="flex items-center gap-2">
        <span className="text-xl text-charcoal-soft">$</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="0"
          className="w-40 border-b border-gold bg-transparent font-serif text-2xl text-charcoal focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-charcoal px-4 py-1.5 text-xs uppercase tracking-wide text-ivory transition-colors hover:bg-gold-dark"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-xs uppercase tracking-wide text-charcoal-soft hover:text-charcoal"
        >
          Cancel
        </button>
      </form>
    );
  }

  if (price === null) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="flex items-center gap-2 rounded-full border border-dashed border-line px-4 py-2 text-sm text-charcoal-soft transition-colors hover:border-gold hover:text-gold-dark"
      >
        <Plus size={14} strokeWidth={1.5} />
        Set Your Price
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="font-serif text-2xl text-gold-dark">{formatPrice(price)}</p>
      <button
        type="button"
        onClick={startEditing}
        aria-label="Edit price"
        className="text-charcoal-soft transition-colors hover:text-gold-dark"
      >
        <Pencil size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
}
