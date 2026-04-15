-- ── 아이돌 랭킹 테이블 ──────────────────────────────────────────
-- Supabase Dashboard → SQL Editor 에서 실행하세요

-- 1. 테이블 생성
create table if not exists public.idol_stats (
  idol_name  text not null,
  group_name text not null,
  count      integer not null default 1,
  updated_at timestamp with time zone default timezone('utc', now()),
  primary key (idol_name, group_name)
);

-- 2. RLS 설정
alter table public.idol_stats enable row level security;

create policy "Anyone can read idol stats"
  on public.idol_stats for select
  using (true);

create policy "Authenticated users can insert idol stats"
  on public.idol_stats for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update idol stats"
  on public.idol_stats for update
  to authenticated
  using (true);

-- 3. 카운트 증가 함수 (upsert + increment)
create or replace function increment_idol_count(p_name text, p_group text)
returns void as $$
begin
  insert into public.idol_stats (idol_name, group_name, count, updated_at)
  values (p_name, p_group, 1, now())
  on conflict (idol_name, group_name)
  do update set
    count = idol_stats.count + 1,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- 4. 그룹 랭킹 집계 함수
create or replace function get_group_rankings()
returns table(group_name text, total_count bigint) as $$
  select group_name, sum(count)::bigint as total_count
  from public.idol_stats
  group by group_name
  order by total_count desc
  limit 10;
$$ language sql security definer;
