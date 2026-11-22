import { describe, expect, it } from 'vitest';
import { sizeHotel } from '@/lib/engine';
import { formatRange, formatTnd, verdictTone, warningText } from '@/lib/present';

const demo = sizeHotel({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });

describe('formatTnd', () => {
  it('shows thousands as k below one million', () => {
    expect(formatTnd(200_000)).toBe('200k TND');
    expect(formatTnd(850)).toBe('850 TND');
  });
  it('shows millions with up to two decimals', () => {
    expect(formatTnd(1_750_000)).toBe('1.75 M TND');
    expect(formatTnd(1_200_000)).toBe('1.2 M TND');
  });
});

describe('formatRange', () => {
  it('formats payback from the favourable to the unfavourable end, central marked', () => {
    expect(formatRange(demo, 'paybackYears', 'years')).toEqual({
      favourable: '5 years',
      central: '9 years',
      unfavourable: '21.5 years',
      text: '5 to 21.5 years (9 central)',
    });
  });
  it('formats money ranges in TND', () => {
    expect(formatRange(demo, 'annualSavingsTnd', 'tnd').text).toBe('260k to 110k TND (200k TND central)');
  });
  it('formats CO2 in tonnes per year', () => {
    expect(formatRange(demo, 'co2AvoidedTonnes', 'tonnes').central).toBe('210 t/yr');
  });
});

describe('verdictTone', () => {
  it('maps each verdict to a tone', () => {
    expect(verdictTone('good fit')).toBe('good');
    expect(verdictTone('possible fit, needs a study')).toBe('maybe');
    expect(verdictTone('weak fit')).toBe('weak');
  });
});

describe('warningText', () => {
  it('passes the engine warning through for now', () => {
    expect(warningText('Central payback above 10 years.')).toBe('Central payback above 10 years.');
  });
});
