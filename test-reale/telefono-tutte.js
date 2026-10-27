// PAGINA: index.html admin.html assicurazione.html bilancio.html gestione.html impostazioni.html password.html riepilogo.html social.html stagione.html stampe.html utenti.html ricerca/index.html ricerca/gite.html
// LARGHEZZA: 390
// Ogni pagina su un telefono (390 × 844, simulato da chrome.js) coi dati veri della copia: la 3.0
// (piano del 27/10/2026, i difetti trovati con le foto delle pagine).
// - dentro: niente esce dallo schermo di lato (colonne fuori, voci della barra da scoprire
//   scorrendo);
// - tagliati: niente tagliato o da scorrere di lato dentro una scheda o una tabella (gli importi
//   di Pagamenti, le spunte di Ruoli);
// - fasce: la barra in cima e le fasce fisse (Totale/Residuo/Salva di Soci) prendono al massimo
//   160 px degli 844 dello schermo;
// - parole: nessuna parola spezzata a metà fra due righe (l'email in Utenti andava a capo una
//   lettera alla volta);
// - celle: in una tabella niente esce dalla sua cella (in Riepilogo il numero finiva sopra la voce);
// - pulsanti: alti almeno 44 px, da premere col dito.
{
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const test = (nome, wrongOnes) => {
      const all = [...new Set(wrongOnes)];
      r.push(`${nome}=${all.length ? `NO(${all.slice(0, 4).join(" / ")}${all.length > 4 ? ` e altri ${all.length - 4}` : ""})` : "ok"}`);
    };
    const descr = (x) => (x.id ? `#${x.id}` : x.tagName.toLowerCase() + [...x.classList].slice(0, 2).map((c) => "." + c).join(""))
      + (x.textContent.trim() ? ` «${x.textContent.trim().replace(/\s+/g, " ").slice(0, 24)}»` : "");
    const visible = (x) => x.getClientRects().length && getComputedStyle(x).visibility !== "hidden";
    // Nascosti apposta: fuori schermo di molto (l'anteprima che si fotografa) o solo per il lettore di schermo.
    const onPurpose = (x) => x.closest(".is-sr-only, .fuori, [aria-hidden=true]");
    const W = document.documentElement.clientWidth;
    const elements = [...document.querySelectorAll("body *")].filter((x) => visible(x) && !onPurpose(x));

    const outside = elements.filter((x) => {
      const b = x.getBoundingClientRect();
      return b.width > 0 && ((b.right > W + 1 && b.left < W + 3000) || (b.left < -1 && b.right > -3000));
    });
    // Solo il più esterno: dentro una riga tagliata è tagliato tutto.
    test("dentro", outside.filter((x) => !outside.includes(x.parentElement)).map(descr));

    // Contenuto tagliato o da scorrere di lato dentro una scheda o una tabella (gli importi di
    // Pagamenti): esce dal primo contenitore che taglia (overflow non visible, anche clip, che non
    // scorre e quindi non si vede da scrollWidth).
    const cut = (x) => { for (let a = x.parentElement; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).overflowX !== "visible") return a; return null; };
    const cutOnes = elements.filter((x) => {
      const a = cut(x);
      if (!a) return false;
      const b = x.getBoundingClientRect(), c = a.getBoundingClientRect();
      return b.width > 0 && (b.right > c.right + 1 || b.left < c.left - 1);
    });
    test("tagliati", cutOnes.filter((x) => !cutOnes.includes(x.parentElement)).map(descr));

    const bar = document.querySelector(".barra");
    const fixed = elements.filter((x) => x !== bar && getComputedStyle(x).position === "fixed" && x.getBoundingClientRect().height > 0
      && !outside.includes(x) && x.getBoundingClientRect().top < innerHeight);
    const tall = (bar ? bar.offsetHeight : 0) + fixed.reduce((t, x) => t + x.getBoundingClientRect().height, 0);
    test("fasce", tall > 160 ? [`${Math.round(tall)} px (barra ${bar ? bar.offsetHeight : 0}${fixed.map((x) => `, ${descr(x).split(" ")[0]} ${Math.round(x.getBoundingClientRect().height)}`).join("")})`] : []);

    const broken = [];
    const round = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = round.nextNode(), howMany = 0; n && howMany < 6000; n = round.nextNode()) {
      const padre = n.parentElement;
      if (!padre || !visible(padre) || onPurpose(padre) || padre.closest("script, style, option, select")) continue;
      for (const m of n.textContent.matchAll(/[^\s\-–—/]{4,}/gu)) {
        howMany++;
        const range = document.createRange();
        range.setStart(n, m.index);
        range.setEnd(n, m.index + m[0].length);
        const rows = new Set([...range.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top)));
        if (rows.size > 1) broken.push(`«${m[0].slice(0, 24)}» in ${descr(padre).split(" ")[0]}`);
      }
    }
    test("parole", broken);

    const outflows = [];
    for (const td of document.querySelectorAll("td")) {
      if (!visible(td)) continue;
      const c = td.getBoundingClientRect();
      for (const x of td.querySelectorAll("*")) {
        if (!visible(x)) continue;
        const b = x.getBoundingClientRect();
        if (b.left < c.left - 1 || b.right > c.right + 1) { outflows.push(descr(x)); break; }
      }
    }
    test("celle", outflows);

    const small = elements.filter((x) => x.matches("button, .button, a.button, input[type=submit], input[type=button], [role=button], .barra-voci a")
      && x.getBoundingClientRect().height < 44);
    test("pulsanti", small.map((x) => `${descr(x)} ${Math.round(x.getBoundingClientRect().height)}px`));

    document.title = "RISULTATO " + r.join(" ");
  }, 5000));
}
