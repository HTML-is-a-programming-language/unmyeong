-- Supabase SQL Editor에 붙여넣고 실행하세요
-- https://supabase.com/dashboard → 프로젝트 → SQL Editor

-- 1. profiles 테이블 생성
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  credits integer not null default 5,
  created_at timestamp with time zone default timezone('utc', now())
);

-- 2. Row Level Security 활성화
alter table public.profiles enable row level security;

-- 3. 본인 데이터만 읽기/쓰기 가능
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 4. 신규 유저 자동 프로필 생성 트리거 (선택사항 — auth callback에서 처리하므로 없어도 됨)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 5)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
