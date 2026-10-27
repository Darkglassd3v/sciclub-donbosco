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
    const prova = (nome, sbagliati) => {
      const tutti = [...new Set(sbagliati)];
      r.push(`${nome}=${tutti.length ? `NO(${tutti.slice(0, 4).join(" / ")}${tutti.length > 4 ? ` e altri ${tutti.length - 4}` : ""})` : "ok"}`);
    };
    const descr = (x) => (x.id ? `#${x.id}` : x.tagName.toLowerCase() + [...x.classList].slice(0, 2).map((c) => "." + c).join(""))
      + (x.textContent.trim() ? ` «${x.textContent.trim().replace(/\s+/g, " ").slice(0, 24)}»` : "");
    const visibile = (x) => x.getClientRects().length && getComputedStyle(x).visibility !== "hidden";
    // Nascosti apposta: fuori schermo di molto (l'anteprima che si fotografa) o solo per il lettore di schermo.
    const apposta = (x) => x.closest(".is-sr-only, .fuori, [aria-hidden=true]");
    const W = document.documentElement.clientWidth;
    const elementi = [...document.querySelectorAll("body *")].filter((x) => visibile(x) && !apposta(x));

    const fuori = elementi.filter((x) => {
      const b = x.getBoundingClientRect();
      return b.width > 0 && ((b.right > W + 1 && b.left < W + 3000) || (b.left < -1 && b.right > -3000));
    });
    // Solo il più esterno: dentro una riga tagliata è tagliato tutto.
    prova("dentro", fuori.filter((x) => !fuori.includes(x.parentElement)).map(descr));

    // Contenuto tagliato o da scorrere di lato dentro una scheda o una tabella (gli importi di
    // Pagamenti): esce dal primo contenitore che taglia (overflow non visible, anche clip, che non
    // scorre e quindi non si vede da scrollWidth).
    const taglia = (x) => { for (let a = x.parentElement; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).overflowX !== "visible") return a; return null; };
    const tagliati = elementi.filter((x) => {
      const a = taglia(x);
      if (!a) return false;
      const b = x.getBoundingClientRect(), c = a.getBoundingClientRect();
      return b.width > 0 && (b.right > c.right + 1 || b.left < c.left - 1);
    });
    prova("tagliati", tagliati.filter((x) => !tagliati.includes(x.parentElement)).map(descr));

    const barra = document.querySelector(".barra");
    const fisse = elementi.filter((x) => getComputedStyle(x).position === "fixed" && x.getBoundingClientRect().height > 0
      && !fuori.includes(x) && x.getBoundingClientRect().top < innerHeight);
    const alte = (barra ? barra.offsetHeight : 0) + fisse.reduce((t, x) => t + x.getBoundingClientRect().height, 0);
    prova("fasce", alte > 160 ? [`${Math.round(alte)} px (barra ${barra ? barra.offsetHeight : 0}${fisse.map((x) => `, ${descr(x).split(" ")[0]} ${Math.round(x.getBoundingClientRect().height)}`).join("")})`] : []);

    const spezzate = [];
    const giro = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = giro.nextNode(), quante = 0; n && quante < 6000; n = giro.nextNode()) {
      const padre = n.parentElement;
      if (!padre || !visibile(padre) || apposta(padre) || padre.closest("script, style, option, select")) continue;
      for (const m of n.textContent.matchAll(/[^\s\-–—/]{4,}/gu)) {
        quante++;
        const intervallo = document.createRange();
        intervallo.setStart(n, m.index);
        intervallo.setEnd(n, m.index + m[0].length);
        const righe = new Set([...intervallo.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top)));
        if (righe.size > 1) spezzate.push(`«${m[0].slice(0, 24)}» in ${descr(padre).split(" ")[0]}`);
      }
    }
    prova("parole", spezzate);

    const uscite = [];
    for (const td of document.querySelectorAll("td")) {
      if (!visibile(td)) continue;
      const c = td.getBoundingClientRect();
      for (const x of td.querySelectorAll("*")) {
        if (!visibile(x)) continue;
        const b = x.getBoundingClientRect();
        if (b.left < c.left - 1 || b.right > c.right + 1) { uscite.push(descr(x)); break; }
      }
    }
    prova("celle", uscite);

    const piccoli = elementi.filter((x) => x.matches("button, .button, a.button, input[type=submit], input[type=button], [role=button], .barra-voci a")
      && x.getBoundingClientRect().height < 44);
    prova("pulsanti", piccoli.map((x) => `${descr(x)} ${Math.round(x.getBoundingClientRect().height)}px`));

    document.title = "RISULTATO " + r.join(" ");
  }, 5000));
}
