'use client';
// Accessible tabs whose state lives in the URL (?tab=notes). Every panel is rendered on the
// server; switching is instant and only rewrites the query string (replaceState: no history spam,
// and a reload opens the same tab).
import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LEAD_TABS, parseTab, type LeadTab } from './tabs';

export function LeadTabs({
  counts,
  panels,
}: {
  counts: Partial<Record<LeadTab, number>>;
  panels: Record<LeadTab, ReactNode>;
}) {
  const t = useTranslations('lead.tabs');
  const searchParams = useSearchParams();
  // The URL is the only state: replaceState below updates useSearchParams, and so do back,
  // forward and links to ?tab=….
  const tab = parseTab(searchParams.get('tab'));
  const refs = useRef<Partial<Record<LeadTab, HTMLButtonElement | null>>>({});

  function select(next: LeadTab, focus = false) {
    const params = new URLSearchParams(window.location.search);
    if (next === 'overview') params.delete('tab');
    else params.set('tab', next);
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    if (focus) refs.current[next]?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    const i = LEAD_TABS.indexOf(tab);
    const last = LEAD_TABS.length - 1;
    const to = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(LEAD_TABS[to]!, true);
  }

  return (
    <div>
      <div role="tablist" aria-label={t('label')} onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto [scrollbar-width:none] border-b border-[#e4e4e0]">
        {LEAD_TABS.map((key) => {
          const on = key === tab;
          return (
            <button
              key={key}
              ref={(el) => {
                refs.current[key] = el;
              }}
              id={`lead-tab-${key}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`lead-panel-${key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                on ? 'border-[#0f766e] text-[#17191a]' : 'border-transparent text-[#6b6f72] hover:text-[#17191a]'
              }`}
            >
              {t(key)}
              {counts[key] !== undefined && (
                <span className={`rounded-full px-2 text-[11.5px] tabular-nums ${on ? 'bg-[#ddf1ee] text-[#0f766e]' : 'bg-[#e8e8e4] text-[#6b6f72]'}`}>
                  {counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {LEAD_TABS.map((key) => (
        <div key={key} id={`lead-panel-${key}`} role="tabpanel" aria-labelledby={`lead-tab-${key}`} hidden={key !== tab} tabIndex={0} className="mt-5 outline-none">
          {panels[key]}
        </div>
      ))}
    </div>
  );
}
