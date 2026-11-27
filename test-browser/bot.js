// Bot Telegram (bot.html), dalla 3.16: il superadmin decide dal sito chi può usare il bot.
// - In alto il link al bot.
// - «Numeri abilitati»: nome, telefono e se la chat è già attiva. «Aggiungi» scrive il numero solo in cifre,
//   senza +39 (come telegram_phone_key nel database) e il nome in maiuscolo; un numero sbagliato, o già in lista
//   in un'altra forma (393…), non si scrive. Invio nel campo vale come il pulsante; due clic scrivono una volta.
// - «Togli» chiede due conferme in finestra; solo dopo la seconda il numero si cancella (e con lui la sua chat).
//   Il pulsante dice di chi è (aria-label); dopo la cancellazione il fuoco resta nel riquadro.
// - «Chat attive»: «Togli accesso» su una chat entrata col numero toglie il numero (se no basterebbe condividerlo
//   di nuovo per rientrare), anche per le chat attivate prima della 3.16, che il numero lo ritrovano dal nome;
//   su una chat abilitata col numero della chat toglie la chat. «Aggiungi col numero della chat» abilita chi non
//   condivide il telefono; i numeri negativi (gruppi) no.
// - «Ultime domande»: il registro, con chi ha scritto.
// - Un nome con dell'HTML si legge com'è scritto. Una cancellazione che non toglie niente lo dice. Errori di
//   caricamento ed elenchi vuoti hanno il loro messaggio.
// - A 500 px le tabelle diventano schede e niente esce dallo schermo.
{
  const WRITES = [];
  const HOSTILE = '<img src=x onerror="window.XSS=1">';
  let phones = [
    { phone: "3331234567", name: "ROSSI MARIO", created_at: "2026-11-26T10:00:00Z" },
    { phone: "3339876543", name: "BIANCHI LUCA", created_at: "2026-11-26T10:00:00Z" },
    { phone: "3335550000", name: "GIALLO PIERO", created_at: "2026-11-20T10:00:00Z" },
    { phone: "393335559999", name: HOSTILE, created_at: "2026-11-20T10:00:00Z" },
    // Due numeri con lo stesso nome: la chat attivata prima della 3.16 non sa quale dei due è il suo.
    { phone: "3336660001", name: "OMONIMO", created_at: "2026-11-20T10:00:00Z" },
    { phone: "3336660002", name: "OMONIMO", created_at: "2026-11-20T10:00:00Z" },
  ];
  let chats = [
    { chat_id: 111, name: "ROSSI MARIO", phone: "3331234567", created_at: "2026-11-26T11:00:00Z" },
    { chat_id: 222, name: "VERDI ANNA", phone: null, created_at: "2026-11-26T12:00:00Z" },
    // Attivata col numero prima della 3.16: il numero non è scritto, il nome è quello del numero.
    { chat_id: 333, name: "GIALLO PIERO", phone: null, created_at: "2026-11-20T11:00:00Z" },
    { chat_id: 444, name: "OMONIMO", phone: null, created_at: "2026-11-20T11:00:00Z" },
  ];
  const queries = [
    { chat_id: 111, text: "/liberi", allowed: true, at: "2026-11-27T09:00:00Z" },
    { chat_id: 999, text: "/start", allowed: false, at: "2026-11-27T08:00:00Z" },
  ];
  let deleteNothing = false, failLoad = false;
  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
    if (writing) {
      const filter = r.filtri.find((f) => f[0] === "eq" || f[0] === "in");
      const values = filter ? (filter[0] === "in" ? filter[2] : [filter[2]]) : [];
      WRITES.push({ t, kind: writing[0], payload: writing[1], column: filter?.[1], values });
      if (writing[0] !== "delete") return [writing[1]];
      if (deleteNothing) return [];
      const gone = (t === "telegram_phones" ? phones : chats).filter((x) => values.includes(x[filter[1]]));
      if (t === "telegram_phones") {
        phones = phones.filter((p) => !values.includes(p.phone));
        chats = chats.filter((c) => !values.includes(c.phone));
      } else chats = chats.filter((c) => !values.includes(c.chat_id));
      return gone;
    }
    if (t === "telegram_phones") return phones;
    if (t === "telegram_users") return chats;
    if (t === "telegram_queries") return queries;
    return [];
  };
  FAKE.errore = (t) => (failLoad && t === "telegram_queries" ? { message: "rete assente" } : null);

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const shown = (node) => Boolean(node) && node.getClientRects().length > 0;
  const dialogOpen = () => document.querySelector("dialog#finestraDomanda[open]");
  const confirm = async () => { dialogOpen()?.querySelector("[data-si]")?.click(); await wait(150); };
  const type = (id, value) => { const f = document.getElementById(id); f.value = value; f.dispatchEvent(new Event("input", { bubbles: true })); };
  const toast = () => clean(document.getElementById("statusToast")) || clean(document.querySelector(".notification"));
  const deletes = (from) => WRITES.slice(from).filter((w) => w.kind === "delete");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    let step = "inizio";
    try {
      const link = document.querySelector('a[href="https://t.me/sciclubdonboscoasti_bot"]');
      test("link", shown(link), `link ${Boolean(link)}`);

      const phoneRow = (p) => document.querySelector(`#tabellaNumeri tr[data-phone="${p}"]`);
      const chatRow = (c) => document.querySelector(`#tabellaChat tr[data-chat="${c}"]`);
      const chatCell = (p) => clean(phoneRow(p)?.querySelector('td[data-etichetta="Chat"]'));
      test("numeri", clean(phoneRow("3331234567")).includes("ROSSI MARIO") && chatCell("3331234567") === "Attiva"
        && chatCell("3339876543") === "Non ancora attivata" && chatCell("3335550000") === "Attiva",
        `ROSSI «${chatCell("3331234567")}», BIANCHI «${chatCell("3339876543")}», GIALLO «${chatCell("3335550000")}»`);
      test("chat", clean(chatRow(111)).includes("3331234567") && /numero della chat/i.test(clean(chatRow(222)))
        && clean(chatRow(333)).includes("3335550000"),
        `«${clean(chatRow(111))}» / «${clean(chatRow(222))}» / «${clean(chatRow(333))}»`);
      const queryRows = document.querySelectorAll("#tabellaDomande tr[data-chat]");
      test("domande", queryRows.length === 2 && clean(queryRows[0]).includes("ROSSI MARIO") && clean(queryRows[0]).includes("/liberi")
        && /non abilitata/i.test(clean(queryRows[1])) && clean(queryRows[1]).includes("999"),
        `${queryRows.length} righe: «${clean(queryRows[0])}» / «${clean(queryRows[1])}»`);
      test("htmlComeTesto", window.XSS === undefined && clean(phoneRow("393335559999")).includes(HOSTILE),
        `XSS ${window.XSS}, riga «${clean(phoneRow("393335559999"))}»`);
      const button = phoneRow("3331234567")?.querySelector(".togli-numero");
      test("etichette", button?.getAttribute("aria-label") === "Togli ROSSI MARIO"
        && chatRow(222)?.querySelector(".togli-chat")?.getAttribute("aria-label") === "Togli accesso VERDI ANNA",
        `«${button?.getAttribute("aria-label")}», «${chatRow(222)?.querySelector(".togli-chat")?.getAttribute("aria-label")}»`);

      if (innerWidth <= 600) {
        const cells = document.querySelectorAll("#tabellaNumeri td[data-etichetta], #tabellaChat td[data-etichetta]");
        const outside = [...document.querySelectorAll("#contenuto button, #contenuto input")]
          .filter((x) => shown(x) && x.getBoundingClientRect().right > innerWidth + 1).map((x) => x.id || x.textContent.trim());
        test("telefono", cells.length >= 4 && document.documentElement.scrollWidth <= innerWidth + 1 && !outside.length,
          `${cells.length} celle con etichetta, larghezza ${document.documentElement.scrollWidth}/${innerWidth}, fuori ${outside.join(" ")}`);
      }

      step = "aggiungi";
      let before = WRITES.length;
      type("nuovoNome", "Neri Paolo");
      type("nuovoTelefono", "12");
      document.getElementById("btnAggiungiNumero").click();
      await wait(300);
      test("numeroSbagliato", WRITES.length === before, `scritto ${JSON.stringify(WRITES.slice(before))}`);
      type("nuovoTelefono", "333 555 9999");
      document.getElementById("btnAggiungiNumero").click();
      await wait(300);
      test("giaInAltraForma", WRITES.length === before && /già/.test(toast()), `scritto ${JSON.stringify(WRITES.slice(before))}, avviso «${toast()}»`);
      type("nuovoTelefono", "+39 347 555 1234");
      document.getElementById("btnAggiungiNumero").click();
      document.getElementById("btnAggiungiNumero").click();
      await wait(250);
      const added = WRITES.slice(before).filter((w) => w.t === "telegram_phones" && w.kind === "insert");
      test("aggiungi", added.length === 1 && added[0].payload?.phone === "3475551234" && added[0].payload?.name === "NERI PAOLO",
        `scritto ${JSON.stringify(added)}`);

      step = "invio";
      before = WRITES.length;
      type("chatNome", "Gialli Sara");
      type("chatId", "8");
      document.getElementById("chatId").form?.requestSubmit();
      await wait(250);
      const newChat = WRITES.slice(before).find((w) => w.t === "telegram_users" && w.kind === "insert");
      test("aggiungiChatConInvio", newChat?.payload?.chat_id === 8 && newChat?.payload?.name === "GIALLI SARA", `scritto ${JSON.stringify(newChat)}`);
      before = WRITES.length;
      type("chatNome", "Gruppo Direttivo");
      type("chatId", "-100123");
      document.getElementById("btnAggiungiChat").click();
      await wait(300);
      test("gruppoNo", WRITES.length === before, `scritto ${JSON.stringify(WRITES.slice(before))}`);

      step = "togli numero";
      before = WRITES.length;
      phoneRow("3339876543")?.querySelector(".togli-numero")?.click();
      await wait(100);
      const first = Boolean(dialogOpen());
      await confirm();
      const second = Boolean(dialogOpen()) && WRITES.length === before;
      await confirm();
      await wait(100);
      const removed = deletes(before)[0];
      test("togliDueConferme", first && second && removed?.t === "telegram_phones" && removed.values.includes("3339876543"),
        `prima ${first}, seconda ${second}, cancellato ${JSON.stringify(removed)}`);
      test("fuocoNelRiquadro", document.activeElement?.closest(".riquadro")?.contains(document.getElementById("tabellaNumeri")) === true,
        `fuoco su ${document.activeElement?.tagName} «${clean(document.activeElement).slice(0, 40)}»`);

      step = "annulla";
      before = WRITES.length;
      phoneRow("3331234567")?.querySelector(".togli-numero")?.click();
      await wait(100);
      dialogOpen()?.querySelector("[data-no]")?.click();
      await wait(300);
      test("annulla", !dialogOpen() && WRITES.length === before && Boolean(phoneRow("3331234567")), `scritto ${JSON.stringify(WRITES.slice(before))}`);

      step = "togli chat";
      before = WRITES.length;
      chatRow(222)?.querySelector(".togli-chat")?.click();
      await wait(100);
      await confirm();
      await confirm();
      const chatGone = deletes(before)[0];
      test("togliChat", chatGone?.t === "telegram_users" && chatGone.column === "chat_id" && chatGone.values.includes(222),
        `cancellato ${JSON.stringify(chatGone)}`);
      before = WRITES.length;
      chatRow(111)?.querySelector(".togli-chat")?.click();
      await wait(100);
      await confirm();
      await confirm();
      const viaPhone = deletes(before)[0];
      test("togliChatColNumero", viaPhone?.t === "telegram_phones" && viaPhone.values.includes("3331234567") && !chatRow(111),
        `cancellato ${JSON.stringify(viaPhone)}, riga ${Boolean(chatRow(111))}`);
      before = WRITES.length;
      chatRow(333)?.querySelector(".togli-chat")?.click();
      await wait(100);
      await confirm();
      await confirm();
      const legacy = deletes(before);
      test("togliChatVecchia", legacy.some((w) => w.t === "telegram_phones" && w.values.includes("3335550000"))
        && !chatRow(333) && !phoneRow("3335550000"),
        `cancellati ${JSON.stringify(legacy)}, chat ${Boolean(chatRow(333))}, numero ${Boolean(phoneRow("3335550000"))}`);

      // Con due numeri dello stesso nome, togliere la chat toglie anche quei numeri: se no condividendone uno
      // rientrerebbe. La chat va prima dei numeri, così un errore a metà non lascia la chat senza numero e attiva.
      before = WRITES.length;
      chatRow(444)?.querySelector(".togli-chat")?.click();
      await wait(100);
      const listed = clean(dialogOpen());
      await confirm();
      await confirm();
      const homonyms = deletes(before);
      test("togliChatOmonimi", /3336660001/.test(listed) && homonyms[0]?.t === "telegram_users" && homonyms[0].values.includes(444)
        && homonyms.some((w) => w.t === "telegram_phones" && w.values.includes("3336660001") && w.values.includes("3336660002")),
        `finestra «${listed.slice(0, 120)}», cancellati ${JSON.stringify(homonyms)}`);

      step = "niente da togliere";
      deleteNothing = true;
      phoneRow("393335559999")?.querySelector(".togli-numero")?.click();
      await wait(100);
      await confirm();
      await confirm();
      await wait(100);
      deleteNothing = false;
      test("nienteTolto", /non tolto|niente/i.test(toast()) && !/tolto dal bot/.test(toast()), `avviso «${toast()}»`);

      step = "vuoti ed errori";
      failLoad = true;
      await load();
      failLoad = false;
      test("erroreCaricamento", /rete assente/.test(toast()), `avviso «${toast()}»`);
      phones = [];
      chats = [];
      await load();
      test("vuoti", /Nessun numero abilitato/.test(clean(document.getElementById("tabellaNumeri")))
        && /Nessuna chat attiva/.test(clean(document.getElementById("tabellaChat"))),
        `«${clean(document.getElementById("tabellaNumeri"))}» / «${clean(document.getElementById("tabellaChat"))}»`);
    } catch (e) { r.push(`eccezione=NO(${step}: ${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 600));
}
