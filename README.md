# 📘 Estatuto PM-MA — Plataforma de Estudo CEBRASPE

Plataforma web interativa para estudo do **Estatuto dos Policiais-Militares do Maranhão (Lei nº 6.513/1995)**, com banco de questões estilo CEBRASPE, macetes de memorização e acompanhamento de desempenho salvo na nuvem (Supabase).

## ✨ Funcionalidades

- **173+ questões** no formato Certo/Errado, organizadas por tema e artigo
- Correção imediata com **explicação detalhada** e **macete de memorização**
- Banco de questões com busca por palavra-chave/tema/artigo
- Macetes temáticos para revisão rápida
- **Login** (e-mail/senha ou link mágico) via Supabase Auth
- **Histórico de desempenho** salvo por usuário: aproveitamento geral, por tema e últimas rodadas

## 🚀 Como fazer o deploy

Este projeto é **100% estático** (HTML + JS via CDN) — não precisa de build nem servidor.

### Opção 1: GitHub Pages
1. Suba este repositório no GitHub
2. Vá em **Settings → Pages**
3. Em "Source", selecione a branch `main` e pasta `/ (root)`
4. Salve — em alguns minutos o site estará em `https://SEU_USUARIO.github.io/SEU_REPO/`

### Opção 2: Vercel / Netlify
1. Importe o repositório do GitHub
2. Não defina build command (é site estático)
3. Diretório de output: `/` (raiz)
4. Deploy automático a cada push

## 🗄️ Configuração do Supabase (obrigatório para login/histórico)

1. Acesse seu projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo de [`supabase_setup.sql`](./supabase_setup.sql) — isso cria as tabelas `respostas` e `sessoes` com Row Level Security
3. Em **Authentication → Providers**, confirme que **Email** está habilitado
4. (Opcional) Em **Authentication → URL Configuration**, adicione a URL final do seu deploy em "Redirect URLs" para o login por link mágico funcionar corretamente

As credenciais do Supabase (URL e chave `anon`) já estão configuradas em `index.html` — são seguras para uso público, pois o acesso aos dados é protegido por RLS (cada usuário só vê seus próprios registros).

## 📂 Estrutura

```
.
├── index.html          # Aplicação completa (HTML+CSS+JS)
├── supabase_setup.sql  # Script de criação das tabelas no Supabase
└── README.md
```

## ⚠️ Aviso

Material de estudo baseado no texto da Lei nº 6.513/1995. Não substitui a leitura da legislação atualizada e vigente.
