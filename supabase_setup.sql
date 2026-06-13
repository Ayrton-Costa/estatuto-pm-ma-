-- ============================================================
-- Setup Supabase - Plataforma de Estudo Estatuto PM-MA
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- Tabela de respostas (histórico de cada questão respondida)
create table if not exists public.respostas (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id text not null,
  tema text,
  artigo text,
  acertou boolean not null,
  created_at timestamptz default now()
);

alter table public.respostas enable row level security;

create policy "usuarios veem suas respostas"
  on public.respostas for select
  using (auth.uid() = user_id);

create policy "usuarios inserem suas respostas"
  on public.respostas for insert
  with check (auth.uid() = user_id);

-- Tabela de sessões de quiz (resumo de cada rodada)
create table if not exists public.sessoes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tema text,
  total int not null,
  acertos int not null,
  created_at timestamptz default now()
);

alter table public.sessoes enable row level security;

create policy "usuarios veem suas sessoes"
  on public.sessoes for select
  using (auth.uid() = user_id);

create policy "usuarios inserem suas sessoes"
  on public.sessoes for insert
  with check (auth.uid() = user_id);

-- Índices úteis
create index if not exists idx_respostas_user on public.respostas(user_id);
create index if not exists idx_respostas_tema on public.respostas(tema);
create index if not exists idx_sessoes_user on public.sessoes(user_id);
