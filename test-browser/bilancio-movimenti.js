// Bilancio (bilancio.html): movimenti collegati a un post, spese anticipate e fatture in PDF (12/11).
// - Fase 1: la tendina «Post o campagna collegata» elenca i post della stagione
//   (ledger_social_events); scelto un post, il movimento lo salva in social_event_id e l'elenco
//   dice «Collegato a: <titolo>».
// - Fase 2: «Anticipata da» compare solo per le uscite e si salva in advanced_by. Nell'elenco la
//   spesa da rimborsare ha l'etichetta e il pulsante «Segna come rimborsata» (conferma in
//   finestra, poi refunded_on); quella rimborsata dice «Rimborsata il …». In alto il totale da
//   rimborsare.
// - Fase 3: la fattura in PDF si allega col movimento (set_ledger_receipt, in base64). Un file che
//   non è un PDF, o oltre i 2 MB, ferma il salvataggio con un messaggio. Nell'elenco «Apri la
//   fattura» per chi ce l'ha (ledger_receipt), «Allega la fattura» per chi non ce l'ha.
//   Se il movimento si salva ma la fattura no, l'avviso resta visibile (review del 12/11).
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const POSTS = [{ id: "P1", kind: "evento", title: "PRESCIISTICA", event_date: "2026-10-16" }];
  const ENTRIES = [
    { id: "E1", season: "2026-09-01T00:00:00+00:00", entry_date: "2026-10-20", kind: "USCITA", category: "Altro",
      description: "Pubblicità presciistica", quantity: 1, unit_price: 30, amount: 30, social_event_id: "P1",
      advanced_by: "ROSSI MARIO", refunded_on: null, created_at: "2026-10-20T10:00:00Z" },
    { id: "E2", season: "2026-09-01T00:00:00+00:00", entry_date: "2026-10-10", kind: "USCITA", category: "Pullman",
      description: null, quantity: 1, unit_price: 50, amount: 50, social_event_id: null,
      advanced_by: "BIANCHI ANNA", refunded_on: "2026-10-15", created_at: "2026-10-10T10:00:00Z" },
  ];
  const writes = [];
  const rpcs = [];
  FAKE.rpc.ledger_social_events = POSTS;
  FAKE.rpc.set_ledger_receipt = null;
  FAKE.rpc.ledger_receipt = [{ file_name: "fattura.pdf", content_base64: btoa("%PDF-1.4 prova") }];
  FAKE.risposta = (t, r) => {
    if (t === "season_balance") return [{ season: "2026-09-01T00:00:00+00:00", bank_current: 1000, members_collected: 0,
      other_income: 0, total_collected: 0, expenses: 80, bank_opening: 0, bank_opening_set: true }];
    if (t === "ledger_entries") {
      const writing = r.filtri.find((f) => f[0] === "insert" || f[0] === "update");
      if (writing) { writes.push([writing[0], writing[1], r.filtri.filter((f) => f[0] === "eq")]); return [{ id: "NUOVO" }]; }
      return ENTRIES;
    }
    if (t === "ledger_receipts") return [{ entry_id: "E2", file_name: "pullman.pdf" }];
    return [];
  };
  let failUpload = false;
  FAKE.errore = (t, r) => {
    if (t.startsWith("rpc:")) rpcs.push([t.slice(4), r.parametri]);
    return failUpload && t === "rpc:set_ledger_receipt" ? { message: "rete giù" } : null;
  };
  // Niente download veri durante la prova.
  URL.createObjectURL = () => "blob:prova";
  HTMLAnchorElement.prototype.click = function () { rpcs.push(["download", this.download]); };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const row = (id) => document.querySelector(`#elencoMovimenti td[data-id="${id}"]`)?.closest("tr");
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const pick = (input, file) => { const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; };
  // La lettura vera di un file è I/O: con --virtual-time-budget il tempo virtuale corre avanti
  // mentre aspetta, e la prova guarderebbe la pagina prima del controllo del PDF. Come il finto
  // Supabase per la rete, qui i file della prova si leggono subito dai byte con cui sono nati.
  const BYTES = new WeakMap();
  const makeFile = (text, name, type) => {
    const file = new File([text], name, { type });
    BYTES.set(file, new TextEncoder().encode(text));
    return file;
  };
  const realArrayBuffer = Blob.prototype.arrayBuffer;
  Blob.prototype.arrayBuffer = function () {
    return BYTES.has(this) ? Promise.resolve(BYTES.get(this).buffer) : realArrayBuffer.call(this);
  };
  const fill = (kind) => {
    document.querySelector(`input[name=mTipo][value=${kind}]`).click();
    el("mVoce").value = "Altro";
    el("mPrezzo").value = "25";
    el("mDescrizione").value = "Prova";
  };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    await wait(400);

    // Fase 1
    const options = [...(el("mPost")?.options || [])].map((o) => `${o.value}:${o.textContent.trim()}`);
    test("tendinaPost", options.length === 2 && options[0].startsWith(":") && options[1].startsWith("P1:") && options[1].includes("PRESCIISTICA"),
      `opzioni ${options.join(" | ")}`);
    test("collegato", text(row("E1")).includes("Collegato a: PRESCIISTICA"), `riga «${text(row("E1"))}»`);
    // Senza i campi nuovi le prove successive non hanno niente da usare.
    if (!el("mPost") || !el("mAnticipata") || !el("mFattura") || !row("E1")?.querySelector('[data-azione="rimborsa"]')) {
      document.title = "RISULTATO " + r.join(" ") + " campiNuovi=NO(mancano mPost, mAnticipata, mFattura o il pulsante del rimborso)";
      return;
    }

    // Fase 2
    document.querySelector("input[name=mTipo][value=ENTRATA]").click();
    const enteringHidden = el("campoAnticipata")?.hidden === true;
    document.querySelector("input[name=mTipo][value=USCITA]").click();
    test("anticipataSoloUscite", enteringHidden && el("campoAnticipata")?.hidden === false,
      `entrata nascosto ${enteringHidden}, uscita nascosto ${el("campoAnticipata")?.hidden}`);
    test("daRimborsare", text(row("E1")).includes("Da rimborsare a ROSSI MARIO") && Boolean(row("E1")?.querySelector('[data-azione="rimborsa"]')),
      `riga «${text(row("E1"))}»`);
    test("rimborsata", text(row("E2")).includes("Rimborsata il 15/10/2026") && !row("E2")?.querySelector('[data-azione="rimborsa"]'),
      `riga «${text(row("E2"))}»`);
    test("totaleDaRimborsare", !el("kpiDaRimborsare")?.hidden && text(el("kDaRimborsare")).includes("30,00"),
      `nascosto ${el("kpiDaRimborsare")?.hidden}, «${text(el("kDaRimborsare"))}»`);
    row("E1").querySelector('[data-azione="rimborsa"]').click();
    await wait(100);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await wait(400);
    const refund = writes.find((w) => w[0] === "update");
    test("segnaRimborsata", refund && /^\d{4}-\d{2}-\d{2}$/.test(refund[1].refunded_on) && refund[2].some((f) => f[1] === "id" && f[2] === "E1"),
      JSON.stringify(writes));

    // Fase 3: file non PDF, il movimento non si salva.
    writes.length = 0;
    fill("USCITA");
    el("mAnticipata").value = "Verdi Luca";
    pick(el("mFattura"), makeFile("ciao", "foto.jpg", "image/jpeg"));
    el("formMovimento").requestSubmit();
    await wait(400);
    test("rifiutaNonPdf", writes.length === 0 && /PDF/.test(text(el("erroreFattura"))) && !el("erroreFattura").hidden,
      `scritture ${writes.length}, messaggio «${text(el("erroreFattura"))}», non validi ${[...el("formMovimento").elements].filter((x) => x.validity && !x.validity.valid).map((x) => x.id || x.name).join(",")}`);

    // PDF giusto: movimento con post, anticipo e fattura.
    el("mPost").value = "P1";
    pick(el("mFattura"), makeFile("%PDF-1.4 fattura", "fattura.pdf", "application/pdf"));
    el("formMovimento").requestSubmit();
    await wait(600);
    const insert = writes.find((w) => w[0] === "insert")?.[1];
    test("salvaCollegamentoEAnticipo", insert?.social_event_id === "P1" && insert?.advanced_by === "VERDI LUCA",
      JSON.stringify(insert));
    const upload = rpcs.find((x) => x[0] === "set_ledger_receipt")?.[1];
    test("caricaFattura", upload?.entry_id === "NUOVO" && upload?.file_name === "fattura.pdf" && atob(upload?.content_base64 || "").startsWith("%PDF"),
      JSON.stringify(upload)?.slice(0, 120));

    // Elenco: aprire o allegare.
    test("apriEAllega", Boolean(row("E2")?.querySelector('[data-azione="fattura"]')) && Boolean(row("E1")?.querySelector('[data-azione="allega"]')),
      `E2 «${text(row("E2"))}», E1 «${text(row("E1"))}»`);
    row("E2").querySelector('[data-azione="fattura"]').click();
    await wait(400);
    test("apreFattura", rpcs.some((x) => x[0] === "ledger_receipt" && x[1]?.entry_id === "E2") && rpcs.some((x) => x[0] === "download"),
      JSON.stringify(rpcs.map((x) => x[0])));

    // «Allega la fattura» su un movimento già registrato.
    rpcs.length = 0;
    row("E1").querySelector('[data-azione="allega"]').click();
    pick(el("allegaFattura"), makeFile("%PDF-1.4 allegata", "allegata.pdf", "application/pdf"));
    el("allegaFattura").dispatchEvent(new Event("change"));
    await wait(400);
    const attached = rpcs.find((x) => x[0] === "set_ledger_receipt")?.[1];
    test("allegaDallaRiga", attached?.entry_id === "E1" && attached?.file_name === "allegata.pdf", JSON.stringify(attached)?.slice(0, 120));

    // Movimento salvato ma fattura non caricata: l'avviso resta, non lo copre «Movimento aggiunto».
    failUpload = true;
    fill("USCITA");
    pick(el("mFattura"), makeFile("%PDF-1.4 fattura", "fattura.pdf", "application/pdf"));
    el("formMovimento").requestSubmit();
    await wait(600);
    const toast = text(el("statusToast"));
    test("avvisoFatturaMancata", /non è stata allegata/.test(toast) && el("statusToast")?.classList.contains("is-warning"), `avviso «${toast}»`);
    failUpload = false;

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
