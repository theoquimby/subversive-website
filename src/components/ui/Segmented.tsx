"use client";

// Segmented control (spec §4.11): radio-group semantics from Radix (arrow keys, roving
// tabindex, aria-checked), every visual ours. The ink thumb slides behind the selected
// option in 220 ms. The options are equal width, so a CSS translate is the whole layout
// animation; Motion is not loaded for it (plan Q3 budget).
import { RadioGroup } from "radix-ui";
import type { CSSProperties } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (v: T) => void;
  className?: string;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <RadioGroup.Root
      className={className ? `seg ${className}` : "seg"}
      aria-label={label}
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      orientation="horizontal"
      loop
      style={{ "--seg-i": index, "--seg-n": options.length } as CSSProperties}
    >
      <span className="seg__thumb" aria-hidden="true" />
      {options.map((o) => (
        <RadioGroup.Item key={o.value} value={o.value} className="seg__opt" data-value={o.value}>
          {o.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
