// Role 3: thin helpers on top of Hamza's @/lib/present, so pages never format engine numbers their
// own way. Ranges read "5 to 21.5 years", like the tool and the PDF.
import { formatRange, formatTnd, formatTonnes, formatYears, type RangeKey } from '@/lib/present';
import type { PlantOption, Scenario, ScenarioResult } from '@/lib/engine';

type Source = Pick<PlantOption, 'scenarios'> | Record<Scenario, ScenarioResult>;

/** A plain number the engine already rounded, en-GB like @/lib/present: 5700 -> "5,700", 8.5 -> "8.5". */
export function num(n: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: maxFractionDigits }).format(n);
}

/** Low, central and high values of one output (raw numbers, for rails and charts). */
export function rangeOf(source: Source, key: RangeKey) {
  const v = formatRange(source, key).values;
  return { low: Math.min(v.favourable, v.unfavourable), central: v.central, high: Math.max(v.favourable, v.unfavourable) };
}

/** "5 to 21.5 years", "110k to 260k TND", "70 to 260 t CO2/yr" (formatRange's text without the central part). */
export function rangeText(source: Source, key: RangeKey): string {
  return formatRange(source, key).text.replace(/ \([^)]*central\)$/, '');
}

/** One value with the unit a RangeRail uses: 'years' | 'TND' | 't', else the number and the unit. */
export function valueText(v: number, unit: string): string {
  if (unit === 'years') return formatYears(v);
  if (unit === 'TND') return formatTnd(v);
  if (unit === 't') return formatTonnes(v);
  return unit ? `${num(v)} ${unit}` : num(v);
}
