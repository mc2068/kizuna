'use client';

// "Save this project" (#21): a dialog asks for the hotel name, then the server saves the inputs and
// computes the results. Signed out, the project waits in localStorage (pending-project.ts) while
// the visitor signs in, and <ResumeSave/> saves it once when they come back to /tool?resume=1.
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { saveToolProject, type SaveProjectResult } from '@/app/tool/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInPath } from '@/lib/auth/paths';
import type { SizingInput } from '@/lib/engine';
import { cleanHotelName, HOTEL_NAME, pendingFromResume, resumePath, storePending, withoutResume } from './pending-project';

function useSavedToast() {
  const t = useTranslations('tool.save');
  const router = useRouter();
  return (result: SaveProjectResult) => {
    if (result.ok) {
      toast.success(t('saved'), { action: { label: t('openProjects'), onClick: () => router.push('/projects') } });
    } else if (result.error !== 'signedOut') {
      toast.error(t(`errors.${result.error}`));
    }
  };
}

export function SaveProjectButton({ inputs }: { inputs: SizingInput }) {
  const t = useTranslations('tool.save');
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--line,#d2d2d7)] px-5 py-3 text-[17px] text-[var(--ink,#1d1d1f)] hover:bg-[var(--tile,#f5f5f7)] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
      >
        {t('button')}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        {open ? <SaveDialogBody inputs={inputs} onDone={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}

function SaveDialogBody({ inputs, onDone }: { inputs: SizingInput; onDone: () => void }) {
  const t = useTranslations('tool.save');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showResult = useSavedToast();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hotelName = cleanHotelName(name);
    if (!hotelName) {
      setError(t('errors.invalidName'));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveToolProject({ hotelName, inputs });
      if (!result.ok && result.error === 'signedOut') {
        const stored = storePending({ hotelName, inputs, savedAt: Date.now() });
        window.location.assign(signInPath(resumePath(inputs, stored ? undefined : hotelName)));
        return;
      }
      if (!result.ok && result.error === 'invalidName') {
        setError(t('errors.invalidName'));
        return;
      }
      showResult(result);
      if (result.ok) onDone();
    });
  }

  return (
    <DialogContent className="rounded-[28px] p-8 sm:max-w-md">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{t('title')}</DialogTitle>
          <DialogDescription className="text-[15px]">{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="save-hotel-name">{t('nameLabel')}</Label>
          <Input
            id="save-hotel-name"
            name="hotelName"
            autoComplete="organization"
            autoFocus
            required
            minLength={HOTEL_NAME.min}
            maxLength={HOTEL_NAME.max}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'save-hotel-name-error' : undefined}
          />
          {error ? (
            <p id="save-hotel-name-error" role="alert" className="text-sm text-[var(--destructive,#d70015)]">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? t('saving') : t('submit')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Survives React's double effects in development and the inert copy of the tool in the page shell.
let resumeStarted = false;

/** On /tool?resume=1 after sign-in: saves the pending project once, then removes resume from the URL. */
export function ResumeSave() {
  const showResult = useSavedToast();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || resumeStarted) return;
    const search = new URLSearchParams(window.location.search);
    if (search.get('resume') !== '1') return;
    ran.current = true;
    resumeStarted = true;
    const pending = pendingFromResume(search);
    const clearUrl = () => {
      const { pathname, search: s, hash } = window.location;
      window.history.replaceState(null, '', withoutResume(pathname, s, hash));
    };
    if (!pending) {
      clearUrl();
      return;
    }
    void saveToolProject({ hotelName: pending.hotelName, inputs: pending.inputs }).then((result) => {
      // Came back without signing in: keep the project for the next attempt.
      if (!result.ok && result.error === 'signedOut') {
        storePending(pending);
        resumeStarted = false;
        return;
      }
      clearUrl();
      showResult(result);
    });
  }, [showResult]);
  return null;
}
