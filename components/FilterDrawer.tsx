"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function FilterDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-full max-w-xs animate-fade-in overflow-y-auto bg-ivory p-6 shadow-xl">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="text-charcoal-soft hover:text-gold-dark"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
