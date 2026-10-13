# Login do responsável

A tela /login oferece e-mail/senha, cadastro e recuperação. As contas devem usar o e-mail de ADMIN_EMAIL. O login ChatGPT existente permanece disponível durante a configuração.

No Supabase, Authentication > URL Configuration:

- Site URL: https://almoco-da-equipe.bubblytrail2.chatgpt.site
- Redirect URLs: https://almoco-da-equipe.bubblytrail2.chatgpt.site/login/confirmar

Configurar o provedor de e-mail (SMTP) para envio de confirmação e recuperação a destinatários autorizados. A entrega real de e-mails e o fluxo completo de cadastro/recuperação ainda precisam ser validados após essa configuração; os testes de implementação não enviam e-mails a pessoas.

O cookie de sessão Supabase é Secure, HttpOnly, SameSite=Lax e limitado a uma hora. O servidor valida a identidade com Supabase Auth e aplica ADMIN_EMAIL; não usa metadados editáveis do usuário para conceder acesso. O token do link é removido do fragmento da URL antes da confirmação no servidor. Rotas de alteração verificam Origin. A opção Sair encerra as sessões locais e direciona ao logout da hospedagem.
