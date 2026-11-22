'use client';

// The four inputs of the sizing tool. Native form controls (range, radios, a switch button and a
// number field) so mouse, touch and keyboard all work and every control has a real label.
import { useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTool } from './ToolState';
import { CITIES } from '@/lib/engine';
import { PRICE, ROOMS, clampPrice } from './url-state';

/** Pre-filled when switching to a flat price: STEG medium-voltage day rate, before VAT (engine/model.mjs STEG_TOU.day). */
const FLAT_PRICE_START = 0.29;

// Rooms slider, after the Keynote prototype: thin track filled up to the thumb (--track, set inline), large white thumb.
// Written out in full so Tailwind's scanner sees every class.
const rangeClass = [
  'h-7 w-full cursor-pointer appearance-none bg-transparent touch-pan-y focus-visible:outline-none',
  '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded [&::-webkit-slider-runnable-track]:[background:var(--track)]',
  '[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded [&::-moz-range-track]:[background:var(--track)]',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_.5px_rgba(0,0,0,.04),0_3px_8px_rgba(0,0,0,.15),0_3px_1px_rgba(0,0,0,.06)] [&::-webkit-slider-thumb]:-mt-3',
  '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_.5px_rgba(0,0,0,.04),0_3px_8px_rgba(0,0,0,.15),0_3px_1px_rgba(0,0,0,.06)]',
  'focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-[rgba(0,125,250,.35)]',
  'focus-visible:[&::-moz-range-thumb]:ring-4 focus-visible:[&::-moz-range-thumb]:ring-[rgba(0,125,250,.35)]',
].join(' ');

const fieldClass = 'border-b border-[var(--line,#d2d2d7)] pb-7 mb-7 last:mb-0 last:border-0 last:pb-0';
const optionClass =
  'relative flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--line,#d2d2d7)] px-4 py-3.5 ' +
  'has-checked:border-[var(--btn,#0071e3)] has-checked:ring-1 has-checked:ring-[var(--btn,#0071e3)] has-focus-visible:outline-4 ' +
  'has-focus-visible:outline-[rgba(0,125,250,.35)]';

function FieldHeading({ label, hint, id, htmlFor }: { label: string; hint: string; id?: string; htmlFor?: string }) {
  const content = (
    <>
      {label} <span className="text-[var(--muted,#6e6e73)]">{hint}</span>
    </>
  );
  return (
    <h3 id={id} className="text-xl font-semibold sm:text-2xl">
      {htmlFor ? <label htmlFor={htmlFor}>{content}</label> : content}
    </h3>
  );
}

export function ToolInputs() {
  const t = useTranslations('tool.inputs');
  const { inputs, setInputs } = useTool();
  const uid = useId();
  const ids = {
    rooms: `${uid}-rooms`,
    city: `${uid}-city`,
    pool: `${uid}-pool`,
    poolDesc: `${uid}-pool-desc`,
    price: `${uid}-price`,
    priceAmount: `${uid}-price-amount`,
    priceError: `${uid}-price-error`,
  };

  // Flat price: the field keeps what the visitor types; the engine only sees valid values.
  const lastFlat = useRef(inputs.elecPrice ?? FLAT_PRICE_START);
  const [draft, setDraft] = useState(String(inputs.elecPrice ?? FLAT_PRICE_START));
  const [priceInvalid, setPriceInvalid] = useState(false);
  const flat = inputs.elecPrice != null;

  const fill = `${((inputs.rooms - ROOMS.min) / (ROOMS.max - ROOMS.min)) * 100}%`;

  return (
    <section aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="sr-only">
        {t('heading')}
      </h2>

      {/* Rooms */}
      <div className={fieldClass}>
        <FieldHeading label={t('rooms.label')} hint={t('rooms.hint')} htmlFor={ids.rooms} />
        <output
          htmlFor={ids.rooms}
          className="mt-3 block font-display text-5xl font-semibold tracking-[-0.045em] tabular-nums sm:text-6xl"
        >
          {inputs.rooms}
          <small className="ml-2 text-lg font-medium tracking-tight text-[var(--muted,#6e6e73)]">
            {t('rooms.unit')}
          </small>
        </output>
        <input
          id={ids.rooms}
          type="range"
          min={ROOMS.min}
          max={ROOMS.max}
          step={ROOMS.step}
          value={inputs.rooms}
          aria-valuetext={t('rooms.valueText', { rooms: inputs.rooms })}
          onChange={(e) => setInputs({ rooms: Number(e.target.value) })}
          className={`${rangeClass} mt-4`}
          style={
            {
              '--track': `linear-gradient(var(--ink, #1d1d1f), var(--ink, #1d1d1f)) 0 / ${fill} 100% no-repeat #e8e8ed`,
            } as React.CSSProperties
          }
        />
        <div className="mt-1 flex justify-between text-[13px] text-[var(--muted,#6e6e73)]" aria-hidden="true">
          <span>{t('rooms.min')}</span>
          <span>{t('rooms.max')}</span>
        </div>
      </div>

      {/* City */}
      <fieldset className={fieldClass}>
        <legend className="w-full p-0">
          <FieldHeading label={t('city.label')} hint={t('city.hint')} id={ids.city} />
        </legend>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {CITIES.map((city) => (
            <label key={city} className={optionClass}>
              <input
                type="radio"
                name={ids.city}
                value={city}
                checked={inputs.city === city}
                onChange={() => setInputs({ city })}
                className="sr-only"
              />
              <span className="text-base font-semibold">
                {t(`city.options.${city}.name`)}
                <small className="block text-[12.5px] font-normal text-[var(--muted,#6e6e73)]">
                  {t(`city.options.${city}.note`)}
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Pool */}
      <div className={fieldClass}>
        <FieldHeading label={t('pool.label')} hint={t('pool.hint')} />
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[var(--line,#d2d2d7)] px-4 py-3.5">
          <span>
            <label htmlFor={ids.pool} className="block cursor-pointer text-base font-semibold">
              {t('pool.switch')}
            </label>
            <span id={ids.poolDesc} className="block text-[12.5px] text-[var(--muted,#6e6e73)]">
              {inputs.pool ? t('pool.on') : t('pool.off')}
            </span>
          </span>
          <button
            id={ids.pool}
            type="button"
            role="switch"
            aria-checked={inputs.pool}
            aria-describedby={ids.poolDesc}
            onClick={() => setInputs({ pool: !inputs.pool })}
            className="relative h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full bg-[#e9e9eb] transition-colors aria-checked:bg-[var(--good,#1f8a4c)] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
          >
            <span
              aria-hidden="true"
              className={`absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,.15),0_3px_1px_rgba(0,0,0,.06)] transition-transform motion-reduce:transition-none ${inputs.pool ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Electricity price */}
      <fieldset className={fieldClass}>
        <legend className="w-full p-0">
          <FieldHeading label={t('price.label')} hint={t('price.hint')} id={ids.price} />
        </legend>
        <div className="mt-4 grid gap-2.5">
          <label className={optionClass}>
            <input
              type="radio"
              name={ids.price}
              value="tou"
              checked={!flat}
              onChange={() => {
                setPriceInvalid(false);
                setInputs({ elecPrice: null });
              }}
              className="sr-only"
            />
            <span className="text-base font-semibold">
              {t('price.tou')}
              <small className="block text-[12.5px] font-normal text-[var(--muted,#6e6e73)]">
                {t('price.touNote')}
              </small>
            </span>
            <span className="text-[13px] text-[var(--muted,#6e6e73)]">{t('price.touDefault')}</span>
          </label>
          <label className={optionClass}>
            <input
              type="radio"
              name={ids.price}
              value="flat"
              checked={flat}
              onChange={() => {
                setPriceInvalid(false);
                setDraft(String(lastFlat.current));
                setInputs({ elecPrice: lastFlat.current });
              }}
              className="sr-only"
            />
            <span className="text-base font-semibold">
              {t('price.flat')}
              <small className="block text-[12.5px] font-normal text-[var(--muted,#6e6e73)]">
                {t('price.flatNote')}
              </small>
            </span>
          </label>
        </div>
        {/* Always rendered (disabled for time-of-use) so choosing a flat price never moves the page. */}
        <div className="mt-3">
          <label
            htmlFor={ids.priceAmount}
            className={`block text-[13px] ${flat ? 'text-[var(--ink,#1d1d1f)]' : 'text-[var(--muted,#6e6e73)]'}`}
          >
            {t('price.amountLabel')}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id={ids.priceAmount}
              type="number"
              inputMode="decimal"
              min={PRICE.min}
              max={PRICE.max}
              step={PRICE.step}
              disabled={!flat}
              value={flat ? draft : ''}
              placeholder={String(FLAT_PRICE_START)}
              aria-invalid={priceInvalid || undefined}
              aria-describedby={priceInvalid ? ids.priceError : undefined}
              onChange={(e) => {
                const text = e.target.value;
                setDraft(text);
                const n = Number(text);
                const valid = text.trim() !== '' && Number.isFinite(n) && n >= PRICE.min && n <= PRICE.max;
                setPriceInvalid(!valid);
                if (valid) {
                  lastFlat.current = clampPrice(n);
                  setInputs({ elecPrice: lastFlat.current });
                }
              }}
              onBlur={() => {
                if (priceInvalid && inputs.elecPrice != null) {
                  setDraft(String(inputs.elecPrice));
                  setPriceInvalid(false);
                }
              }}
              className="w-32 rounded-xl border border-[var(--line,#d2d2d7)] bg-white px-3 py-2 text-base tabular-nums disabled:bg-[var(--tile,#f5f5f7)] disabled:text-[var(--faint,#86868b)] aria-invalid:border-[var(--heat,#e5484d)] focus-visible:outline-4 focus-visible:outline-[rgba(0,125,250,.35)]"
            />
            <span className={`text-[13px] ${flat ? 'text-[var(--muted,#6e6e73)]' : 'text-[var(--muted,#6e6e73)]'}`}>
              {t('price.amountUnit')}
            </span>
          </div>
          <p id={ids.priceError} role="alert" className="mt-1.5 min-h-5 text-[13px] text-[var(--heat-text,#c0262c)]">
            {priceInvalid ? t('price.invalid') : null}
          </p>
        </div>
      </fieldset>
    </section>
  );
}
