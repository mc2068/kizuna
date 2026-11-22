// The [PRODUCT NAME] PDF report (#23), laid out with @react-pdf/renderer. Server only. Every string and number
// comes from the ReportModel (model.ts), so nothing here formats or computes engine values.

import path from 'node:path';
import { Document, Font, Link, Page, Path, Polyline, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import { COLORS, type ChartSeries, type ReportModel } from './model';
import type { SourcePart, VerdictTone } from '@/lib/present';

// Fonts ship with the report routes (next.config.ts outputFileTracingIncludes), read from disk at render time.
const FONTS = path.join(process.cwd(), 'src', 'lib', 'report', 'fonts');
let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: 'Inter',
    fonts: [
      { src: path.join(FONTS, 'inter-400.ttf'), fontWeight: 400 },
      { src: path.join(FONTS, 'inter-600.ttf'), fontWeight: 600 },
      { src: path.join(FONTS, 'inter-700.ttf'), fontWeight: 700 },
    ],
  });
  Font.register({
    family: 'Inter Tight',
    fonts: [
      { src: path.join(FONTS, 'inter-tight-600.ttf'), fontWeight: 600 },
      { src: path.join(FONTS, 'inter-tight-700.ttf'), fontWeight: 700 },
    ],
  });
  // Never hyphenate: numbers like "1.24 M" and names must stay whole.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const TONE: Record<VerdictTone, string> = { good: COLORS.good, maybe: COLORS.maybe, weak: COLORS.weak };

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9.5, color: COLORS.ink, paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48 },
  // Not on the page: a page-level lineHeight stops react-pdf 4.9.0 drawing the page-number footer. A View resolves
  // a relative lineHeight against its own fontSize (default 18), so the body View sets both; smaller text sets its own.
  body: { fontSize: 9.5, lineHeight: 1.4 },
  product: { fontFamily: 'Inter Tight', fontWeight: 700, fontSize: 11, letterSpacing: 0.4, color: COLORS.muted },
  h1: { fontFamily: 'Inter Tight', fontWeight: 700, fontSize: 26, lineHeight: 1.15, marginTop: 120 },
  subtitle: { fontSize: 12, lineHeight: 1.35, color: COLORS.muted, marginTop: 8, maxWidth: 400 },
  h2: { fontFamily: 'Inter Tight', fontWeight: 700, fontSize: 17, lineHeight: 1.2, marginBottom: 6 },
  h3: { fontFamily: 'Inter Tight', fontWeight: 600, fontSize: 11.5, marginTop: 14, marginBottom: 4 },
  intro: { color: COLORS.muted, marginBottom: 14 },
  label: { fontSize: 8, fontWeight: 600, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: 0.6 },
  muted: { color: COLORS.muted },
  small: { fontSize: 8, lineHeight: 1.4, color: COLORS.muted },
  tile: { backgroundColor: COLORS.tile, borderRadius: 8, padding: 14 },
  pill: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 9, color: '#ffffff', fontWeight: 600, fontSize: 10 },
  row: { flexDirection: 'row' },
  th: { fontWeight: 600, fontSize: 8.5, lineHeight: 1.3, color: COLORS.muted },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.line, paddingVertical: 5 },
  link: { color: COLORS.link, textDecoration: 'none' },
  footer: { position: 'absolute', left: 48, right: 48, bottom: 28, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: COLORS.faint },
});

function Footer({ model }: { model: ReportModel }) {
  return (
    <View style={s.footer} fixed>
      <Text>{model.footer}</Text>
      <Text render={({ pageNumber, totalPages }) => model.pageLabel(pageNumber, totalPages)} />
    </View>
  );
}

function ReportPage({ model, children }: { model: ReportModel; children: ReactNode }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.body}>{children}</View>
      <Footer model={model} />
    </Page>
  );
}

function Pill({ tone, children }: { tone: VerdictTone; children: string }) {
  return <Text style={[s.pill, { backgroundColor: TONE[tone] }]}>{children}</Text>;
}

function Cover({ model }: { model: ReportModel }) {
  const c = model.cover;
  return (
    <ReportPage model={model}>
      <Text style={s.product}>{model.productName}</Text>
      <Text style={s.h1}>{c.title}</Text>
      <Text style={s.subtitle}>{c.subtitle}</Text>

      <View style={{ marginTop: 36 }}>
        <Text style={s.label}>{c.preparedFor}</Text>
        <Text style={{ fontFamily: 'Inter Tight', fontWeight: 600, fontSize: 15, marginTop: 3, marginBottom: 3 }}>{c.hotelName}</Text>
        <Text style={[s.muted, { marginTop: 2 }]}>{c.context}</Text>
        <Text style={s.muted}>{c.tariff}</Text>
        <Text style={s.muted}>{c.calculated}</Text>
      </View>

      <View style={[s.tile, { marginTop: 32 }]}>
        <Text style={s.label}>{c.verdictLabel}</Text>
        <View style={{ marginTop: 5 }}>
          <Pill tone={c.tone}>{c.verdict}</Pill>
        </View>
        <View style={[s.row, { marginTop: 14 }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.label}>{c.plantLabel}</Text>
            <Text style={{ fontWeight: 600, fontSize: 11, marginTop: 3 }}>{c.plant}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{c.paybackLabel}</Text>
            <Text style={{ fontWeight: 600, fontSize: 11, marginTop: 3 }}>{c.payback}</Text>
          </View>
        </View>
        <Text style={[s.small, { marginTop: 12 }]}>{c.readAs}</Text>
      </View>
    </ReportPage>
  );
}

function Results({ model }: { model: ReportModel }) {
  const r = model.results;
  const labelWidth = '34%';
  return (
    <ReportPage model={model}>
      <Text style={s.h2}>{r.title}</Text>
      <Text style={s.intro}>{r.intro}</Text>

      <View style={[s.tr, { alignItems: 'flex-end' }]}>
        <View style={{ width: labelWidth }} />
        {r.columns.map((col) => (
          <View key={col.title} style={{ flex: 1, paddingLeft: 8 }}>
            <Text style={{ fontFamily: 'Inter Tight', fontWeight: 600, fontSize: 11 }}>{col.title}</Text>
            <Text style={[s.small, { marginBottom: 4 }]}>{col.plant}</Text>
            <Pill tone={col.tone}>{col.verdict}</Pill>
          </View>
        ))}
      </View>
      {r.rows.map((row) => (
        <View key={row.key} style={s.tr} wrap={false}>
          <Text style={{ width: labelWidth, color: COLORS.muted }}>{row.label}</Text>
          {row.cells.map((cell, i) => (
            <Text key={i} style={{ flex: 1, paddingLeft: 8, fontWeight: 600 }}>
              {cell}
            </Text>
          ))}
        </View>
      ))}

      <Text style={s.h3}>{r.warningsTitle}</Text>
      {r.warnings.length === 0 ? (
        <Text style={s.muted}>{r.noWarnings}</Text>
      ) : (
        r.warnings.map((w) => (
          <View key={w} style={[s.row, { marginBottom: 2 }]}>
            <Text style={{ color: COLORS.maybe, width: 10 }}>•</Text>
            <Text style={{ flex: 1 }}>{w}</Text>
          </View>
        ))
      )}

      {r.fasterOption && <Text style={[s.tile, { marginTop: 14 }]}>{r.fasterOption}</Text>}

      <View style={{ marginTop: 14 }}>
        {r.notes.map((n) => (
          <Text key={n} style={s.small}>
            {n}
          </Text>
        ))}
      </View>
    </ReportPage>
  );
}

const CHART_W = 150;
const CHART_H = 90;

function Chart({ chart }: { chart: ChartSeries }) {
  const x = (i: number, n: number) => (i / (n - 1)) * CHART_W;
  const y = (v: number) => CHART_H - (Math.max(0, v) / chart.max) * CHART_H;
  const points = (vals: number[]) => vals.map((v, i) => `${x(i, vals.length).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `M0,${CHART_H} L${points(chart.need).replace(/ /g, ' L')} L${CHART_W},${CHART_H} Z`;
  return (
    <View style={{ width: CHART_W }}>
      <Text style={{ fontSize: 8, fontWeight: 600, marginBottom: 2 }}>{chart.title}</Text>
      <Text style={[s.small, { fontSize: 6.5 }]}>{chart.max.toLocaleString('en-GB')}</Text>
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <Path d={area} fill={chart.color} fillOpacity={0.18} />
        <Polyline points={points(chart.supplied)} fill="none" stroke={chart.color} strokeWidth={1.4} />
        <Path d={`M0,${CHART_H} L${CHART_W},${CHART_H}`} stroke={COLORS.line} strokeWidth={0.75} />
      </Svg>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        {['0h', '6h', '12h', '18h', '23h'].map((h) => (
          <Text key={h} style={[s.small, { fontSize: 6.5 }]}>
            {h}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Hourly({ model }: { model: ReportModel }) {
  const h = model.hourly;
  return (
    <ReportPage model={model}>
      <Text style={s.h2}>{h.title}</Text>
      <Text style={s.intro}>{h.intro}</Text>
      <View style={[s.row, { marginBottom: 10 }]}>
        <View style={{ width: 14, height: 8, backgroundColor: COLORS.ink, opacity: 0.18, marginRight: 4, marginTop: 1.5 }} />
        <Text style={[s.small, { marginRight: 14 }]}>{h.legend.need}</Text>
        <View style={{ width: 14, height: 1.4, backgroundColor: COLORS.ink, marginRight: 4, marginTop: 5 }} />
        <Text style={s.small}>{h.legend.supplied}</Text>
      </View>
      {h.seasons.map((season) => (
        <View key={season.title} wrap={false} style={{ marginBottom: 18 }}>
          <Text style={s.h3}>{season.title}</Text>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            {season.charts.map((c) => (
              <Chart key={c.kind} chart={c} />
            ))}
          </View>
        </View>
      ))}
    </ReportPage>
  );
}

function Source({ parts }: { parts: SourcePart[] }) {
  return (
    <Text style={{ fontSize: 7.5, lineHeight: 1.4, color: COLORS.muted }}>
      {parts.map((p, i) =>
        p.kind === 'link' ? (
          <Link key={i} src={p.href} style={s.link}>
            {p.label}
          </Link>
        ) : (
          p.text
        ),
      )}
    </Text>
  );
}

function Assumptions({ model }: { model: ReportModel }) {
  const a = model.assumptions;
  const w = { name: '26%', value: '13%', source: '35%' };
  const value = (v: string, unit: string) => (unit ? `${v} ${unit}` : v);
  return (
    <ReportPage model={model}>
      <Text style={s.h2}>{a.title}</Text>
      <Text style={s.intro}>{a.intro}</Text>
      <View style={s.tr} fixed>
        <Text style={[s.th, { width: w.name }]}>{a.headers.name}</Text>
        <Text style={[s.th, { width: w.value, paddingRight: 6 }]}>{a.headers.favourable}</Text>
        <Text style={[s.th, { width: w.value, paddingRight: 6 }]}>{a.headers.central}</Text>
        <Text style={[s.th, { width: w.value, paddingRight: 6 }]}>{a.headers.unfavourable}</Text>
        <Text style={[s.th, { width: w.source }]}>{a.headers.source}</Text>
      </View>
      {a.rows.map((row) => (
        <View key={row.name} style={[s.tr, { fontSize: 8, lineHeight: 1.4 }]} wrap={false}>
          <Text style={{ width: w.name, paddingRight: 6 }}>{row.name}</Text>
          <Text style={{ width: w.value, paddingRight: 6 }}>{value(row.favourable, row.unit)}</Text>
          <Text style={{ width: w.value, paddingRight: 6, fontWeight: 600 }}>{value(row.central, row.unit)}</Text>
          <Text style={{ width: w.value, paddingRight: 6 }}>{value(row.unfavourable, row.unit)}</Text>
          <View style={{ width: w.source }}>
            <Source parts={row.source} />
          </View>
        </View>
      ))}
    </ReportPage>
  );
}

function Method({ model }: { model: ReportModel }) {
  const m = model.method;
  return (
    <ReportPage model={model}>
      <Text style={s.h2}>{m.title}</Text>
      {m.steps.map((step, i) => (
        <View key={step.title} style={[s.row, { marginBottom: 6 }]} wrap={false}>
          <Text style={{ width: 16, fontWeight: 700, color: COLORS.faint }}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 600 }}>{step.title}</Text>
            <Text style={s.muted}>{step.body}</Text>
          </View>
        </View>
      ))}

      <Text style={s.h3}>{m.limitsTitle}</Text>
      {m.limits.map((l) => (
        <View key={l.title} style={{ marginBottom: 4 }} wrap={false}>
          <Text style={{ fontWeight: 600 }}>{l.title}</Text>
          <Text style={s.muted}>{l.detail}</Text>
        </View>
      ))}

      <View style={[s.tile, { marginTop: 14 }]} wrap={false}>
        <Text style={{ fontWeight: 600 }}>{m.disclaimer}</Text>
        <Text style={[s.small, { marginTop: 6 }]}>{m.engineVersion}</Text>
        {m.stale && <Text style={[s.small, { color: COLORS.maybe, marginTop: 2 }]}>{m.stale}</Text>}
      </View>
    </ReportPage>
  );
}

export function ReportDocument({ model }: { model: ReportModel }) {
  return (
    <Document title={`${model.cover.title} · ${model.cover.hotelName}`} author={model.productName} language="en">
      <Cover model={model} />
      <Results model={model} />
      <Hourly model={model} />
      <Assumptions model={model} />
      <Method model={model} />
    </Document>
  );
}
