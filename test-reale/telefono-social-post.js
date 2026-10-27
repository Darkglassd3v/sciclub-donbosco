// PAGINA: social.html
// LARGHEZZA: 390
// Social sul telefono, col primo post aperto (la foto dell'utente del 27/10: titolo, «Pronto» e
// Salva accavallati, l'anteprima tagliata a destra):
// - testaUnita: in cima al post occhiello, titolo, stato e Salva non si coprono;
// - testaBassa: la testa (incollata sotto la barra) è alta al massimo 130 px;
// - anteprima: il post disegnato e i suoi pulsanti stanno dentro lo schermo.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { const r = []; try {
    const outcome = (nome, wrongOnes) => r.push(`${nome}=${wrongOnes.length ? `NO(${wrongOnes.slice(0, 4).join(" / ")})` : "ok"}`);
    const first = document.querySelector(".elenco-post li button");
    if (!first) throw new Error("nessun post nell'elenco");
    first.click();
    await wait(3000);
    const headerEl = document.getElementById("testaPost");
    const pieces = [...headerEl.querySelectorAll(".occhiello-post, h2, #statoPost > *, #btnSalva")].filter((x) => x.getClientRects().length && x.textContent.trim());
    const overlapping = [];
    for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) {
      const a = pieces[i].getBoundingClientRect(), b = pieces[j].getBoundingClientRect();
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1)
        overlapping.push(`«${pieces[i].textContent.trim().slice(0, 16)}» su «${pieces[j].textContent.trim().slice(0, 16)}»`);
    }
    outcome("testaUnita", overlapping);
    outcome("testaBassa", headerEl.offsetHeight > 130 ? [`alta ${headerEl.offsetHeight} px`] : []);
    const W = document.documentElement.clientWidth;
    const side = document.querySelector(".lato");
    const outside = [...side.querySelectorAll("*")].filter((x) => x.getClientRects().length && !x.closest(".fuori"))
      .filter((x) => { const b = x.getBoundingClientRect(); return b.width > 0 && (b.right > W + 1 || b.left < -1); })
      .map((x) => `${x.tagName.toLowerCase()}${x.className && typeof x.className === "string" ? "." + x.className.split(" ")[0] : ""} fino a ${Math.round(x.getBoundingClientRect().right)}`);
    outcome("anteprima", outside.filter((x, i, t) => t.indexOf(x) === i));
  } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 4000));
}
