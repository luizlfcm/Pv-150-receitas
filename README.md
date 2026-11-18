# PV 150 Almoços Fitness — Pulso Saúde em Movimento

Página de boas-vindas (estática, sem build) que serve de destino dos anúncios de Vendas e leva ao WhatsApp da Isabella com um código de referência.

- `index.html` — a página. O bloco `window.PULSO` no topo concentra a configuração: ID do pixel, número do WhatsApp, mensagem pronta e `refEndpoint` (webhook do n8n que guarda o código do clique; vazio = não envia).
- `app.js` — gera o código curto (`ref XXXXX`), monta o link do WhatsApp e, no clique, dispara `Lead` e `Contact` do pixel (eventID `lead-<código>` / `contact-<código>`) e envia fbp/fbc/UTM ao `refEndpoint`.
- `privacidade.html` — política de privacidade (o pixel exige aviso).
- `fonts/` e `img/` — fonte (Instrument Sans, licença OFL) e imagens, tudo hospedado aqui.
- `vercel.json` — URLs limpas e cache.

Deploy: conectar este repositório à Vercel (Framework: Other, sem build command, output = raiz) e apontar `pulsosaude.luverisgroup.com.br`.

Não colocar tokens/segredos neste repositório. O token da API de Conversões fica só nas credenciais do n8n.
