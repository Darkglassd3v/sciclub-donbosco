// Social (social.html), colonne rilette dopo un salvataggio (dalla 3.12.1, analisi del database del 24/11/2026):
// salvare un post o segnarlo pubblicato rileggeva tutta la riga, foto in base64 compresa (fino a 400 kB), solo per
// rimetterla dov'era. Ora si rileggono le colonne dell'elenco (LIST_COLUMNS, senza la foto) e la foto resta quella
// del modulo: un salvataggio dopo l'altro non la perde, e «Duplica» di un post sponsor la porta nella copia.
{
  const PHOTO = "data:image/jpeg;base64,QUJD";
  const asked = [];
  const SAVED = { id: "P1", kind: "sponsor", title: "Prova", sponsor_id: "S1", stops: [], prices: [], facts: [], contacts: [],
    show_price: true, course: false, published_at: null, photo: PHOTO };
  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => ["insert", "update"].includes(f[0]));
    if (t === "social_events" && writing) {
      asked.push(r.colonne);
      // Come il database: la riga salvata, con la foto solo se la si chiede (select * o select()).
      const { photo, ...rest } = { ...SAVED, ...writing[1] };
      Object.assign(SAVED, writing[1]);
      return r.colonne === "*" ? { ...rest, photo } : rest;
    }
    if (t === "sponsors") return [{ id: "S1", name: "SANTERO", level: "oro", url: null, handle: null, logo: null, logo_dark: null,
      color_dark: "#0B3D2E", color_light: "#F4E9D0", color_accent: "#E6AC34" }];
    if (t === "social_events") return r.colonne === "photo" ? [{ photo: PHOTO }] : [];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await doOpen({ id: "P1", kind: "sponsor", title: "Prova", sponsor_id: "S1", stops: [], prices: [], facts: [], contacts: [],
        show_price: true, course: false, published_at: null });
      await wait(300);
      await save();
      await wait(200);
      await markPublished();
      await wait(200);
      test("senzaFoto", asked.length === 2 && asked.every((c) => c === LIST_COLUMNS), asked.map((c) => String(c).slice(0, 30)).join(" / "));
      test("fotoResta", isOpen?.photo === PHOTO, String(isOpen?.photo).slice(0, 40));
    } catch (e) { r.push(`eccezione=NO(${String(e?.stack || e).replace(/\s+/g, " ").slice(0, 260)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
