-- ============================================================
-- Tabela de subscrições push — adicionar ao Supabase
-- Execute no SQL Editor junto com os scripts anteriores
-- ============================================================

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  horarios jsonb not null default '[]',  -- [{hora:"07:00", dias:["seg","ter",...]}]
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "usuarios gerenciam suas subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role pode ler tudo (para a Edge Function enviar pushes)
create policy "service role le subscriptions"
  on public.push_subscriptions for select
  using (true);
