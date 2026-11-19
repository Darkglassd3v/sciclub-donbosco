// Il velo del caricamento (richiesta del 19/11/2026: «quando carica il sito non si capisce, fai un overlay che
// blocchi tutto mentre sta caricando»), regola di tutto il sito (fetchWithWaiting() in shared.js):
// - una richiesta che dura più di 400 ms copre la pagina con un velo, «Caricamento…» al centro: niente clic e niente
//   tasto Tab sulla pagina sotto (inert) finché non torna; tornata, il fuoco è dov'era;
// - due richieste di fila: il velo resta, non sparisce e ricompare;
// - mentre si scrive in un campo (la ricerca dei soci mentre si digita) niente velo, che coprirebbe il campo a ogni
//   lettera: resta l'etichetta in alto, che non blocca.
// La fetch finta risponde dopo i millisecondi scritti nell'indirizzo.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      window.fetch = (u) => new Promise((ok) => setTimeout(() => ok(new Response("{}")), Number(String(u).split("=")[1])));
      const box = () => document.getElementById("caricamento");
      const shown = () => Boolean(box()) && !box().hidden;
      const veil = () => shown() && box().classList.contains("velo");
      const inert = () => [...document.querySelectorAll("[inert]")];

      const button = document.querySelector(".barra-azioni .voce-testo");
      button.focus();
      const slow = fetchWithWaiting("x?ms=1200");
      await wait(150);
      test("nonSubito", !shown(), "visibile dopo 150 ms");
      await wait(450);
      test("velo", veil() && box().textContent.trim() === "Caricamento…" && box().getAttribute("role") === "status", box()?.outerHTML.slice(0, 120));
      const page = document.querySelector(".container-main");
      test("pagina", Boolean(page.closest("[inert]")) && Boolean(document.querySelector(".barra-voci").closest("[inert]")) && !box().closest("[inert]"),
        `inert: ${inert().map((x) => x.tagName.toLowerCase() + (x.id ? "#" + x.id : "")).join(",")}`);
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight - 30);
      test("clicBloccati", !page.contains(hit), `sotto il dito: ${hit?.tagName}${hit?.id ? "#" + hit.id : ""}`);
      el("searchInput").focus();
      test("tastieraBloccata", document.activeElement !== el("searchInput"), "il campo della ricerca prende il fuoco");
      const card = box().getBoundingClientRect();
      test("alCentro", Math.abs(card.left + card.width / 2 - innerWidth / 2) < 2 && Math.abs(card.top + card.height / 2 - innerHeight / 2) < 2,
        `${Math.round(card.left)},${Math.round(card.top)} ${Math.round(card.width)}×${Math.round(card.height)}`);
      await slow;
      await wait(300);
      test("veloSparito", !shown() && !inert().length, `visibile ${shown()}, inert ${inert().length}`);
      test("fuocoTornato", document.activeElement === button, document.activeElement?.outerHTML.slice(0, 80));

      // Due richieste di fila: il velo non si chiude fra l'una e l'altra.
      let hides = 0;
      const watch = new MutationObserver(() => { if (box().hidden) hides++; });
      watch.observe(box(), { attributes: true, attributeFilter: ["hidden"] });
      await fetchWithWaiting("x?ms=700");
      const between = veil();
      await fetchWithWaiting("x?ms=700");
      await wait(300);
      watch.disconnect();
      test("diFila", between && hides === 1 && !shown(), `fra le due ${between ? "velo" : "niente"}, chiuso ${hides} volte`);

      // Scrivendo nella ricerca: l'etichetta, non il velo; il campo resta usabile.
      el("searchInput").focus();
      const typing = fetchWithWaiting("x?ms=1000");
      await wait(600);
      test("scrivendo", shown() && !veil() && document.activeElement === el("searchInput") && !inert().length,
        `visibile ${shown()}, velo ${veil()}, fuoco ${document.activeElement?.id}, inert ${inert().length}`);
      await typing;
      await wait(300);
      test("etichettaSparita", !shown(), "ancora visibile");
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 600));
}
