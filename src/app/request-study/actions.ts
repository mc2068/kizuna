'use server';
// The server action behind the Request a study form (#19, the form itself is #20). Use it with
// useActionState: `const [state, action, pending] = useActionState(requestStudy, null)` and
// `<form action={action}>`. The form's field names are the keys of StudyRequestForm.
import { submitStudyRequest, type StudyRequestResult } from '@/lib/db';

export async function requestStudy(_previous: StudyRequestResult | null, formData: FormData): Promise<StudyRequestResult> {
  return submitStudyRequest(formData);
}
