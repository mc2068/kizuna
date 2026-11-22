import { describe, expect, it } from 'vitest';
import type { SizingInput } from '@/lib/engine';
import {
  cleanHotelName,
  PENDING_KEY,
  PENDING_TTL_MS,
  pendingFromResume,
  resumePath,
  storePending,
  takePending,
  withoutResume,
} from './pending-project';

const inputs: SizingInput = { rooms: 420, city: 'tozeur', pool: false, elecPrice: 0.3 };
const NOW = 1_800_000_000_000;

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const broken = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('cleanHotelName', () => {
  it('trims and collapses spaces, and accepts 2 to 80 characters', () => {
    expect(cleanHotelName('  Hotel   Azur ')).toBe('Hotel Azur');
    expect(cleanHotelName('A')).toBeNull();
    expect(cleanHotelName('   ')).toBeNull();
    expect(cleanHotelName('x'.repeat(80))).toHaveLength(80);
    expect(cleanHotelName('x'.repeat(81))).toBeNull();
  });
});

describe('pending project storage', () => {
  it('stores, then takes the project once', () => {
    const s = memoryStorage();
    expect(storePending({ hotelName: 'Hotel Azur', inputs, savedAt: NOW }, s)).toBe(true);
    expect(takePending(NOW + 1000, s)).toEqual({ hotelName: 'Hotel Azur', inputs, savedAt: NOW });
    expect(takePending(NOW + 2000, s)).toBeNull();
    expect(s.data.has(PENDING_KEY)).toBe(false);
  });

  it('drops a project older than 24 hours', () => {
    const s = memoryStorage();
    storePending({ hotelName: 'Hotel Azur', inputs, savedAt: NOW }, s);
    expect(takePending(NOW + PENDING_TTL_MS + 1, s)).toBeNull();
    expect(s.data.has(PENDING_KEY)).toBe(false);
  });

  it('ignores malformed values and clamps the inputs like the URL does', () => {
    const s = memoryStorage();
    s.setItem(PENDING_KEY, '{not json');
    expect(takePending(NOW, s)).toBeNull();
    s.setItem(PENDING_KEY, JSON.stringify({ hotelName: 'Hotel Azur', savedAt: NOW }));
    expect(takePending(NOW, s)).toBeNull();
    s.setItem(PENDING_KEY, JSON.stringify({ hotelName: 'Hotel Azur', savedAt: NOW, inputs: { rooms: 5000, city: 'paris', pool: true, elecPrice: null }, results: { engineKwe: 1 } }));
    const p = takePending(NOW, s);
    expect(p?.inputs).toEqual({ rooms: 800, city: 'djerba', pool: true, elecPrice: null });
    expect(p).not.toHaveProperty('results');
  });

  it('reports unavailable storage instead of throwing', () => {
    expect(storePending({ hotelName: 'Hotel Azur', inputs, savedAt: NOW }, broken)).toBe(false);
    expect(storePending({ hotelName: 'Hotel Azur', inputs, savedAt: NOW }, null)).toBe(false);
    expect(takePending(NOW, broken)).toBeNull();
  });
});

describe('resume URL', () => {
  it('returns to /tool with the inputs and resume=1', () => {
    expect(resumePath(inputs)).toBe('/tool?rooms=420&city=tozeur&pool=0&price=0.3&resume=1');
    expect(resumePath(inputs, 'Hotel Azur')).toBe('/tool?rooms=420&city=tozeur&pool=0&price=0.3&resume=1&hotel=Hotel+Azur');
  });

  it('prefers the stored project and falls back to the URL', () => {
    const s = memoryStorage();
    storePending({ hotelName: 'Stored Hotel', inputs, savedAt: NOW }, s);
    const url = new URL(`http://x${resumePath(inputs, 'Url Hotel')}`).searchParams;
    expect(pendingFromResume(url, NOW, s)?.hotelName).toBe('Stored Hotel');
    expect(pendingFromResume(url, NOW, s)).toEqual({ hotelName: 'Url Hotel', inputs, savedAt: NOW });
    expect(pendingFromResume(new URLSearchParams('resume=1'), NOW, s)).toBeNull();
    expect(pendingFromResume(new URLSearchParams('hotel=Url+Hotel'), NOW, s)).toBeNull();
  });

  it('removes resume and hotel from the URL after the save', () => {
    expect(withoutResume('/tool', '?rooms=420&city=tozeur&pool=0&price=&resume=1&hotel=X', '#results')).toBe(
      '/tool?rooms=420&city=tozeur&pool=0&price=#results',
    );
    expect(withoutResume('/tool', '?resume=1')).toBe('/tool');
  });
});
