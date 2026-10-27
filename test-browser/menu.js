// Il menu della 3.0 (27/10/2026): sul computer una colonna a sinistra, sul telefono un pannello
// che si apre col pulsante «Menu». In alto a destra chi è entrato.
// - nome: si vedono l'email e il ruolo di chi è entrato (in alto, sul telefono nel menu aperto);
// - gruppi: Gestione e Social si aprono e chiudono (details/summary); quello della pagina aperta
//   nasce aperto, con la sua voce segnata (aria-current), gli altri chiusi;
// - computer (oltre 768 px): il menu si vede sempre, a sinistra, senza pulsante «Menu»;
// - telefono: il menu è chiuso e il pulsante «Menu» dice aria-expanded=false; premuto, il pannello
//   si apre dentro lo schermo con tutte le voci, A+ ed Esci; Esc lo chiude e il fuoco torna al
//   pulsante.
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { const r = []; try {
    const esito = (nome, sbagliato) => r.push(`${nome}=${sbagliato ? `NO(${sbagliato})` : "ok"}`);
    const menu = document.querySelector(".barra-voci"), bottone = document.querySelector(".apri-menu");
    const dentro = (x) => { const b = x.getBoundingClientRect(); return b.width > 0 && b.left >= -1 && b.right <= innerWidth + 1; };
    const pagina = location.pathname.split("/").pop().replace(/^prova-menu.*/, "");

    // Chi è entrato: in alto sul computer, in fondo al menu aperto sul telefono.
    const nome = () => {
      const utente = [...document.querySelectorAll(".barra-utente")].find((x) => x.getClientRects().length && dentro(x));
      esito("nome", utente && utente.textContent.includes("prova@sciclub.it") && /superadmin/i.test(utente.textContent)
        ? "" : `«${utente ? utente.textContent.trim() : "non si vede"}»`);
    };
    if (innerWidth > 768) nome();

    const gruppi = [...menu.querySelectorAll("details.gruppo")];
    const gestione = gruppi.find((g) => g.dataset.permesso === "gestione"), social = gruppi.find((g) => g.dataset.permesso === "social");
    const aperta = document.querySelector('.barra-voci [aria-current="page"]');
    if (document.title.includes("Amministrazione") || location.pathname.includes("stagione")) {
      esito("gruppi", gestione?.open && !social?.open && aperta?.closest("details") === gestione ? "" : `gestione ${gestione?.open}, social ${social?.open}, aperta «${aperta?.textContent.trim()}»`);
    } else {
      esito("gruppi", gestione && social && !gestione.open && !social.open ? "" : `gestione ${gestione?.open}, social ${social?.open}`);
    }

    if (innerWidth > 768) {
      const b = menu.getBoundingClientRect();
      esito("colonna", b.left <= 1 && b.width >= 220 && dentro(menu) && (!bottone || !bottone.getClientRects().length) ? "" : `menu a ${Math.round(b.left)} largo ${Math.round(b.width)}, pulsante ${bottone && bottone.getClientRects().length ? "visibile" : "nascosto"}`);
    } else {
      esito("chiuso", bottone && bottone.getAttribute("aria-expanded") === "false" && !dentro(menu) ? "" : `aria-expanded ${bottone?.getAttribute("aria-expanded")}, menu ${dentro(menu) ? "visibile" : "nascosto"}`);
      bottone.click();
      await aspetta(400);
      nome();
      const voci = [...menu.querySelectorAll(":scope > a, :scope > details > summary, :scope button")].filter((x) => x.getClientRects().length);
      const fuori = voci.filter((x) => !dentro(x)).map((x) => x.textContent.trim() || x.getAttribute("aria-label"));
      esito("aperto", bottone.getAttribute("aria-expanded") === "true" && dentro(menu) && voci.length >= 12 && !fuori.length
        ? "" : `aria-expanded ${bottone.getAttribute("aria-expanded")}, ${voci.length} voci, fuori ${fuori.join(" ")}`);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await aspetta(400);
      esito("esc", bottone.getAttribute("aria-expanded") === "false" && document.activeElement === bottone ? "" : `aria-expanded ${bottone.getAttribute("aria-expanded")}, fuoco su ${document.activeElement?.tagName}`);
    }
  } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 1500));
}
