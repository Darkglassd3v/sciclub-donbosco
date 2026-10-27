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
    const test = (nome, wrongOnes) => {
      const all = [...new Set(wrongOnes)];
      r.push(`${nome}=${all.length ? `NO(${all.slice(0, 4).join(" / ")}${all.length > 4 ? ` e altri ${all.length - 4}` : ""})` : "ok"}`);
    };
    const descr = (x) => x.id ? `#${x.id}` : x.tagName.toLowerCase() + [...x.classList].map((c) => "." + c).join("");

    const zone = document.querySelectorAll("main, [role=main]").length;
    test("main", zone === 1 ? [] : [`${zone} zone principali`]);

    const fields = [...document.querySelectorAll("input, select, textarea")]
      .filter((c) => !["hidden", "submit", "button", "reset"].includes(c.type));
    test("campiConNome", fields.filter((c) => !(c.labels?.length || c.getAttribute("aria-label")?.trim()
      || c.getAttribute("aria-labelledby") || c.title?.trim())).map(descr));

    test("linkSottolineati", [...document.querySelectorAll("a[href]")].filter((a) => {
      if (a.closest(".button, .tag, nav, .barra-voci, .tabs") || a.classList.contains("button")) return false;
      const block = a.closest("p, li, td, label, .help");
      if (!block || block.textContent.trim() === a.textContent.trim()) return false;   // il link è tutto il testo
      return !getComputedStyle(a).textDecorationLine.includes("underline");
    }).map((a) => `${descr(a.closest("p, li, td, label, .help"))} «${a.textContent.trim().slice(0, 30)}»`));

    const cells = [];
    for (const t of document.querySelectorAll("table")) {
      const row = t.tHead?.rows[t.tHead.rows.length - 1];
      if (!row) continue;
      const names = [];
      for (const th of row.cells) for (let i = 0; i < th.colSpan; i++) names.push(th.textContent.trim() || th.getAttribute("aria-label")?.trim() || "");
      for (const part of [...t.tBodies, t.tFoot].filter(Boolean)) {
        for (const tr of part.rows) {
          let col = 0;
          for (const td of tr.cells) {
            if (td.tagName === "TD" && (td.textContent.trim() || td.children.length) && !names[col]) cells.push(`${descr(t)} colonna ${col + 1}`);
            col += td.colSpan;
          }
        }
      }
    }
    test("celleConIntestazione", cells);

    document.title = "RISULTATO " + r.join(" ");
  }, 5000));
}
