// PAGINA: index.html admin.html assicurazione.html bilancio.html gestione.html impostazioni.html password.html riepilogo.html social.html stagione.html stampe.html utenti.html ricerca/index.html ricerca/gite.html
// Accessibilità (WCAG 2.2) di ogni pagina coi dati veri, i difetti trovati da Lighthouse il 23/10/2026:
// - una sola zona principale (<main> o role="main"): col lettore di schermo si salta il menu;
// - ogni campo e ogni tendina ha un nome (label, aria-label o aria-labelledby), anche quelli
//   scritti dal JS (es. il ruolo di ogni account in Utenti);
// - i link dentro un testo sono sottolineati: il blu sul testo scuro ha contrasto 1,11:1;
// - in una tabella ogni cella piena ha un'intestazione con un nome, anche la colonna dei pulsanti.
{
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const prova = (nome, sbagliati) => {
      const tutti = [...new Set(sbagliati)];
      r.push(`${nome}=${tutti.length ? `NO(${tutti.slice(0, 4).join(" / ")}${tutti.length > 4 ? ` e altri ${tutti.length - 4}` : ""})` : "ok"}`);
    };
    const descr = (x) => x.id ? `#${x.id}` : x.tagName.toLowerCase() + [...x.classList].map((c) => "." + c).join("");

    const zone = document.querySelectorAll("main, [role=main]").length;
    prova("main", zone === 1 ? [] : [`${zone} zone principali`]);

    const campi = [...document.querySelectorAll("input, select, textarea")]
      .filter((c) => !["hidden", "submit", "button", "reset"].includes(c.type));
    prova("campiConNome", campi.filter((c) => !(c.labels?.length || c.getAttribute("aria-label")?.trim()
      || c.getAttribute("aria-labelledby") || c.title?.trim())).map(descr));

    prova("linkSottolineati", [...document.querySelectorAll("a[href]")].filter((a) => {
      if (a.closest(".button, .tag, nav, .barra-voci, .tabs, .schede-gestione, .schede-social") || a.classList.contains("button")) return false;
      const blocco = a.closest("p, li, td, label, .help");
      if (!blocco || blocco.textContent.trim() === a.textContent.trim()) return false;   // il link è tutto il testo
      return !getComputedStyle(a).textDecorationLine.includes("underline");
    }).map((a) => `${descr(a.closest("p, li, td, label, .help"))} «${a.textContent.trim().slice(0, 30)}»`));

    const celle = [];
    for (const t of document.querySelectorAll("table")) {
      const riga = t.tHead?.rows[t.tHead.rows.length - 1];
      if (!riga) continue;
      const nomi = [];
      for (const th of riga.cells) for (let i = 0; i < th.colSpan; i++) nomi.push(th.textContent.trim() || th.getAttribute("aria-label")?.trim() || "");
      for (const parte of [...t.tBodies, t.tFoot].filter(Boolean)) {
        for (const tr of parte.rows) {
          let col = 0;
          for (const td of tr.cells) {
            if (td.tagName === "TD" && (td.textContent.trim() || td.children.length) && !nomi[col]) celle.push(`${descr(t)} colonna ${col + 1}`);
            col += td.colSpan;
          }
        }
      }
    }
    prova("celleConIntestazione", celle);

    document.title = "RISULTATO " + r.join(" ");
  }, 5000));
}
