"use client";

type RangeSliderProps = {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
};

/** A dual-thumb range slider built from two overlapping native <input type="range">
 * elements — no external dependency, fully keyboard accessible. */
export default function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  formatValue = (v) => String(v),
}: RangeSliderProps) {
  const [low, high] = value;
  const span = Math.max(max - min, step);
  const lowPct = ((low - min) / span) * 100;
  const highPct = ((high - min) / span) * 100;

  function handleLowChange(next: number) {
    onChange([Math.min(next, high - step), high]);
  }

  function handleHighChange(next: number) {
    onChange([low, Math.max(next, low + step)]);
  }

  return (
    <div>
      <div className="relative h-5">
        <div className="absolute top-1/2 h-[2px] w-full -translate-y-1/2 bg-line" />
        <div
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-gold"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          className="luxury-range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => handleLowChange(Number(e.target.value))}
          aria-label="Minimum value"
        />
        <input
          type="range"
          className="luxury-range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => handleHighChange(Number(e.target.value))}
          aria-label="Maximum value"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-charcoal-soft">
        <span>{formatValue(low)}</span>
        <span>{formatValue(high)}</span>
      </div>
    </div>
  );
}
