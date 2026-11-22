import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FlameIcon, ZapIcon, DropletsIcon, SnowflakeIcon } from 'lucide-react';
import { Section, SectionHeading, Lede } from '../Section';
import { Footnote } from '../Footnote';
import { Reveal } from '../Reveal';
import { centralParam } from '../demo';
import { cn } from '@/lib/utils';

/** "One engine. Three jobs." The two efficiencies come from the engine's own assumptions. */
export async function Flow() {
  const t = await getTranslations('marketing.home.flow');
  const elecPct = Math.round(centralParam('engineElecEff') * 100);
  const heatPct = Math.round(centralParam('engineThermalEff') * 100);
  const steps = [
    { key: 'gas', icon: FlameIcon, tint: 'bg-tile text-ink', values: {} },
    { key: 'power', icon: ZapIcon, tint: 'bg-elec/15 text-elec-text', values: { pct: elecPct }, ref: 'doe-chp-engines' },
    { key: 'heat', icon: DropletsIcon, tint: 'bg-heat/15 text-heat-text', values: { pct: heatPct }, ref: 'doe-chp-engines' },
    { key: 'cold', icon: SnowflakeIcon, tint: 'bg-cool/15 text-cool-text', values: {}, ref: 'doe-absorption-chiller' },
  ] as const;

  return (
    <Section id="how" labelledBy="flow-title" tone="tile">
      <SectionHeading id="flow-title">{t('title')}</SectionHeading>
      <Lede>{t('lede')}</Lede>
      <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.key}>
            <Reveal delay={i * 90} className="h-full">
              <div className="flex h-full flex-col rounded-[22px] bg-white p-6">
                <span className={cn('grid size-11 place-items-center rounded-full', s.tint)}>
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-5 text-[13px] font-semibold tracking-wide text-muted uppercase">{t(`steps.${s.key}.label`)}</p>
                <h3 className="mt-1 text-[24px] font-semibold tracking-tight">{t(`steps.${s.key}.title`)}</h3>
                <p className="mt-2 text-muted">
                  {t(`steps.${s.key}.body`, s.values)}
                  {'ref' in s ? <Footnote id={s.ref} /> : null}
                </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-center">
        <Link href="/how-it-works" className="text-link-chevron text-[17px] text-link hover:underline">
          {t('cta')}
        </Link>
      </p>
    </Section>
  );
}
