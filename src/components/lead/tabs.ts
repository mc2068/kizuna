export const LEAD_TABS = ['overview', 'notes', 'history', 'files'] as const;
export type LeadTab = (typeof LEAD_TABS)[number];

/** The ?tab= value, or 'overview' when missing or unknown. */
export function parseTab(value: string | string[] | undefined | null): LeadTab {
  const v = Array.isArray(value) ? value[0] : value;
  return LEAD_TABS.includes(v as LeadTab) ? (v as LeadTab) : 'overview';
}
