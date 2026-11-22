// Role 3: every design-system component on one page. Development only (404 in production).
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Section, SectionHeading, Lede } from '@/components/marketing/Section';
import { Eyebrow } from '@/components/marketing/Eyebrow';
import { Footnote } from '@/components/marketing/Footnote';
import { Rings } from '@/components/marketing/Rings';
import { RangeRail } from '@/components/marketing/RangeRail';
import { coverage } from '@/components/marketing/coverage';
import { sizeHotel } from '@/lib/engine';
import { formatRange, verdictLabel, verdictTone } from '@/lib/present';
import { Demos } from './Demos';

export const metadata: Metadata = { title: 'UI kit', robots: { index: false } };

const TOKENS = [
  'bg', 'ink', 'muted', 'faint', 'line', 'tile', 'link', 'btn', 'elec', 'heat', 'cool', 'good', 'maybe', 'weak',
  'status-new', 'status-contacted', 'status-quoted', 'status-won', 'status-lost',
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-10">
      <h2 className="mb-6 font-sans text-[13px] font-semibold tracking-widest text-muted uppercase">{title}</h2>
      {children}
    </div>
  );
}

export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const demo = sizeHotel({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });
  const s = demo.scenarios;
  const cov = coverage(demo);

  return (
    <main id="main">
      <Section>
        <Eyebrow>Design system · dev only</Eyebrow>
        <SectionHeading as="h1" align="left" size="display" sub="Contract 2, live.">
          UI kit.
        </SectionHeading>

        <Block title="Tokens (Contract 2)">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {TOKENS.map((t) => (
              <li key={t} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="h-14" style={{ background: `var(--${t})` }} />
                <code className="block px-3 py-2 text-[12px]">--{t}</code>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Type">
          <p className="text-hero font-display font-semibold">Hero 108</p>
          <p className="text-display font-display font-semibold">Display 72</p>
          <p className="text-headline font-display font-semibold">Headline 40</p>
          <Lede align="left">Lede: one gas engine on site makes electricity, hot water and cooling.</Lede>
          <p className="mt-4">
            Body 17/1.47 with a footnote
            <Footnote id="doe-recip" />. Numbers are tabular: <span className="tabular">1,750,000 TND</span>.
          </p>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <Button>Screen my hotel</Button>
            <Button variant="dark">Open lead</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="lg">Large</Button>
            <Button size="sm">Small</Button>
            <Button variant="chevron">See how it works</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Block>

        <Block title="Badges: verdicts and lead status">
          <div className="flex flex-wrap gap-3">
            <Badge variant="good">Good fit</Badge>
            <Badge variant="maybe">Possible fit</Badge>
            <Badge variant="weak">Weak fit</Badge>
            <Badge variant="new" dot>New</Badge>
            <Badge variant="contacted" dot>Contacted</Badge>
            <Badge variant="quoted" dot>Quoted</Badge>
            <Badge variant="won" dot>Won</Badge>
            <Badge variant="lost" dot>Lost</Badge>
            <Badge variant="soon">Coming soon</Badge>
          </div>
        </Block>

        <Block title="Card">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Feasibility study</CardTitle>
              <CardDescription>Price on request</CardDescription>
            </CardHeader>
            <CardContent className="text-muted">We replace our assumptions with your numbers.</CardContent>
          </Card>
        </Block>

        <Block title="<Rings/> props {elec, heat, cool} as 0-1 (Djerba demo, live engine)">
          <Rings {...cov} size={260} stroke={26} />
          <pre className="mt-6 overflow-x-auto rounded-xl bg-tile p-4 text-[13px]">
            {`<Rings elec={${cov.elec.toFixed(2)}} heat={${cov.heat.toFixed(2)}} cool={${cov.cool.toFixed(2)}} legend="side" />`}
          </pre>
        </Block>

        <Block title="<RangeRail/> props {favourable, central, unfavourable, unit}">
          <div className="grid max-w-xl gap-6">
            <RangeRail
              title="Payback"
              favourable={s.favourable.paybackYears}
              central={s.central.paybackYears}
              unfavourable={s.unfavourable.paybackYears}
              unit="yrs"
              max={25}
            />
            <RangeRail
              title="Savings a year"
              favourable={s.favourable.annualSavingsTnd}
              central={s.central.annualSavingsTnd}
              unfavourable={s.unfavourable.annualSavingsTnd}
              unit="TND"
              max={300_000}
            />
          </div>
          <pre className="mt-6 overflow-x-auto rounded-xl bg-tile p-4 text-[13px]">
            {`<RangeRail title="Payback" favourable={5} central={9} unfavourable={21.5} unit="yrs" max={25} />`}
          </pre>
          <p className="mt-4 text-muted">
            {verdictLabel(demo.verdict)} ({verdictTone(demo.verdict)}), payback {formatRange(s, 'paybackYears', 'years')}.
          </p>
        </Block>

        <Block title="Interactive components">
          <Demos />
        </Block>
      </Section>

      <Section tone="dark">
        <Eyebrow tone="onDark">Dark band</Eyebrow>
        <SectionHeading align="left" size="headline">
          RangeRail on dark.
        </SectionHeading>
        <div className="mt-8 max-w-xl">
          <RangeRail
            tone="dark"
            title="CO2 avoided"
            favourable={s.favourable.co2AvoidedTonnes}
            central={s.central.co2AvoidedTonnes}
            unfavourable={s.unfavourable.co2AvoidedTonnes}
            unit="t"
            max={300}
          />
        </div>
      </Section>
    </main>
  );
}
