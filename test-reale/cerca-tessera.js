// PAGINA: ricerca/index.html
// RUOLO: superadmin
// Cerca socio, il numero tessera come il nome (richiesta del 27/10): in stagione serve sapere da
// quale tessera ripartire e di chi è un numero.
// - in cima, il prossimo numero tessera, lo stesso che propone Soci (next_card_number());
// - scritto un numero, esce il socio con quella tessera, e solo lui (uguale, non «che inizia per»);
// - il prossimo numero si rilegge a ogni ricerca: con la pagina aperta, un altro operatore può
//   aver fatto una tessera nel frattempo.
{
  // Un altro operatore fa una tessera mentre la pagina è aperta: dalla seconda lettura in poi
  // next_card_number() risponde col numero dopo. Il prossimo in cima deve seguirlo.
  const realFetch = window.fetch.bind(window);
  let reads = 0;
  window.fetch = (url, ...rest) => (String(url).includes("/rpc/next_card_number") && reads++ > 0
    ? Promise.resolve(new Response(JSON.stringify(EXPECTED.prossima + 1), { status: 200, headers: { "Content-Type": "application/json" } }))
    : realFetch(url, ...rest));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const next = document.getElementById("prossimaTessera");
    r.push(`prossima=${next && !next.hidden && next.textContent.includes(String(EXPECTED.prossima)) ? "ok"
      : `NO(atteso ${EXPECTED.prossima}, c'è «${next ? (next.hidden ? "nascosto" : next.textContent.trim()) : "niente"}»)`}`);
    const q = document.getElementById("q");
    q.value = EXPECTED.numero;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(2500);
    r.push(`prossimaAggiornata=${next && next.textContent.includes(String(EXPECTED.prossima + 1)) ? "ok"
      : `NO(dopo la ricerca c'è ancora «${next ? next.textContent.trim() : "niente"}», atteso ${EXPECTED.prossima + 1})`}`);
    const items = [...document.querySelectorAll("#risultati > li")].map((li) => li.textContent.replace(/\s+/g, " ").trim());
    r.push(`perNumero=${items.length === 1 && items[0].includes(EXPECTED.cognome) ? "ok"
      : `NO(tessera ${EXPECTED.numero} di ${EXPECTED.cognome}: ${items.length} risultati${items.length ? ", " + items[0].slice(0, 60) : ""})`}`);
    // La barra (ricerca/comune.js): --barra-h è la sua altezza vera, come in web/shared.js.
    const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--barra-h"));
    const bar = document.querySelector(".barra").offsetHeight;
    r.push(`altezzaBarra=${Math.abs(h - bar) <= 1 ? "ok" : `NO(--barra-h ${h}, barra ${bar})`}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
