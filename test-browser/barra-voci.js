// Barra (brand.css) con tutte le voci, a 1280 px. Il superadmin (dieci voci) e l'admin con tutti
// i permessi tranne Gestione vedono anche «Cerca socio», e ogni voce, «A+» ed «Esci» compresi,
// sta dentro la barra: la barra scorre di lato con la barra di scorrimento nascosta, e una voce
// che esce dal bordo non si vede proprio.
{
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const html = document.documentElement, nav = document.querySelector(".barra-voci");
    const prova = (nome) => {
      const n = nav.getBoundingClientRect();
      const visibili = [...nav.children].filter((x) => x.getClientRects().length);
      const fuori = visibili.filter((x) => { const b = x.getBoundingClientRect(); return b.right > n.right + 1 || b.left < n.left - 1; })
        .map((x) => x.textContent.trim() || "A+");
      r.push(`${nome}Cerca=${visibili.some((x) => x.classList.contains("voce-cerca")) ? "ok" : "NO(nascosta)"}`,
        `${nome}Dentro=${fuori.length ? `NO(fuori ${fuori.join(", ")})` : "ok"}`);
    };
    prova("superadmin");
    // L'admin sulla stessa pagina: ruolo e permessi come li scrive ricordaAccesso(), senza Gestione.
    html.dataset.ruolo = "admin";
    html.dataset.permessi = html.dataset.permessi.split(" ").filter((p) => p !== "gestione").join(" ");
    document.querySelector('.barra-voci [data-permesso="gestione"]').hidden = true;
    prova("admin");
    document.title = "RISULTATO " + r.join(" ");
  }, 1500));
}
