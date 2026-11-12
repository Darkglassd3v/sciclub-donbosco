// Prove del lancio della stagione 2026/27 (richiesta del 12/11/2026): due post e un Reel.
// - Post 1, invito alla serata di presentazione: mercoledì 25 novembre 2026 alle 21, al Circolo Way
//   Assauto, corso Pietro Chiesa 20, Asti, con buffet e brindisi finale.
// - Post 2, «Si parte!»: la prima gita il 1° dicembre, il calendario di dicembre, la prova gratuita con
//   i maestri del 13 dicembre, il Dream Weekend dall'11 al 13 dicembre e i corsi dal 9 gennaio.
// - Reel: la copia del video da 19 s con il finale della serata al posto di «Seguici».
// - Reel veloce per le inserzioni Instagram (richiesta del 12/11/2026): 16 s, l'apertura col logo grande
//   al centro con un secondo di pausa in più, poi un'inquadratura nuova almeno ogni secondo, lo spruzzo
//   più lungo come stacco e lo stesso finale della serata.
// Le prove controllano i dati, le didascalie (niente prezzi, profilo Instagram nuovo), i testi del
// finale del video, le misure delle immagini e del video prodotti e, se la variabile DB porta la
// connessione, l'evento salvato nel database.
// Uso: node grafica/lancio-stagione/sorgenti/prova.js   (DB="$(cat supabase/.postgre_connect)" per il database)
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { execFileSync } = require("child_process");

const QUI = __dirname;
const LANCIO = path.join(QUI, "..");
const GRAFICA = path.join(LANCIO, "..");
const leggi = (p) => fs.readFileSync(p, "utf8");
const risultati = [];
const prova = (nome, fn) => {
  try { fn(); risultati.push(`ok  ${nome}`); } catch (e) { risultati.push(`NO  ${nome}: ${e.message}`); }
};

/** Larghezza e altezza di un JPEG, lette dal segmento SOF. */
function misureJpeg(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${path.basename(file)}: misure non trovate`);
}

prova("dati della serata", () => {
  const { SERATA } = require(path.join(QUI, "dati.js"));
  assert.strictEqual(SERATA.data, "2026-11-25");
  assert.strictEqual(new Date(`${SERATA.data}T12:00:00Z`).getUTCDay(), 3, "il 25 novembre 2026 deve essere mercoledì");
  assert.strictEqual(SERATA.ora, "21:00");
  assert.strictEqual(SERATA.luogo, "Circolo Way Assauto");
  assert.strictEqual(SERATA.indirizzo, "corso Pietro Chiesa 20, Asti");
  assert.match(SERATA.extra, /Buffet e brindisi finale/);
});

prova("gite di dicembre e novità d'inizio stagione", () => {
  const { DICEMBRE, NOVITA } = require(path.join(QUI, "dati.js"));
  // Le gite di dicembre salvate in produzione il 12/11/2026, in ordine di data.
  assert.deepStrictEqual(DICEMBRE.map((g) => `${g.data} ${g.meta}`), [
    "2026-12-01 Val Thorens", "2026-12-06 Val Thorens", "2026-12-08 Cervinia Valtournenche",
    "2026-12-13 Sestriere", "2026-12-15 Pila", "2026-12-20 Cervinia",
  ]);
  const testo = NOVITA.map((n) => `${n.quando} ${n.cosa}`).join(" | ");
  for (const atteso of ["13 dicembre", "Prova gratuita", "11-13 dicembre", "Dream Weekend", "9 gennaio", "corsi"]) {
    assert.ok(testo.includes(atteso), `manca «${atteso}» nelle novità: ${testo}`);
  }
});

prova("didascalie", () => {
  const t = leggi(path.join(LANCIO, "didascalie.md"));
  for (const atteso of ["25 novembre", "21:00", "Circolo Way Assauto", "corso Pietro Chiesa 20", "Buffet e brindisi",
    "1° dicembre", "13 dicembre", "9 gennaio", "@sciclubdonbosco_asti"]) {
    assert.ok(t.includes(atteso), `manca «${atteso}»`);
  }
  assert.ok(!t.includes("€"), "nelle didascalie non vanno prezzi");
  assert.ok(!/instagram\.com\/sciclubdonboscoasti|@sciclubdonboscoasti\b/.test(t), "c'è il profilo Instagram vecchio");
  assert.ok(!/!{3,}/.test(t), "punti esclamativi ripetuti");
});

prova("finale del video della serata", () => {
  const indice = leggi(path.join(GRAFICA, "video-presentazione", "index.html"));
  assert.ok(indice.includes("compositions/frames/05-serata.html"), "il video non usa il finale della serata");
  assert.ok(!indice.includes("compositions/frames/05-seguici.html"), "il video usa ancora il finale «Seguici»");
  const finale = leggi(path.join(GRAFICA, "video-stagione", "compositions", "frames", "05-serata.html"));
  for (const atteso of ["Ti aspettiamo", "Presentazione della stagione 2026/27", "Mercoledì 25 novembre", "ore 21",
    "Circolo Way Assauto", "corso Pietro Chiesa 20, Asti", "Buffet e brindisi finale"]) {
    assert.ok(finale.includes(atteso), `manca «${atteso}» nel finale`);
  }
});

prova("immagini dei due post e delle storie", () => {
  const attese = [
    ["invito-post.jpg", 1080, 1350], ["invito-story.jpg", 1080, 1920],
    ["promemoria-mercoledi.jpg", 1080, 1920], ["promemoria-stasera.jpg", 1080, 1920],
    ["si-parte-1.jpg", 1080, 1350], ["si-parte-2.jpg", 1080, 1350], ["si-parte-3.jpg", 1080, 1350],
  ];
  for (const [nome, w, h] of attese) {
    const file = path.join(LANCIO, nome);
    assert.ok(fs.existsSync(file), `manca ${nome} (sorgenti/rendi.sh)`);
    assert.deepStrictEqual(misureJpeg(file), [w, h], `${nome} non è ${w}×${h}`);
  }
});

/** Controlla che il video esista, sia verticale 1080×1920 e duri `secondi` (con 0,2 s di tolleranza). */
function controllaVideo(progetto, nome, secondi) {
  const file = path.join(GRAFICA, progetto, "renders", nome);
  assert.ok(fs.existsSync(file), `manca il video (npx hyperframes render in grafica/${progetto})`);
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height:format=duration", "-of", "json", file], { encoding: "utf8" });
  const info = JSON.parse(out);
  assert.deepStrictEqual([info.streams[0].width, info.streams[0].height], [1080, 1920], `${nome} non è 1080×1920`);
  assert.ok(Math.abs(Number(info.format.duration) - secondi) < 0.2, `${nome} dura ${info.format.duration} s invece di ${secondi}`);
}

prova("video della serata", () => controllaVideo("video-presentazione", "invito-serata-19s.mp4", 19));

prova("montaggio veloce per Instagram", () => {
  const indice = leggi(path.join(GRAFICA, "video-serata-veloce", "index.html"));
  assert.match(indice, /data-composition-id="main"[^>]*data-duration="16"/, "il video veloce non dura 16 s");
  for (const scena of ["00-veloce.html", "05-serata.html"]) {
    assert.ok(indice.includes(`compositions/frames/${scena}`), `il video veloce non usa ${scena}`);
  }
  // L'apertura resta quella del video della stagione: il logo grande cade al centro dello schermo
  assert.ok(/const CENTRO = /.test(indice) && /tl\.fromTo\("#logo-fisso", \{ x: CENTRO\.x/.test(indice), "manca il logo grande al centro all'apertura");
  const FINALE = Number((indice.match(/id="f05-serata"[^>]*data-start="([\d.]+)"/) || [])[1]);
  assert.strictEqual(FINALE, 9, "il finale della serata deve partire a 9 s");
  const montaggio = leggi(path.join(GRAFICA, "video-stagione", "compositions", "frames", "00-veloce.html"));
  const attr = (tag, nome) => (tag.match(new RegExp(`\\b${nome}="([^"]*)"`)) || [])[1];
  const clip = [...montaggio.matchAll(/<video\b[^>]*>/g)].map(([tag]) => ({
    src: attr(tag, "src"), inizio: Number(attr(tag, "data-start")), durata: Number(attr(tag, "data-duration")),
    daMedia: Number(attr(tag, "data-media-start")),
  }));
  // L'elenco INQ dello script (colpo di zoom a ogni taglio) deve avere gli stessi tempi dei video
  const inq = JSON.parse((montaggio.match(/const INQ = (\[.*\]);/) || [])[1] || "null");
  assert.deepStrictEqual(inq, clip.map((c) => [c.inizio, c.durata]), "INQ nello script non corrisponde ai tempi dei video");
  const tagli = [...clip.map((c) => c.inizio).sort((a, b) => a - b), FINALE];
  assert.strictEqual(tagli[0], 0, "il montaggio non parte da 0");
  // Il logo ha un secondo di pausa in più rispetto al video da 16 s (che taglia a 2,5 s), poi i tagli
  // accelerano: almeno quattro inquadrature da un secondo al massimo. Gli sci nella rastrelliera sono
  // stati tolti (richiesta del 12/11): l'ultima inquadratura è lo spruzzo, più lungo, e la sua neve che
  // copre l'obiettivo (secondo 2,12 della clip) fa da stacco verso il finale della serata.
  assert.ok(tagli[1] >= 3.4, `il logo resta solo ${tagli[1]} s`);
  assert.ok(!clip.some((c) => c.src.endsWith("attrezzatura.mp4")), "c'è ancora l'inquadratura degli sci");
  const ultima = clip[clip.length - 1];
  assert.ok(ultima.src.endsWith("spruzzo.mp4"), `l'ultima inquadratura è ${ultima.src}, non lo spruzzo`);
  assert.ok(FINALE - ultima.inizio >= 1.5, `lo spruzzo dura solo ${(FINALE - ultima.inizio).toFixed(2)} s prima del finale`);
  assert.ok(Math.abs(ultima.daMedia + FINALE - ultima.inizio - 2.12) < 0.05, "la neve dello spruzzo non copre l'obiettivo all'arrivo del finale");
  const veloci = tagli.slice(1, -2);
  assert.ok(veloci.length >= 4, `solo ${veloci.length} inquadrature fra il logo e lo spruzzo`);
  veloci.forEach((t, i) => assert.ok(tagli[i + 2] - t <= 1, `inquadratura di ${(tagli[i + 2] - t).toFixed(2)} s da ${t} s`));
  const verticali = path.join(GRAFICA, "video-stagione");
  for (const c of clip) assert.ok(fs.existsSync(path.join(verticali, c.src)), `manca la clip ${c.src} (prepara-clip.sh)`);
  for (const atteso of ["Stagione", "2026/27", "Nuove gite,", "settimana bianca", "e corsi"]) {
    assert.ok(montaggio.includes(atteso), `manca «${atteso}» nel montaggio`);
  }
});

prova("video veloce della serata", () => controllaVideo("video-serata-veloce", "invito-serata-veloce-16s.mp4", 16));

/** Una query al database: solo l'errore di psql, perché il messaggio di Node riporterebbe il comando con la password. */
function psql(sql) {
  try {
    return execFileSync("psql", [process.env.DB, "-X", "-At", "-c", sql], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (e) {
    throw new Error(String(e.stderr || "psql non riuscito").trim());
  }
}

if (process.env.DB) {
  prova("gite di dicembre uguali al database", () => {
    // dati.js è una copia: se una gita cambia data o meta (o viene rimandata), le immagini vanno rifatte.
    const { DICEMBRE } = require(path.join(QUI, "dati.js"));
    const db = psql("select string_agg(coalesce(postponed_to, event_date)::text || ' ' || replace(title, chr(10), ' '), ',' order by coalesce(postponed_to, event_date))"
      + " from public.social_events where kind = 'gita' and coalesce(postponed_to, event_date) between '2026-12-01' and '2026-12-31'");
    assert.strictEqual(DICEMBRE.map((g) => `${g.data} ${g.meta}`).join(","), db);
  });
  prova("evento nel database", () => {
    // Il sottotesto evidenzia il buffet in giallo (*…*) e ha una seconda riga: conta che ci sia la frase.
    const sql = "select place || ' | ' || (subtitle like '%Buffet e brindisi finale%')::text || ' | ' || coalesce(event_time,'') || ' | ' || coalesce(cta,'')"
      + " || ' | ' || (caption is not null and caption <> '')::text from public.social_events"
      + " where kind = 'evento' and event_date = '2026-11-25'";
    assert.strictEqual(psql(sql), "Circolo Way Assauto, corso Pietro Chiesa 20, Asti | true | 21:00 | Scopri di più | true");
  });
}

console.log(risultati.join("\n"));
process.exit(risultati.some((r) => r.startsWith("NO")) ? 1 : 0);
