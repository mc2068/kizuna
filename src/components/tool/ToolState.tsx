'use client';

// Shared state of the sizing tool: the inputs, the engine result and the URL.
// The configurator writes the inputs; the summary, the full results (#10) and the hourly
// dashboard (#11) read the result with useTool(), so they can sit anywhere under <ToolStateProvider>.
// Until Hamza's engine port (#5) merges, @/lib/engine is the scaffold's fake: it ignores the inputs
// and always returns the frozen Djerba demo, so the numbers only move once the real engine lands.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { sizeHotel, type SizingInput, type SizingResult } from '@/lib/engine';
import { sameInputs, toSearchString } from './url-state';

/** Recompute this long after the last change, so dragging the slider stays smooth. */
const RECOMPUTE_DEBOUNCE_MS = 50;

type ToolState = {
  /** What the controls show right now. */
  inputs: SizingInput;
  /** The inputs the current result was computed from (lags `inputs` by the debounce). */
  resultInputs: SizingInput;
  result: SizingResult;
  /** True while a change is waiting for the debounce. */
  pending: boolean;
  setInputs: (patch: Partial<SizingInput>) => void;
};

const ToolContext = createContext<ToolState | null>(null);

export function ToolStateProvider({ initial, children }: { initial: SizingInput; children: React.ReactNode }) {
  const [inputs, setInputsState] = useState(initial);
  const [resultInputs, setResultInputs] = useState(initial);

  const setInputs = useCallback((patch: Partial<SizingInput>) => {
    setInputsState((prev) => {
      const next = { ...prev, ...patch };
      return sameInputs(prev, next) ? prev : next;
    });
  }, []);

  useEffect(() => {
    if (sameInputs(inputs, resultInputs)) return;
    const id = window.setTimeout(() => setResultInputs(inputs), RECOMPUTE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [inputs, resultInputs]);

  // The engine is pure and fast (well under one frame), so it runs in the browser on every settled change.
  const result = useMemo(() => sizeHotel(resultInputs), [resultInputs]);

  // Keep the URL in step without adding history entries. Skips the first render, so opening
  // /tool does not rewrite the address the visitor typed or followed.
  const lastWritten = useRef(initial);
  useEffect(() => {
    if (sameInputs(lastWritten.current, resultInputs)) return;
    lastWritten.current = resultInputs;
    const search = toSearchString(resultInputs);
    if (window.location.search !== search) {
      window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
    }
  }, [resultInputs]);

  const value = useMemo<ToolState>(
    () => ({ inputs, resultInputs, result, pending: !sameInputs(inputs, resultInputs), setInputs }),
    [inputs, resultInputs, result, setInputs],
  );

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
}

export function useTool(): ToolState {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useTool() must be used inside <ToolStateProvider>.');
  return ctx;
}
