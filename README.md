# PV 150 Almoços Fitness — Pulso Saúde em Movimento

Página de boas-vindas (estática, sem build) que serve de destino dos anúncios (campanha de **Vendas** com evento Compra) e leva ao WhatsApp da vendedora com um **código de referência**. **É o modelo padrão de PV para todos os funis de WhatsApp do Luiz** (visão geral do sistema em `docs/MODELO-PV-CAPI.md` do repositório do funil, `luizlfcm/funil-x1-whatsapp`).

- `index.html` — a página. O bloco `window.PULSO` no topo concentra a configuração: ID do pixel, número do WhatsApp, mensagem pronta e `refEndpoint` (webhook do n8n que guarda o código do clique; vazio = não envia).
- `app.js` — gera o código curto (`ref XXXXX`), monta o link do WhatsApp e, no clique, dispara `Lead` e `Contact` do pixel (eventID `lead-<código>` / `contact-<código>`), envia código/fbp/fbc/UTM/ad_id ao `refEndpoint` e mostra a tela "Abrindo o seu WhatsApp…". Tudo é à prova de falha: se o pixel ou o endpoint não responderem, o botão continua abrindo o WhatsApp.
- `privacidade.html` — política de privacidade (o pixel exige aviso; já cita o envio da compra à Meta com dados criptografados).
- `fonts/` e `img/` — fonte (Instrument Sans, licença OFL) e imagens, tudo hospedado aqui.
- `vercel.json` — URLs limpas e cache.
- `teste/teste-pv.js` — teste de ponta a ponta (Playwright, celular 390×844). Lê pixel, número e mensagem de `window.PULSO`, então vale para qualquer produto: `NODE_PATH=$(npm root -g) node teste/teste-pv.js` (deve terminar em `TUDO OK`).

Deploy: conectar este repositório à Vercel (Framework: Other, sem build command, output = raiz) e apontar o subdomínio (`pulsosaude.luverisgroup.com.br`). Hoje o push em `main` publica direto.

Não colocar tokens/segredos neste repositório. O token da API de Conversões fica só nas credenciais do n8n.

## Usar como modelo para outro produto

1. Copiar este repositório para um repositório novo e conectar à Vercel com um subdomínio novo.
2. Editar **só** o bloco `window.PULSO` em `index.html`:
   - `pixelId`: pixel (dataset) do produto no Gerenciador de Eventos da Meta;
   - `whatsapp`: número do funil, só dígitos com 55 (ex.: `5521988784380`);
   - `mensagem`: texto que o botão manda (o código `(ref XXXXX)` é acrescentado no fim);
   - `refEndpoint`: URL do webhook "Registrar clique da PV" (workflow 6 do funil; **um caminho secreto novo por projeto**, ver `builder/mk_pv.py`).
3. Trocar o conteúdo: título e frase de abertura, capa, botão, linha de preço/garantia, seção "Quem somos", dados da empresa e Instagram no rodapé, `privacidade.html` (nome/CNPJ/produto) e as imagens de `img/`.
4. Rodar `teste/teste-pv.js`, publicar, abrir no celular e tocar no botão para ver a mensagem pronta no WhatsApp.

### Regras de design e copy que valem para todo projeto (decididas com o Luiz)
- **O botão cabe na primeira dobra** do celular (testado em 390×844 e telas menores). Sem logo grande no topo: ocupa espaço e não vende.
- **A mensagem que o botão manda repete o texto do botão** (ex.: botão "Quero meu guia" → "Oi! Quero meu guia das 150 receitas fitness 🥗"). Texto diferente do botão confunde.
- Logo abaixo do botão, deixar claro que a compra e a entrega acontecem no WhatsApp ("Compre e receba tudo no WhatsApp" + "Clique para nos chamar"): é a maior dúvida de quem desconfia.
- O botão chama atenção com animação própria (brilho, varredura, balanço) e há um botão **flutuante** fixo que aparece quando o principal sai da tela. Respeitar `prefers-reduced-motion`.
- Tela "Abrindo o seu WhatsApp…" ao clicar, com plano B (link manual) depois de ~4 s: evita perder quem não tem o app abrindo na hora.
- Tipografia única (Instrument Sans), legível no celular: título grande em peso 700, frase de apoio em 500.
- Rodapé com razão social, CNPJ, Instagram e link da política de privacidade. Nunca expor o número do CREA.
- Código de referência de 5 caracteres do alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sem 0/O/1/I); o funil só reconhece esse formato.

### O que o anúncio precisa levar
O anúncio aponta para esta página com **parâmetros de URL** (campo "Parâmetros de URL" da Meta):
`utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&ad_id={{ad.id}}&adset_id={{adset.id}}&campaign_id={{campaign.id}}&placement={{placement}}`.
Sem `ad_id` o custo por anúncio não aparece no Dashboard; sem `fbclid` a Meta não liga a compra ao clique.
