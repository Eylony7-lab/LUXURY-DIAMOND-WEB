import { Gem } from "lucide-react";

export default function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Gem size={32} strokeWidth={1} className="text-gold" />
      <h3 className="mt-5 font-serif text-xl text-charcoal">
        No diamonds match your criteria
      </h3>
      <p className="mt-2 max-w-sm text-sm text-charcoal-soft">
        Try widening your filters, or clear them to browse the full collection.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-full border border-charcoal px-6 py-2.5 text-sm uppercase tracking-wide text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
      >
        Clear filters
      </button>
    </div>
  );
}
