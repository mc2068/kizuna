import { describe, expect, it } from 'vitest';
import { sizeHotel, type PlantOption, type Verdict, type Warning, type WarningCode } from '@/lib/engine';
import engineMessages from '../../../messages/en/engine.json';
import {
  assumptionUnit,
  formatAssumptionValue,
  formatHours,
  formatKw,
  formatPercent,
  formatRange,
  formatTnd,
  formatTonnes,
  formatYears,
  sourceParts,
  verdictKey,
  verdictTone,
  warningMessage,
  warningText,
  type RangeKey,
} from './index';

describe('formatTnd', () => {
  it.each([
    [0, '0 TND'],
    [950, '950 TND'],
    [25_000, '25k TND'],
    [200_000, '200k TND'],
    [610_000, '610k TND'],
    [995_000, '995k TND'],
    [999_600, '1 M TND'], // rounds to 1,000k: switch to millions instead of printing "1,000k"
    [1_000_000, '1 M TND'],
    [1_100_000, '1.1 M TND'],
    [1_750_000, '1.75 M TND'],
    [2_360_000, '2.36 M TND'], // as the engine computes it, not the "2.4" of the old table
    [-15_000, '-15k TND'],
    [-1_250_000, '-1.25 M TND'],
  ])('%d -> %s', (n, s) => expect(formatTnd(n)).toBe(s));
});

describe('formatYears', () => {
  it.each([
    [0.5, '0.5 years'],
    [1, '1 year'],
    [9, '9 years'],
    [21.5, '21.5 years'],
    [30, '30 years'],
    [30.5, 'over 30 years'],
    [64.5, 'over 30 years'],
    [99, 'over 30 years'],
  ])('%d -> %s', (n, s) => expect(formatYears(n)).toBe(s));
});

describe('single-value formatters', () => {
  it('power', () => {
    expect(formatKw(220)).toBe('220 kW');
    expect(formatKw(200, 'kWe')).toBe('200 kWe');
    expect(formatKw(64, 'kWc')).toBe('64 kWc');
    expect(formatKw(1000, 'kWe')).toBe('1,000 kWe');
  });
  it('tonnes', () => expect(formatTonnes(210)).toBe('210 t CO2/yr'));
  it('percent', () => {
    expect(formatPercent(0.16)).toBe('16%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(-0.1)).toBe('-10%');
    expect(formatPercent(0.155)).toBe('16%');
  });
  it('hours', () => {
    expect(formatHours(5700)).toBe('5,700 h/yr');
    expect(formatHours(0)).toBe('0 h/yr');
  });
});

describe('formatRange on the Djerba demo', () => {
  const demo = sizeHotel({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });
  const best = demo.options.best as PlantOption;
  const text = (o: PlantOption, k: RangeKey) => formatRange(o, k).text;

  it('texts read low to high with the unit once and central marked', () => {
    expect(text(demo, 'paybackYears')).toBe('5 to 21.5 years (9 central)');
    expect(text(demo, 'paybackYearsWithFte')).toBe('3.5 to 15 years (6 central)');
    expect(text(demo, 'capexTnd')).toBe('1.24 M to 2.36 M TND (1.75 M central)');
    expect(text(demo, 'annualSavingsTnd')).toBe('110k to 260k TND (200k central)');
    expect(text(demo, 'co2AvoidedTonnes')).toBe('70 to 260 t CO2/yr (210 central)');
    expect(text(demo, 'fullLoadHours')).toBe('4,900 to 6,100 h/yr (5,700 central)');
    expect(text(demo, 'primaryEnergySaving')).toBe('11% to 20% (16% central)');
    expect(text(best, 'capexTnd')).toBe('610k to 1.1 M TND (850k central)');
  });

  it('a range with one value prints it once', () => {
    const flat = formatRange(
      { scenarios: { ...best.scenarios, unfavourable: { ...best.scenarios.unfavourable, fullLoadHours: 6600 } } },
      'fullLoadHours',
    );
    expect(flat.text).toBe('6,600 h/yr');
  });

  it('central outside the favourable/unfavourable span is still shown', () => {
    // CHP-only full-load hours: 6,600 / 6,600 / 6,500 -> low end equals central.
    expect(text(best, 'fullLoadHours')).toBe('6,500 to 6,600 h/yr (6,600 central)');
  });

  it('paybacks beyond the plant life', () => {
    const small = sizeHotel({ rooms: 100, city: 'djerba', pool: true, elecPrice: null });
    expect(text(small, 'paybackYears')).toBe('10.5 to over 30 years (22.5 central)');
  });

  it("accepts the scenarios record and the scaffold's kind argument", () => {
    expect(formatRange(demo.scenarios, 'paybackYears').text).toBe('5 to 21.5 years (9 central)');
    expect(formatRange(demo, 'annualSavingsTnd', 'tnd').text).toBe('110k to 260k TND (200k central)');
  });

  it('per-scenario strings, raw values and the favourable end', () => {
    const r = formatRange(demo, 'paybackYears');
    expect([r.favourable, r.central, r.unfavourable]).toEqual(['5 years', '9 years', '21.5 years']);
    expect(r.values).toEqual({ favourable: 5, central: 9, unfavourable: 21.5 });
    expect(r.favourableEnd).toBe('low');
    expect(formatRange(demo, 'annualSavingsTnd').favourableEnd).toBe('high');
    expect(formatRange(demo, 'capexTnd').favourableEnd).toBe('low');
  });
});

describe('verdicts', () => {
  const all: Verdict[] = ['good fit', 'possible fit, needs a study', 'weak fit'];
  it('tones', () => expect(all.map(verdictTone)).toEqual(['good', 'maybe', 'weak']));
  it('every verdict key exists in messages/en/engine.json', () => {
    for (const v of all) {
      const [ns, id] = verdictKey(v).split('.') as ['verdicts', keyof typeof engineMessages.verdicts];
      expect(ns).toBe('verdicts');
      expect(engineMessages.verdicts[id], v).toBeTypeOf('string');
    }
  });
});

describe('warnings', () => {
  const examples = {
    lowFullLoadHours: { code: 'lowFullLoadHours', params: { hours: 2400, threshold: 4000 } },
    lowPrimaryEnergySaving: { code: 'lowPrimaryEnergySaving', params: { pes: -0.1, threshold: 0.1 } },
    longPayback: { code: 'longPayback', params: { years: 22.5, threshold: 10 } },
  } satisfies { [C in WarningCode]: Extract<Warning, { code: C }> };

  it('every code has a message whose placeholders are exactly params the engine sends', () => {
    const messages = engineMessages.warnings as Record<string, string>;
    expect(Object.keys(messages).sort()).toEqual(Object.keys(examples).sort());
    for (const w of Object.values(examples)) {
      const { key, values } = warningMessage(w);
      const message = messages[key.replace('warnings.', '')];
      expect(message, key).toBeTypeOf('string');
      const placeholders = [...(message as string).matchAll(/\{(\w+)/g)].map((m) => m[1]);
      for (const p of placeholders) expect(Object.keys(values), `${key} uses {${p}}`).toContain(p);
    }
  });

  it('warningText passes key and values to the translator', () => {
    const t = (key: string, values?: Record<string, number>) => `${key} ${JSON.stringify(values)}`;
    expect(warningText(examples.lowFullLoadHours, t)).toBe('warnings.lowFullLoadHours {"hours":2400,"threshold":4000}');
  });

  it('warningMessage does not share the engine object', () => {
    const w = examples.longPayback;
    const m = warningMessage(w);
    m.values.years = 0;
    expect(w.params.years).toBe(22.5);
  });
});

describe('assumption helpers', () => {
  const words = { yes: 'yes', no: 'no' };
  it('formatAssumptionValue', () => {
    expect(formatAssumptionValue(0.38, 'fraction', words)).toBe('38%');
    expect(formatAssumptionValue(0.425, 'fraction', words)).toBe('42.5%');
    expect(formatAssumptionValue(1, 'yes=1', words)).toBe('yes');
    expect(formatAssumptionValue(0, 'yes=1', words)).toBe('no');
    expect(formatAssumptionValue(7000, 'TND/kWe', words)).toBe('7,000');
    expect(formatAssumptionValue(0.068, 'TND/kWh', words)).toBe('0.068');
    expect(formatAssumptionValue(-0.12, '-', words)).toBe('-0.12');
  });
  it('assumptionUnit', () => {
    expect(['fraction', 'yes=1', '-', 'TND/kWh'].map(assumptionUnit)).toEqual(['', '', '', 'TND/kWh']);
  });
  it('sourceParts splits links out, without trailing punctuation', () => {
    expect(sourceParts('DOE 0.70 https://www.energy.gov/a.pdf. ESTIMATE')).toEqual([
      { kind: 'text', text: 'DOE 0.70 ' },
      { kind: 'link', href: 'https://www.energy.gov/a.pdf', label: 'energy.gov' },
      { kind: 'text', text: '. ESTIMATE' },
    ]);
    expect(sourceParts('no link')).toEqual([{ kind: 'text', text: 'no link' }]);
  });
  it('every engine source splits into parts that join back to the source', () => {
    for (const a of sizeHotel({}).assumptions) {
      const joined = sourceParts(a.source)
        .map((p) => (p.kind === 'text' ? p.text : p.href))
        .join('');
      expect(joined, a.name).toBe(a.source);
    }
  });
});
