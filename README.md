# Parkventory

Application Cloudflare-native de partage de places de parking entre collègues.

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Le socle actif est volontairement court : React, un Worker TypeScript et une
base D1. Voir [`PROJECT.md`](PROJECT.md), [`STATUS.md`](STATUS.md) et
[`RUNBOOK.md`](RUNBOOK.md).
