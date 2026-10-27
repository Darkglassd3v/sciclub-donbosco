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
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { const r = []; try {
    const outcome = (nome, wrong) => r.push(`${nome}=${wrong ? `NO(${wrong})` : "ok"}`);
    const menu = document.querySelector(".barra-voci"), button = document.querySelector(".apri-menu");
    const inside = (x) => { const b = x.getBoundingClientRect(); return b.width > 0 && b.left >= -1 && b.right <= innerWidth + 1; };
    const page = location.pathname.split("/").pop().replace(/^prova-menu.*/, "");

    // Chi è entrato: in alto sul computer, in fondo al menu aperto sul telefono.
    const nome = () => {
      const user = [...document.querySelectorAll(".barra-utente")].find((x) => x.getClientRects().length && inside(x));
      outcome("nome", user && user.textContent.includes("prova@sciclub.it") && /superadmin/i.test(user.textContent)
        ? "" : `«${user ? user.textContent.trim() : "non si vede"}»`);
    };
    if (innerWidth > 768) nome();

    const groups = [...menu.querySelectorAll("details.gruppo")];
    const management = groups.find((g) => g.dataset.permesso === "gestione"), social = groups.find((g) => g.dataset.permesso === "social");
    const openOne = document.querySelector('.barra-voci [aria-current="page"]');
    if (document.title.includes("Amministrazione") || location.pathname.includes("stagione")) {
      outcome("gruppi", management?.open && !social?.open && openOne?.closest("details") === management ? "" : `gestione ${management?.open}, social ${social?.open}, aperta «${openOne?.textContent.trim()}»`);
    } else {
      outcome("gruppi", management && social && !management.open && !social.open ? "" : `gestione ${management?.open}, social ${social?.open}`);
    }

    if (innerWidth > 768) {
      const b = menu.getBoundingClientRect();
      outcome("colonna", b.left <= 1 && b.width >= 220 && inside(menu) && (!button || !button.getClientRects().length) ? "" : `menu a ${Math.round(b.left)} largo ${Math.round(b.width)}, pulsante ${button && button.getClientRects().length ? "visibile" : "nascosto"}`);
    } else {
      outcome("chiuso", button && button.getAttribute("aria-expanded") === "false" && !inside(menu) ? "" : `aria-expanded ${button?.getAttribute("aria-expanded")}, menu ${inside(menu) ? "visibile" : "nascosto"}`);
      button.click();
      await wait(400);
      nome();
      const items = [...menu.querySelectorAll(":scope > a, :scope > details > summary, :scope button")].filter((x) => x.getClientRects().length);
      const outside = items.filter((x) => !inside(x)).map((x) => x.textContent.trim() || x.getAttribute("aria-label"));
      outcome("aperto", button.getAttribute("aria-expanded") === "true" && inside(menu) && items.length >= 12 && !outside.length
        ? "" : `aria-expanded ${button.getAttribute("aria-expanded")}, ${items.length} voci, fuori ${outside.join(" ")}`);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await wait(400);
      outcome("esc", button.getAttribute("aria-expanded") === "false" && document.activeElement === button ? "" : `aria-expanded ${button.getAttribute("aria-expanded")}, fuoco su ${document.activeElement?.tagName}`);
    }
  } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 1500));
}
