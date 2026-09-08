'use client';

import { useState } from 'react';

/**
 * Meervoudige of enkelvoudige keuze als chips, met verborgen inputs zodat het
 * formulier ook zonder JavaScript een waarde stuurt (progressive enhancement).
 */
export function ChipGroup({ name, options, defaultValue = [], multi = true, max }: {
  name: string; options: ReadonlyArray<{ value: string; label: string }>; defaultValue?: readonly string[]; multi?: boolean; max?: number;
}) {
  const [selected, setSelected] = useState<string[]>([...defaultValue]);
  const toggle = (v: string) => setSelected((cur) => {
    if (!multi) return [v];
    if (cur.includes(v)) return cur.filter((x) => x !== v);
    if (max && cur.length >= max) return cur;
    return [...cur, v];
  });
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button key={o.value} type="button" className={`chip ${on ? 'chip-on' : ''}`} aria-pressed={on} onClick={() => toggle(o.value)}>
            {o.label}
          </button>
        );
      })}
      {selected.map((v) => <input key={v} type="hidden" name={multi ? `${name}[]` : name} value={v} />)}
    </div>
  );
}
