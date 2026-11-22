import { getTranslations } from 'next-intl/server';
import { sizeHotel, type SizingInput } from '@/lib/engine';
import { formatNumber, formatRange, verdictLabel, verdictTone } from '@/lib/present';
import { Badge } from '@/components/ui/badge';
import { Section, SectionHeading, Lede } from '../Section';
import { Reveal } from '../Reveal';

// Three live engine runs that show the verdict range: two worth a study, one weak fit.
const EXAMPLES: { key: 'big' | 'desert' | 'small'; input: SizingInput }[] = [
  { key: 'big', input: { rooms: 500, city: 'djerba', pool: true, elecPrice: null } },
  { key: 'desert', input: { rooms: 300, city: 'tozeur', pool: true, elecPrice: null } },
  { key: 'small', input: { rooms: 100, city: 'djerba', pool: false, elecPrice: null } },
];

export async function Honesty() {
  const t = await getTranslations('marketing.home.honesty');
  return (
    <Section labelledBy="honesty-title">
      <SectionHeading id="honesty-title">{t('title')}</SectionHeading>
      <Lede>{t('lede')}</Lede>
      <p className="mx-auto mt-4 max-w-[42rem] text-center text-lede text-muted [&_strong]:font-semibold [&_strong]:text-ink">
        {t.rich('signs', { b: (chunks) => <strong>{chunks}</strong> })}
      </p>
      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {EXAMPLES.map(({ key, input }, i) => {
          const r = sizeHotel(input);
          const s = r.scenarios;
          return (
            <li key={key}>
              <Reveal delay={i * 90} className="h-full">
                <article className="flex h-full flex-col rounded-[22px] border border-line/70 bg-white p-6">
                  <Badge variant={verdictTone(r.verdict)}>{verdictLabel(r.verdict)}</Badge>
                  <h3 className="mt-4 text-[22px] font-semibold tracking-tight">{t(`examples.${key}.title`, { rooms: input.rooms })}</h3>
                  <p className="mt-1 text-muted">{t(`examples.${key}.note`)}</p>
                  <p className="tabular mt-auto pt-8 font-display text-[40px] leading-none font-semibold tracking-tight">
                    {formatRange(s, 'paybackYears')}
                    <span className="ml-2 font-sans text-[15px] font-normal tracking-normal text-muted">{t('payback')}</span>
                  </p>
                  <p className="tabular mt-2 text-[14px] text-muted">
                    {t('detail', {
                      central: formatNumber(s.central.paybackYears),
                      kwe: r.engineKwe,
                      hours: formatNumber(s.central.fullLoadHours, 0),
                    })}
                  </p>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
