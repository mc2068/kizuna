'use client';

// One saved project on /projects (#22): what was screened, the verdict and payback, and its actions.
// The server page formats every number; this component only runs the actions.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { deleteProjectAction, renameProjectAction, rerunProjectAction } from '@/app/projects/actions';
import { cleanHotelName, HOTEL_NAME } from '@/components/tool/pending-project';
import { badgeTone } from '@/components/tool/ResultsOptions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { VerdictTone } from '@/lib/present';

export type ProjectCardView = {
  id: string;
  hotelName: string;
  summary: string;
  tone: VerdictTone;
  verdict: string;
  payback: string;
  paybackRange: string;
  updated: string;
  stale: boolean;
  engineVersion: string;
  toolHref: string;
  sharePath: string;
};

const actionClass =
  'rounded-full border border-[var(--line,#d2d2d7)] bg-white px-3.5 py-1.5 text-[14px] text-[var(--ink,#1d1d1f)] hover:bg-[var(--tile,#f5f5f7)] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)] disabled:cursor-not-allowed disabled:text-[var(--faint,#86868b)] disabled:hover:bg-white';

export function ProjectCard({ project }: { project: ProjectCardView }) {
  const t = useTranslations('projects');
  const router = useRouter();
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);
  const [rerunning, startRerun] = useTransition();
  const headingId = `project-${project.id}`;

  async function copyLink() {
    const url = `${window.location.origin}${project.sharePath}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('toast.copied'));
    } catch {
      toast.message(t('toast.copyFailed', { url }));
    }
  }

  function rerun() {
    startRerun(async () => {
      const result = await rerunProjectAction(project.id);
      if (result.ok) {
        toast.success(t('toast.rerun'));
        router.refresh();
      } else toast.error(t('toast.failed'));
    });
  }

  return (
    <article aria-labelledby={headingId} className="flex flex-col rounded-[28px] bg-[var(--tile,#f5f5f7)] px-6 pt-7 pb-6 sm:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold ${badgeTone[project.tone]}`}>{project.verdict}</span>
        {project.stale ? (
          <span className="rounded-full bg-[var(--maybe-soft,#fbf1e2)] px-2.5 py-1 text-[11px] leading-none font-semibold text-[var(--maybe-text,#8f5600)]">
            {t('card.stale')}
          </span>
        ) : null}
      </div>
      <h2 id={headingId} className="mt-4 font-display text-[28px] leading-tight font-semibold tracking-[-0.035em] break-words">
        {project.hotelName}
      </h2>
      <p className="mt-1 text-[15px] text-[var(--muted,#6e6e73)]">{project.summary}</p>

      <dl className="mt-5 border-t border-[#e3e3e8] pt-4">
        <dt className="text-[13px] text-[var(--muted,#6e6e73)]">{t('card.payback')}</dt>
        <dd className="mt-1 text-3xl font-semibold tabular-nums">{project.payback}</dd>
        <dd className="mt-0.5 text-[15px] text-[var(--muted,#6e6e73)] tabular-nums">{project.paybackRange}</dd>
      </dl>
      <p className="mt-4 text-[13px] text-[var(--muted,#6e6e73)]">{project.updated}</p>
      {project.stale ? (
        <p className="mt-1 text-[13px] text-[var(--maybe-text,#8f5600)]">{t('card.staleNote', { version: project.engineVersion })}</p>
      ) : null}

      <div role="group" aria-label={t('card.actions', { name: project.hotelName })} className="mt-6 flex flex-wrap gap-2">
        <a
          href={project.toolHref}
          className="rounded-full bg-[var(--btn,#0071e3)] px-3.5 py-1.5 text-[14px] text-white hover:bg-[#0077ed] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
        >
          {t('card.open')}
        </a>
        {project.stale ? (
          <button type="button" className={actionClass} onClick={rerun} disabled={rerunning}>
            {rerunning ? t('card.rerunning') : t('card.rerun')}
          </button>
        ) : null}
        <button type="button" className={actionClass} onClick={copyLink}>
          {t('card.copyLink')}
        </button>
        <button type="button" className={actionClass} onClick={() => setDialog('rename')}>
          {t('card.rename')}
        </button>
        {/* The PDF report route is Hamza's (#23). */}
        <a href={`/api/projects/${project.id}/report`} download className={actionClass}>
          {t('card.pdf')}
        </a>
        <button type="button" className={actionClass.replace('text-[var(--ink,#1d1d1f)]', 'text-[var(--destructive,#c0262c)]')} onClick={() => setDialog('delete')}>
          {t('card.delete')}
        </button>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        {dialog === 'rename' ? <RenameBody project={project} onDone={() => setDialog(null)} /> : null}
        {dialog === 'delete' ? <DeleteBody project={project} onDone={() => setDialog(null)} /> : null}
      </Dialog>
    </article>
  );
}

function RenameBody({ project, onDone }: { project: ProjectCardView; onDone: () => void }) {
  const t = useTranslations('projects');
  const tSave = useTranslations('tool.save');
  const router = useRouter();
  const [name, setName] = useState(project.hotelName);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = cleanHotelName(name);
    if (!clean) {
      setError(tSave('errors.invalidName'));
      return;
    }
    start(async () => {
      const result = await renameProjectAction(project.id, clean);
      if (result.ok) {
        toast.success(t('toast.renamed'));
        onDone();
        router.refresh();
      } else setError(result.error === 'invalidName' ? tSave('errors.invalidName') : t('toast.failed'));
    });
  }

  const inputId = `rename-${project.id}`;
  return (
    <DialogContent className="rounded-[28px] p-8 sm:max-w-md">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{t('rename.title')}</DialogTitle>
          <DialogDescription className="text-[15px]">{t('rename.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={inputId}>{t('rename.label')}</Label>
          <Input
            id={inputId}
            autoFocus
            required
            minLength={HOTEL_NAME.min}
            maxLength={HOTEL_NAME.max}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          {error ? (
            <p id={`${inputId}-error`} role="alert" className="text-sm text-[var(--destructive,#c0262c)]">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? t('rename.saving') : t('rename.submit')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteBody({ project, onDone }: { project: ProjectCardView; onDone: () => void }) {
  const t = useTranslations('projects');
  const router = useRouter();
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const result = await deleteProjectAction(project.id);
      if (result.ok) {
        toast.success(t('toast.deleted'));
        onDone();
        router.refresh();
      } else toast.error(t('toast.failed'));
    });
  }

  return (
    <DialogContent className="rounded-[28px] p-8 sm:max-w-md" role="alertdialog">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">{t('delete.title', { name: project.hotelName })}</DialogTitle>
        <DialogDescription className="text-[15px]">{t('delete.description')}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t('delete.cancel')}
        </Button>
        <Button type="button" variant="destructive" onClick={confirm} disabled={pending}>
          {pending ? t('delete.deleting') : t('delete.confirm')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
