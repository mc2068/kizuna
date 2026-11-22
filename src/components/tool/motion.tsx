'use client';

// Motion for the sizing tool (#27), after the Keynote prototype: numbers tween to their new value,
// rails glide, the verdict badge pops when it changes, blocks that come and go fold open and shut.
// Everything is instant under prefers-reduced-motion. Framer Motion drives it, so a tween updates
// the text through a motion value, not a React re-render per frame.
import { useEffect, useEffectEvent, useRef } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  type Transition,
} from 'framer-motion';

/** The prototype's easing (--ease: cubic-bezier(.2,.8,.2,1)). */
export const EASE = [0.2, 0.8, 0.2, 1] as const;
/** Numbers and rails: ~400 ms, as the prototype's result panel. */
export const TWEEN_S = 0.4;

export const GLIDE: Transition = { duration: TWEEN_S, ease: EASE };
const INSTANT: Transition = { duration: 0 };

/** True when motion should be skipped: the visitor asked for it, or we don't know yet (server render). */
export function useNoMotion(): boolean {
  return useReducedMotion() ?? true;
}

/** The transition for a glide, or none under reduced motion. */
export function useGlide(): Transition {
  return useNoMotion() ? INSTANT : GLIDE;
}

type Vec = readonly number[];

function lerp(from: Vec, to: Vec, p: number): number[] {
  return to.map((t, i) => (from[i] ?? t) + (t - (from[i] ?? t)) * p);
}

type TweenProps<V extends number | Vec> = {
  /** The target value(s). Several numbers tween together, e.g. the three ends of a range. */
  value: V;
  /** Turns the value(s) into the text shown. Must give the exact final text at the target value. */
  format: (value: V) => string;
  className?: string;
};

/**
 * Text that tweens from its last value to a new one. The first render (and the server) shows the
 * final text, so nothing moves on load; the last frame is always `format(value)` exactly.
 */
export function Tween<V extends number | Vec>({ value, format, className }: TweenProps<V>) {
  const noMotion = useNoMotion();
  const target: Vec = typeof value === 'number' ? [value] : (value as Vec);
  const key = target.join('|');
  const shown = useRef<Vec>(target);
  const text = useMotionValue(format(value));

  const toValue = (v: Vec) => (typeof value === 'number' ? v[0] : v) as V;

  const run = useEffectEvent(() => {
    const from = shown.current;
    if (noMotion || from.join('|') === key) {
      shown.current = target;
      text.set(format(value));
      return undefined;
    }
    const controls = animate(0, 1, {
      ...GLIDE,
      onUpdate: (p) => {
        const v = lerp(from, target, p);
        shown.current = v;
        text.set(format(toValue(v)));
      },
      onComplete: () => {
        shown.current = target;
        text.set(format(value));
      },
    });
    return () => controls.stop();
  });

  useEffect(() => run(), [key, noMotion]);
  // The format can change without the value (e.g. "1 year" vs "years" wording): keep the text in step.
  const formatted = format(value);
  useEffect(() => {
    if (shown.current.join('|') === key) text.set(formatted);
  }, [formatted, key, text]);

  return <motion.span className={className}>{text}</motion.span>;
}

/** A ref for an element that pops (scale 1 -> 1.08 -> 1) whenever `key` changes, never on first render. */
export function usePop<T extends Element>(key: string) {
  const [scope, animateScope] = useAnimate<T>();
  const noMotion = useNoMotion();
  const last = useRef(key);
  useEffect(() => {
    if (last.current === key) return;
    last.current = key;
    if (noMotion || !scope.current) return;
    animateScope(scope.current, { scale: [1, 1.08, 1] }, { duration: TWEEN_S, ease: EASE });
  }, [key, noMotion, scope, animateScope]);
  return scope;
}

/**
 * A block that folds open and shut as it comes and goes (the prototype's .collapse), instead of
 * making the content below jump. Instant under reduced motion. Nothing animates on first render.
 */
export function Collapse({ show, children, className }: { show: boolean; children: React.ReactNode; className?: string }) {
  const glide = useGlide();
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key="collapse"
          className={className}
          initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
          animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
          exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
          transition={glide}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
