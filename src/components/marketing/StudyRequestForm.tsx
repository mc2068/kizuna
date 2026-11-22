'use client';

import Link from 'next/link';
import { startTransition, useActionState, useEffect, useId, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CITIES, type SizingInput } from '@/lib/engine';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import {
  PRICE, ROOMS, studyRequestSchema, type FieldName, type StudyRequestInput, type StudyRequestState, type StudyRequestValues,
} from './study-request';

type Action = (prev: StudyRequestState, input: StudyRequestInput) => Promise<StudyRequestState>;

const ORDER: FieldName[] = ['contactName', 'email', 'phone', 'hotelName', 'city', 'rooms', 'pool', 'elecPrice', 'message', 'consent'];

/**
 * Study request form (#20). react-hook-form + zod in the browser, the same schema again in the
 * server action. Prefilled from a /tool link. Field errors inline, a pending state, a success panel.
 */
export function StudyRequestForm(props: { action: Action; prefill: Partial<SizingInput> }) {
  // Remounting resets both the form and the action state for "Send another request".
  const [round, setRound] = useState(0);
  return <FormRound key={round} {...props} onAgain={() => setRound((r) => r + 1)} />;
}

function FormRound({ action, prefill, onAgain }: { action: Action; prefill: Partial<SizingInput>; onAgain: () => void }) {
  const t = useTranslations('forms.studyForm');
  const tc = useTranslations('common.cities');
  const uid = useId();
  const successRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const [state, formAction, pending] = useActionState<StudyRequestState, StudyRequestInput>(action, { status: 'idle' });

  const form = useForm<StudyRequestInput, unknown, StudyRequestValues>({
    resolver: zodResolver(studyRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      contactName: '',
      email: '',
      phone: '',
      hotelName: '',
      city: prefill.city,
      rooms: prefill.rooms ?? '',
      pool: prefill.pool ?? true,
      elecPrice: prefill.elecPrice != null ? String(prefill.elecPrice) : '',
      message: '',
      consent: false as unknown as true,
      website: '',
    },
  });
  const { register, control, handleSubmit, setError, formState } = form;
  const errors = formState.errors;

  // Server-side field errors land on the same fields as the browser ones.
  useEffect(() => {
    if (state.status === 'error') {
      for (const [k, code] of Object.entries(state.fieldErrors)) setError(k as FieldName, { type: 'server', message: code });
      summaryRef.current?.focus();
    }
    if (state.status === 'success') successRef.current?.focus();
  }, [state, setError]);

  const onValid = () => startTransition(() => formAction(form.getValues()));
  const onInvalid = () => {
    const first = ORDER.find((k) => errors[k]);
    if (first) form.setFocus(first);
  };

  const msg = (k: FieldName) => {
    const code = errors[k]?.message;
    if (!code) return null;
    return t(`errors.${code}` as 'errors.required', { min: k === 'rooms' ? ROOMS.min : PRICE.min, max: k === 'rooms' ? ROOMS.max : PRICE.max });
  };
  const id = (k: string) => `${uid}-${k}`;
  const describedBy = (k: FieldName, hint?: boolean) =>
    [errors[k] ? id(`${k}-error`) : null, hint ? id(`${k}-hint`) : null].filter(Boolean).join(' ') || undefined;

  if (state.status === 'success') {
    return (
      <div ref={successRef} tabIndex={-1} role="status" data-study-success className="rounded-[28px] bg-white p-8 outline-none md:p-10">
        <CheckCircle2Icon className="size-10 text-good-text" aria-hidden="true" />
        <h2 className="mt-4 text-[32px] font-semibold tracking-tight">{t('success.title', { name: state.contactName })}</h2>
        <p className="mt-2 text-muted">{t('success.body', { hotel: state.hotelName, id: state.leadId })}</p>
        <h3 className="mt-8 font-sans text-[17px] font-semibold">{t('success.next')}</h3>
        <ol className="mt-3 grid gap-3">
          {(['reply', 'call', 'quote'] as const).map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="tabular grid size-7 shrink-0 place-items-center rounded-full bg-tile text-[14px] font-semibold">{i + 1}</span>
              <span>{t(`success.steps.${s}`)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button variant="outline" onClick={onAgain}>
            {t('success.again')}
          </Button>
          <Button asChild variant="chevron">
            <Link href="/">{t('success.home')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  const fieldClass = 'grid content-start gap-2';
  const errorText = (k: FieldName) =>
    errors[k] ? (
      <p id={id(`${k}-error`)} className="text-[14px] font-medium text-destructive">
        {msg(k)}
      </p>
    ) : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onValid, onInvalid)}
      aria-labelledby={id('title')}
      aria-busy={pending}
      data-study-form
      className="rounded-[28px] bg-white p-6 md:p-8"
    >
      <h2 id={id('title')} className="text-[26px] font-semibold tracking-tight">
        {t('title')}
      </h2>

      <p
        ref={summaryRef}
        tabIndex={-1}
        role="alert"
        className={cn('mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-[15px] text-destructive outline-none', !(hasErrors || state.status === 'error') && 'sr-only')}
      >
        {state.status === 'error' && state.formError === 'server'
          ? t('errors.server', { email: siteConfig.contactEmail })
          : hasErrors
            ? t('errors.summary')
            : ''}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className={fieldClass}>
          <Label htmlFor={id('contactName')}>{t('fields.contactName')}</Label>
          <Input id={id('contactName')} autoComplete="name" placeholder={t('placeholders.contactName')} aria-invalid={!!errors.contactName} aria-describedby={describedBy('contactName')} {...register('contactName')} />
          {errorText('contactName')}
        </div>
        <div className={fieldClass}>
          <Label htmlFor={id('email')}>{t('fields.email')}</Label>
          <Input id={id('email')} type="email" autoComplete="email" inputMode="email" placeholder={t('placeholders.email')} aria-invalid={!!errors.email} aria-describedby={describedBy('email')} {...register('email')} />
          {errorText('email')}
        </div>
        <div className={fieldClass}>
          <Label htmlFor={id('phone')}>
            {t('fields.phone')} <span className="font-normal text-muted">({t('hints.phone')})</span>
          </Label>
          <Input id={id('phone')} type="tel" autoComplete="tel" placeholder={t('placeholders.phone')} aria-invalid={!!errors.phone} aria-describedby={describedBy('phone')} {...register('phone')} />
          {errorText('phone')}
        </div>
        <div className={fieldClass}>
          <Label htmlFor={id('hotelName')}>{t('fields.hotelName')}</Label>
          <Input id={id('hotelName')} autoComplete="organization" placeholder={t('placeholders.hotelName')} aria-invalid={!!errors.hotelName} aria-describedby={describedBy('hotelName')} {...register('hotelName')} />
          {errorText('hotelName')}
        </div>
        <div className={fieldClass}>
          <Label htmlFor={id('city')}>{t('fields.city')}</Label>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v)} name={field.name}>
                <SelectTrigger
                  id={id('city')}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  className="w-full"
                  aria-invalid={!!errors.city}
                  aria-describedby={describedBy('city')}
                >
                  <SelectValue placeholder={t('fields.city')} />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {tc(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errorText('city')}
        </div>
        <div className={fieldClass}>
          <Label htmlFor={id('rooms')}>{t('fields.rooms')}</Label>
          <Input id={id('rooms')} type="number" inputMode="numeric" min={ROOMS.min} max={ROOMS.max} step={1} aria-invalid={!!errors.rooms} aria-describedby={describedBy('rooms', true)} {...register('rooms')} />
          <p id={id('rooms-hint')} className="text-[13px] text-muted">
            {t('hints.rooms', { min: ROOMS.min, max: ROOMS.max })}
          </p>
          {errorText('rooms')}
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 sm:col-span-2">
          <Label htmlFor={id('pool')} className="text-[17px]">
            {t('fields.pool')}
          </Label>
          <Controller
            control={control}
            name="pool"
            render={({ field }) => (
              <Switch id={id('pool')} ref={field.ref} checked={!!field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
        </div>
        <div className={cn(fieldClass, 'sm:col-span-2')}>
          <Label htmlFor={id('elecPrice')}>{t('fields.elecPrice')}</Label>
          <Input id={id('elecPrice')} type="number" inputMode="decimal" step="0.001" min={PRICE.min} max={PRICE.max} placeholder={t('placeholders.elecPrice')} aria-invalid={!!errors.elecPrice} aria-describedby={describedBy('elecPrice', true)} {...register('elecPrice')} />
          <p id={id('elecPrice-hint')} className="text-[13px] text-muted">
            {t('hints.elecPrice')}
          </p>
          {errorText('elecPrice')}
        </div>
        <div className={cn(fieldClass, 'sm:col-span-2')}>
          <Label htmlFor={id('message')}>{t('fields.message')}</Label>
          <Textarea id={id('message')} rows={4} placeholder={t('hints.message')} aria-invalid={!!errors.message} aria-describedby={describedBy('message')} {...register('message')} />
          {errorText('message')}
        </div>

        {/* Honeypot: hidden from people and assistive technology, tempting for bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={id('website')}>{t('fields.website')}</label>
          <input id={id('website')} type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <div className="flex items-start gap-3">
            <Controller
              control={control}
              name="consent"
              render={({ field }) => (
                <Checkbox
                  id={id('consent')}
                  ref={field.ref}
                  checked={field.value === true}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.consent}
                  aria-describedby={describedBy('consent')}
                  className="mt-1 size-5"
                />
              )}
            />
            <Label htmlFor={id('consent')} className="block text-[15px] leading-snug font-normal">
              {t.rich('fields.consent', {
                name: siteConfig.name,
                link: (chunks) => (
                  <Link href="/privacy" target="_blank" className="text-link underline underline-offset-2">
                    {chunks}
                  </Link>
                ),
              })}
            </Label>
          </div>
          {errorText('consent')}
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-8 w-full sm:w-auto" disabled={pending}>
        {pending ? (
          <>
            <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
            {t('sending')}
          </>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  );
}
