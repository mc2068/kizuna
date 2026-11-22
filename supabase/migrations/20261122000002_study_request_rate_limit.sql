-- Abuse protection for the Request a study form (#19): at most N requests per client per window.
-- The key is a SHA-256 hash of the client IP (never the IP itself, INPDP). Only the server calls
-- take_study_request_slot, with the service role; visitors cannot read or write the table.

create table public.study_request_attempts (
  id bigint generated always as identity primary key,
  key text not null check (char_length(key) between 1 and 128),
  created_at timestamptz not null default clock_timestamp()
);
create index study_request_attempts_key_created_at_idx on public.study_request_attempts (key, created_at);
create index study_request_attempts_created_at_idx on public.study_request_attempts (created_at);

alter table public.study_request_attempts enable row level security;
-- No policies: only the service role (which bypasses RLS) and the function below touch it.
revoke all on public.study_request_attempts from public, anon, authenticated;

-- Records one attempt for `p_key` and returns true, or returns false (recording nothing) when the
-- key already made `p_limit` attempts in the last `p_window_seconds`. Attempts older than a day are
-- pruned on the way. The advisory lock makes concurrent calls for the same key count correctly.
create function public.take_study_request_slot(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  perform pg_advisory_xact_lock(hashtext('study_request_attempts:' || p_key));
  delete from public.study_request_attempts where created_at < now() - interval '1 day';
  select count(*) into recent
  from public.study_request_attempts
  where key = p_key and created_at > now() - make_interval(secs => p_window_seconds);
  if recent >= p_limit then
    return false;
  end if;
  insert into public.study_request_attempts (key) values (p_key);
  return true;
end;
$$;

revoke execute on function public.take_study_request_slot(text, integer, integer) from public, anon, authenticated;
grant execute on function public.take_study_request_slot(text, integer, integer) to service_role;
