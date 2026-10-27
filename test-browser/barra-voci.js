// Barra (brand.css) con tutte le voci: il superadmin (dieci voci) e l'admin con tutti i permessi
// tranne Gestione, coi nomi scelti in Ruoli della produzione («Fogli pullman» al posto di
// «Stampe»). Richiesta del 27/10: barra più alta, larga quanto lo schermo se serve, voci che
// partono dal centro e vanno a capo invece di essere tagliate, pulsanti chiari e facili da
// premere, in stile Material (angoli poco arrotondati).
// Sul computer (oltre 768 px):
// - nessuna voce tagliata o fuori schermo, «Cerca socio» compresa, e niente scorrimento di lato:
//   con qualunque carattere (sui server di GitHub è più largo) le voci vanno su due righe;
// - ogni riga di voci è centrata; con una riga sola, al centro dello schermo se c'è posto accanto
//   al logo, se no si allunga verso destra;
// - pulsanti alti almeno 48 px, con gli angoli arrotondati al massimo di 12 px;
// - --barra-h è l'altezza vera della barra: le strisce delle sezioni (sticky) si attaccano sotto.
// Sul telefono (fino a 768 px): una riga sola, che scorre di lato con la barra di scorrimento.
{
  FINTO.risposta = (t) => (t === "nav_labels" ? [{ key: "stampe", label: "Fogli pullman" }] : []);
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const html = document.documentElement, barra = document.querySelector(".barra"), nav = document.querySelector(".barra-voci");
    const telefono = innerWidth <= 768;
    const esito = (nome, sbagliati) => r.push(`${nome}=${sbagliati.length ? `NO(${sbagliati.join(", ")})` : "ok"}`);
    const prova = (ruolo) => {
      const visibili = [...nav.children].filter((x) => x.getClientRects().length);
      const nomeDi = (x) => x.textContent.trim() || "A+";
      const n = nav.getBoundingClientRect();
      r.push(`${ruolo}Cerca=${visibili.some((x) => x.classList.contains("voce-cerca")) ? "ok" : "NO(nascosta)"}`);
      const tagliate = visibili.filter((x) => {
        const b = x.getBoundingClientRect();
        return b.right > Math.min(n.right, html.clientWidth) + 1 || b.left < Math.max(n.left, 0) - 1;
      }).map(nomeDi);
      // Le righe: voci con lo stesso bordo in alto.
      const righe = [];
      for (const x of visibili) {
        const b = x.getBoundingClientRect();
        const riga = righe.find((g) => Math.abs(g.top - b.top) < 4);
        if (riga) { riga.left = Math.min(riga.left, b.left); riga.right = Math.max(riga.right, b.right); }
        else righe.push({ top: b.top, left: b.left, right: b.right });
      }
      if (telefono) {
        esito(`${ruolo}UnaRiga`, righe.length === 1 ? [] : [`${righe.length} righe`]);
        esito(`${ruolo}Scorre`, !tagliate.length || nav.offsetHeight > nav.clientHeight ? [] : [`fuori ${tagliate.join(" ")} senza barra di scorrimento`]);
        return;
      }
      esito(`${ruolo}Tutte`, [...tagliate.map((t) => `${t} tagliata`), ...(nav.scrollWidth > nav.clientWidth + 1 ? ["scorre di lato"] : [])]);
      const centroNav = (n.left + n.right) / 2;
      const logo = document.querySelector(".barra-marchio").getBoundingClientRect().right;
      esito(`${ruolo}Centrate`, righe.flatMap((g, i) => {
        const centro = (g.left + g.right) / 2;
        if (Math.abs(centro - centroNav) > 2) return [`riga ${i + 1} a ${Math.round(centro)}, barra a ${Math.round(centroNav)}`];
        // Al centro dello schermo quando c'è posto fra il logo e il bordo; se no si allunga verso destra.
        const posto = html.clientWidth / 2 - (g.right - g.left) / 2 >= logo + 18;
        if (righe.length === 1 && posto && Math.abs(centro - html.clientWidth / 2) > 2) return [`riga a ${Math.round(centro)}, schermo a ${Math.round(html.clientWidth / 2)}`];
        return [];
      }));
      esito(`${ruolo}Pulsanti`, visibili.filter((x) => x.offsetHeight < 48 || parseFloat(getComputedStyle(x).borderTopLeftRadius) > 12)
        .map((x) => `${nomeDi(x)} ${x.offsetHeight}px raggio ${getComputedStyle(x).borderTopLeftRadius}`));
      const h = parseFloat(getComputedStyle(html).getPropertyValue("--barra-h"));
      esito(`${ruolo}Altezza`, Math.abs(h - barra.offsetHeight) <= 1 ? [] : [`--barra-h ${h}, barra ${barra.offsetHeight}`]);
    };
    r.push(`nomeRuoli=${[...nav.children].some((x) => x.textContent.trim() === "Fogli pullman") ? "ok" : "NO(nome di Ruoli non scritto)"}`);
    prova("superadmin");
    // L'admin sulla stessa pagina: ruolo e permessi come li scrive ricordaAccesso(), senza Gestione.
    html.dataset.ruolo = "admin";
    html.dataset.permessi = html.dataset.permessi.split(" ").filter((p) => p !== "gestione").join(" ");
    document.querySelector('.barra-voci [data-permesso="gestione"]').hidden = true;
    // Le voci cambiano senza ricaricare: la pagina ricalcola l'altezza come quando cambia la finestra.
    window.dispatchEvent(new Event("resize"));
    await aspetta(100);
    prova("admin");
    document.title = "RISULTATO " + r.join(" ");
  }, 1500));
}
