# Piano: pubblicare su Facebook e Instagram dal sito

Proposta del 2026-09-28, **da decidere** (vedi `TODO.md`). Oggi i post si scaricano dalla
pagina Social e si pubblicano a mano.

- **Complessità**: medio-alta, ~12-18 ore più i tempi di Meta. Prima di tutto chiedersi se serve: con 2-4 post a settimana il giro
  "scarica, copia, pubblica" costa 1-2 minuti, e Meta Business Suite pubblica già su tutti e due in un
  colpo (basterebbe un pulsante "Apri Business Suite", zero codice). Se si fa:
  - **Fase 0, senza codice, qui si ferma se si ferma**: account Instagram professionale (Business o
    Creator) collegato alla Pagina Facebook del club; app su developers.facebook.com (tipo Business)
    con chi pubblica come admin/tester, così bastano i permessi "Standard Access" senza App Review
    (verificare sulle regole Meta di oggi: può chiedere la verifica dell'attività); permessi
    `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`,
    `instagram_content_publish`; una pagina con l'informativa privacy; prova a mano con Graph API
    Explorer su una Pagina e un account di prova
  - **Schema**: tabella `social_accounts` (id Pagina, token della Pagina che non scade, id Instagram)
    con RLS e nessuna regola per il browser, stato letto da una funzione che mostra solo nomi e data;
    `social_events` + `fb_post_id`, `ig_media_id`, `ig_permalink`; bucket Storage pubblico per le
    immagini (Instagram le scarica da un indirizzo pubblico, solo JPEG)
  - **Edge Function `collega-meta`**: login OAuth con redirect (niente SDK Facebook nella pagina),
    `state` legato all'utente, scambio dei token con l'app secret (secret di Supabase, mai nel
    browser), scelta Pagina e Instagram, ritorno a `social.html#impostazioni`
  - **Edge Function `pubblica-social`** (come `crea-utente`: CORS, controllo del chiamante e del
    permesso `social`): Facebook `POST /{page}/photos`; Instagram `POST /{ig}/media` → attesa →
    `media_publish`; story facoltativa; esito per piattaforma, poi `published_at` e i link
  - **Pagina**: riquadro "Account social" in Impostazioni (collegato / da ricollegare); nel post
    spunte Instagram, Facebook, Story e "Pubblica ora" con conferma (`chiedi()`): è pubblico e non si
    annulla. Il giro a mano resta
  - **Limiti**: lo sticker link della story non si mette da API (quella story resta a mano); il token
    cade se si cambia password o si revoca l'accesso ("ricollega"); Meta chiude le versioni vecchie
    delle API ogni ~2 anni (versione in una costante); campagne sponsor a mano nella prima versione
  - **Da decidere**: Business Suite o API; story da API senza link; chi collega l'account

