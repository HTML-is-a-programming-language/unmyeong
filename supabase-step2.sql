-- Supabase SQL Editor에서 실행하세요 (2단계)

-- 결제 내역 테이블
create table public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  credits_added integer not null,
  paddle_transaction_id text unique not null,
  amount_paid numeric(10,2) not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- RLS 활성화
alter table public.credit_transactions enable row level security;

-- 본인 결제 내역만 조회 가능
create policy "Users can read own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- 서버에서만 insert 가능
create policy "Service role can insert transactions"
  on public.credit_transactions for insert
  with check (true);
