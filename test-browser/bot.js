// Bot Telegram (bot.html), dalla 3.16: il superadmin decide dal sito chi può usare il bot.
// - In alto il link al bot.
// - «Numeri abilitati»: nome, telefono e se la chat è già attiva. «Aggiungi» scrive il numero solo in cifre,
//   senza +39 (come telegram_phone_key nel database) e il nome in maiuscolo; un numero sbagliato non si scrive.
// - «Togli» chiede due conferme in finestra; solo dopo la seconda il numero si cancella (e con lui la sua chat).
// - «Chat attive»: «Togli accesso» su una chat entrata col numero toglie il numero (se no basterebbe condividerlo
//   di nuovo per rientrare); su una chat abilitata col numero della chat toglie la chat. «Aggiungi col numero
//   della chat» abilita chi non condivide il telefono.
// - «Ultime domande»: il registro, con chi ha scritto.
// - A 500 px le tabelle diventano schede e niente esce dallo schermo.
{
  const WRITES = [];
  let phones = [
    { phone: "3331234567", name: "ROSSI MARIO", created_at: "2026-11-26T10:00:00Z" },
    { phone: "3339876543", name: "BIANCHI LUCA", created_at: "2026-11-26T10:00:00Z" },
  ];
  let chats = [
    { chat_id: 111, name: "ROSSI MARIO", phone: "3331234567", created_at: "2026-11-26T11:00:00Z" },
    { chat_id: 222, name: "VERDI ANNA", phone: null, created_at: "2026-11-26T12:00:00Z" },
  ];
  const queries = [
    { chat_id: 111, text: "/liberi", allowed: true, at: "2026-11-27T09:00:00Z" },
    { chat_id: 999, text: "/start", allowed: false, at: "2026-11-27T08:00:00Z" },
  ];
  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
    if (writing) {
      const eq = r.filtri.find((f) => f[0] === "eq");
      WRITES.push({ t, kind: writing[0], payload: writing[1], eq: eq && [eq[1], eq[2]] });
      if (writing[0] === "delete" && t === "telegram_phones") {
        phones = phones.filter((p) => p.phone !== eq[2]);
        chats = chats.filter((c) => c.phone !== eq[2]);
      }
      if (writing[0] === "delete" && t === "telegram_users") chats = chats.filter((c) => c.chat_id !== eq[2]);
      return [];
    }
    if (t === "telegram_phones") return phones;
    if (t === "telegram_users") return chats;
    if (t === "telegram_queries") return queries;
    return [];
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const shown = (node) => Boolean(node) && node.getClientRects().length > 0;
  const dialogOpen = () => document.querySelector("dialog#finestraDomanda[open]");
  const confirm = async () => { dialogOpen()?.querySelector("[data-si]")?.click(); await wait(300); };
  const type = (id, value) => { const f = document.getElementById(id); f.value = value; f.dispatchEvent(new Event("input", { bubbles: true })); };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    let step = "inizio";
    try {
      const link = document.querySelector('a[href="https://t.me/sciclubdonboscoasti_bot"]');
      test("link", shown(link), `link ${Boolean(link)}`);

      const phoneRow = (p) => document.querySelector(`#tabellaNumeri tr[data-phone="${p}"]`);
      const chatRow = (c) => document.querySelector(`#tabellaChat tr[data-chat="${c}"]`);
      test("numeri", clean(phoneRow("3331234567")).includes("ROSSI MARIO") && /attiva/i.test(clean(phoneRow("3331234567")))
        && /non ancora/i.test(clean(phoneRow("3339876543"))),
        `«${clean(phoneRow("3331234567"))}» / «${clean(phoneRow("3339876543"))}»`);
      test("chat", clean(chatRow(111)).includes("3331234567") && /numero della chat/i.test(clean(chatRow(222))),
        `«${clean(chatRow(111))}» / «${clean(chatRow(222))}»`);
      const queryRows = document.querySelectorAll("#tabellaDomande tr[data-chat]");
      test("domande", queryRows.length === 2 && clean(queryRows[0]).includes("ROSSI MARIO") && clean(queryRows[0]).includes("/liberi")
        && /non abilitata/i.test(clean(queryRows[1])) && clean(queryRows[1]).includes("999"),
        `${queryRows.length} righe: «${clean(queryRows[0])}» / «${clean(queryRows[1])}»`);

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
      type("nuovoTelefono", "+39 347 555 1234");
      document.getElementById("btnAggiungiNumero").click();
      await wait(400);
      const added = WRITES.slice(before).find((w) => w.t === "telegram_phones" && w.kind === "insert");
      test("aggiungi", added?.payload?.phone === "3475551234" && added?.payload?.name === "NERI PAOLO", `scritto ${JSON.stringify(added)}`);

      step = "togli numero";
      before = WRITES.length;
      phoneRow("3339876543")?.querySelector(".togli-numero")?.click();
      await wait(200);
      const first = Boolean(dialogOpen());
      await confirm();
      const second = Boolean(dialogOpen()) && WRITES.length === before;
      await confirm();
      const removed = WRITES.slice(before).find((w) => w.kind === "delete");
      test("togliDueConferme", first && second && removed?.t === "telegram_phones" && removed.eq?.[1] === "3339876543",
        `prima ${first}, seconda ${second}, cancellato ${JSON.stringify(removed)}`);

      step = "annulla";
      before = WRITES.length;
      phoneRow("3331234567")?.querySelector(".togli-numero")?.click();
      await wait(200);
      dialogOpen()?.querySelector("[data-no]")?.click();
      await wait(300);
      test("annulla", !dialogOpen() && WRITES.length === before && Boolean(phoneRow("3331234567")), `scritto ${JSON.stringify(WRITES.slice(before))}`);

      step = "togli chat";
      before = WRITES.length;
      chatRow(222)?.querySelector(".togli-chat")?.click();
      await wait(200);
      await confirm();
      await confirm();
      const chatGone = WRITES.slice(before).find((w) => w.kind === "delete");
      test("togliChat", chatGone?.t === "telegram_users" && chatGone.eq?.[0] === "chat_id" && chatGone.eq?.[1] === 222,
        `cancellato ${JSON.stringify(chatGone)}`);
      before = WRITES.length;
      chatRow(111)?.querySelector(".togli-chat")?.click();
      await wait(200);
      await confirm();
      await confirm();
      const viaPhone = WRITES.slice(before).find((w) => w.kind === "delete");
      test("togliChatColNumero", viaPhone?.t === "telegram_phones" && viaPhone.eq?.[1] === "3331234567" && !chatRow(111),
        `cancellato ${JSON.stringify(viaPhone)}, riga ${Boolean(chatRow(111))}`);

      step = "aggiungi chat";
      before = WRITES.length;
      type("chatNome", "Gialli Sara");
      type("chatId", "8");
      document.getElementById("btnAggiungiChat").click();
      await wait(400);
      const newChat = WRITES.slice(before).find((w) => w.t === "telegram_users" && w.kind === "insert");
      test("aggiungiChat", newChat?.payload?.chat_id === 8 && newChat?.payload?.name === "GIALLI SARA", `scritto ${JSON.stringify(newChat)}`);
    } catch (e) { r.push(`eccezione=NO(${step}: ${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 600));
}
