# Almoçômetro

Sistema de confirmação diária de almoço da Projeta.

## Estado da migração

- Estrutura PostgreSQL aplicada no Supabase em 13/10/2026.
- Cópia inicial dos cadastros, respostas, controles diários e preços conferida campo a campo.
- `database/schema.sql` documenta a estrutura inicial; não contém dados de colaboradores nem credenciais.
- As quatro tabelas possuem RLS e acesso direto revogado para `anon` e `authenticated`. O acesso previsto é pelo servidor autorizado, com chave secreta exclusivamente no ambiente de execução.
- O sistema em produção ainda usa seu banco original. Esta cópia do Supabase não recebe novos lançamentos automaticamente.

## Próximas etapas

1. Preparar a aplicação para execução na Netlify e autenticação do administrador.
2. Configurar credenciais exclusivamente nas variáveis secretas de ambiente da hospedagem.
3. Validar leitura, gravação, cadastros, relatórios e rotinas diárias.
4. Reconciliar os dados com a origem imediatamente antes da troca de banco.
5. Efetuar a troca somente após a validação. Manter o banco original para recuperação.

Este repositório contém, por enquanto, a estrutura do banco; a aplicação para Netlify ainda não foi adicionada.

## Regras preservadas

Confirmações até 08:55 e preenchimento de pendentes como Não após 09:30, no fuso America/Sao_Paulo. Uma resposta por colaborador e dia. Exclusão lógica de cadastros, nomes e departamentos históricos nas respostas e preços em centavos com vigência por data.
