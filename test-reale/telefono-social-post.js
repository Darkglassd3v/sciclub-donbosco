// PAGINA: social.html
// LARGHEZZA: 390
// Social sul telefono, col primo post aperto (la foto dell'utente del 27/10: titolo, «Pronto» e
// Salva accavallati, l'anteprima tagliata a destra):
// - testaUnita: in cima al post occhiello, titolo, stato e Salva non si coprono;
// - testaBassa: la testa (incollata sotto la barra) è alta al massimo 130 px;
// - anteprima: il post disegnato e i suoi pulsanti stanno dentro lo schermo.
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { const r = []; try {
    const esito = (nome, sbagliati) => r.push(`${nome}=${sbagliati.length ? `NO(${sbagliati.slice(0, 4).join(" / ")})` : "ok"}`);
    const primo = document.querySelector(".elenco-post li button");
    if (!primo) throw new Error("nessun post nell'elenco");
    primo.click();
    await aspetta(3000);
    const testa = document.getElementById("testaPost");
    const pezzi = [...testa.querySelectorAll(".occhiello-post, h2, #statoPost > *, #btnSalva")].filter((x) => x.getClientRects().length && x.textContent.trim());
    const sovrapposti = [];
    for (let i = 0; i < pezzi.length; i++) for (let j = i + 1; j < pezzi.length; j++) {
      const a = pezzi[i].getBoundingClientRect(), b = pezzi[j].getBoundingClientRect();
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1)
        sovrapposti.push(`«${pezzi[i].textContent.trim().slice(0, 16)}» su «${pezzi[j].textContent.trim().slice(0, 16)}»`);
    }
    esito("testaUnita", sovrapposti);
    esito("testaBassa", testa.offsetHeight > 130 ? [`alta ${testa.offsetHeight} px`] : []);
    const W = document.documentElement.clientWidth;
    const lato = document.querySelector(".lato");
    const fuori = [...lato.querySelectorAll("*")].filter((x) => x.getClientRects().length && !x.closest(".fuori"))
      .filter((x) => { const b = x.getBoundingClientRect(); return b.width > 0 && (b.right > W + 1 || b.left < -1); })
      .map((x) => `${x.tagName.toLowerCase()}${x.className && typeof x.className === "string" ? "." + x.className.split(" ")[0] : ""} fino a ${Math.round(x.getBoundingClientRect().right)}`);
    esito("anteprima", fuori.filter((x, i, t) => t.indexOf(x) === i));
  } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 4000));
}
