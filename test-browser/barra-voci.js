// Barra (brand.css) con tutte le voci. Il superadmin (dieci voci) e l'admin con tutti i
// permessi tranne Gestione vedono anche «Cerca socio». A 1280 px ogni voce, «A+» ed «Esci»
// compresi, sta dentro la barra, anche coi nomi scelti in Ruoli che ha la produzione
// («Fogli pullman» al posto di «Stampe»). Più stretto (schermo piccolo, zoom al 125%) la
// barra scorre di lato, e allora la barra di scorrimento si vede: nascosta, chi usa il mouse
// non saprebbe che «Esci» c'è.
{
  FINTO.risposta = (t) => (t === "nav_labels" ? [{ key: "stampe", label: "Fogli pullman" }] : []);
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const html = document.documentElement, nav = document.querySelector(".barra-voci");
    const largo = innerWidth >= 1260;
    const prova = (nome) => {
      const n = nav.getBoundingClientRect();
      const visibili = [...nav.children].filter((x) => x.getClientRects().length);
      const fuori = visibili.filter((x) => { const b = x.getBoundingClientRect(); return b.right > n.right + 1 || b.left < n.left - 1; })
        .map((x) => x.textContent.trim() || "A+");
      r.push(`${nome}Cerca=${visibili.some((x) => x.classList.contains("voce-cerca")) ? "ok" : "NO(nascosta)"}`);
      if (largo) r.push(`${nome}Dentro=${fuori.length ? `NO(fuori ${fuori.join(", ")})` : "ok"}`);
      else r.push(`${nome}Scorre=${!fuori.length || nav.offsetHeight > nav.clientHeight ? "ok" : `NO(fuori ${fuori.join(", ")} senza barra di scorrimento)`}`);
    };
    r.push(`nomeRuoli=${[...nav.children].some((x) => x.textContent.trim() === "Fogli pullman") ? "ok" : "NO(nome di Ruoli non scritto)"}`);
    prova("superadmin");
    // L'admin sulla stessa pagina: ruolo e permessi come li scrive ricordaAccesso(), senza Gestione.
    html.dataset.ruolo = "admin";
    html.dataset.permessi = html.dataset.permessi.split(" ").filter((p) => p !== "gestione").join(" ");
    document.querySelector('.barra-voci [data-permesso="gestione"]').hidden = true;
    prova("admin");
    document.title = "RISULTATO " + r.join(" ");
  }, 1500));
}
