# Ágil — Vercel

## Deploy
1. Importe esta pasta como projeto na Vercel.
2. Em **Settings → Environment Variables**, adicione:
   - `DUTTYFY_PIX_URL_ENCRYPTED` = URL criptografada da Duttyfy.
   - `SUCCESS_URL` = URL de pós-pagamento (opcional).
3. Faça o redeploy.

O checkout usa `/api/create-payment` e `/api/status`, compatíveis com Vercel Functions.

## Rastreamento
- Meta Pixel: `1112205644494962`
- UTMify Pixel: `6ac2e689745d253a48a89b21`
- Script de UTMs da UTMify instalado no funil e checkout.

O valor do checkout está configurado em **R$ 29,57**.
