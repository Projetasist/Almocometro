# Almoçômetro

Sistema de confirmação de almoço da Projeta, hospedado em Sites e conectado ao Supabase.

## Produção

Painel: https://almoco-da-equipe.bubblytrail2.chatgpt.site/admin

A migração para Supabase foi concluída em 13/10/2026. Cadastros, respostas, preços e controles diários foram copiados e conferidos campo a campo. O banco D1 original permanece como cópia histórica e não recebe os novos lançamentos.

## Arquitetura

O navegador acessa as rotas do Site. O servidor valida a identidade ChatGPT do responsável ou o link de acesso ao formulário. Somente então chama a função Supabase `almocometro-store`, autenticada com uma credencial exclusiva guardada como segredo no servidor. A função expõe apenas operações nomeadas, sem SQL arbitrário, e usa a credencial interna do Supabase. O cliente não recebe credenciais do banco.

As tabelas possuem RLS e não concedem acesso direto a `anon` ou `authenticated`. A função SQL `almocometro_operation` é SECURITY INVOKER e sua execução é restrita a `service_role`. O digest SHA-256 no código da função Edge verifica o token aleatório de 256 bits; o token em si não está neste repositório. A função Edge possui `verify_jwt=false` porque implementa essa autenticação própria.

## Configuração do servidor

Definir em variáveis de ambiente protegidas: `ADMIN_EMAIL`, `FORM_KEY`, `LUNCH_SCHEDULE_TOKEN`, `LUNCH_DATABASE_TOKEN`. Definir `LUNCH_DATABASE_URL` com a URL da função Edge. Nunca colocar esses valores no código ou em variáveis públicas. `LUNCH_MIGRATION_PAUSED=true` bloqueia temporariamente as operações do banco durante uma migração; normalmente deve estar ausente.

## Desenvolvimento e publicação

Requer Node >=22.13 e a versão de pnpm fixada em package.json. Instalar com `pnpm install --frozen-lockfile`, verificar com `pnpm exec tsc --noEmit` e compilar com `pnpm build`. O runtime usa Cloudflare Workers/Vinext e a autenticação de Sites; não é uma aplicação estática.

A publicação atual é feita pelo fluxo de Sites, com o project_id de .openai/hosting.json. Um push neste GitHub não publica automaticamente o Site. O diretório database contém o schema PostgreSQL, as operações autorizadas e os testes transacionais com ROLLBACK. Não executar schema.sql novamente em um banco já inicializado. As migrations antigas de D1 e dados pessoais não fazem parte desta cópia pública.

## Regras

- Confirmação até 08:55 e pendentes marcados como Não após 09:30 (America/Sao_Paulo).
- A rotina diária existente continua chamando o mesmo endpoint do Site, agora conectado ao Supabase.
- Uma resposta por pessoa/dia; ajustes reservados ao responsável.
- Exclusão lógica de colaboradores e preservação dos dados históricos.
- Preços em centavos por vigência e relatórios por dia, departamento e pessoa.

## Verificação

Build e TypeScript aprovados. Testes SQL transacionais conferem bloqueio de duplicatas, preservação de respostas, exclusão de inativos, snapshots históricos, correções administrativas e restrição de acesso. A função Edge rejeita chamadas sem credencial. O endpoint de manutenção publicado foi verificado com resposta 200, skipped=false e remaining=0 após a correção de compatibilidade do fetch em Workers.
