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
  const fetchVero = window.fetch.bind(window);
  let letture = 0;
  window.fetch = (url, ...resto) => (String(url).includes("/rpc/next_card_number") && letture++ > 0
    ? Promise.resolve(new Response(JSON.stringify(ATTESO.prossima + 1), { status: 200, headers: { "Content-Type": "application/json" } }))
    : fetchVero(url, ...resto));
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prossima = document.getElementById("prossimaTessera");
    r.push(`prossima=${prossima && !prossima.hidden && prossima.textContent.includes(String(ATTESO.prossima)) ? "ok"
      : `NO(atteso ${ATTESO.prossima}, c'è «${prossima ? (prossima.hidden ? "nascosto" : prossima.textContent.trim()) : "niente"}»)`}`);
    const q = document.getElementById("q");
    q.value = ATTESO.numero;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await aspetta(2500);
    r.push(`prossimaAggiornata=${prossima && prossima.textContent.includes(String(ATTESO.prossima + 1)) ? "ok"
      : `NO(dopo la ricerca c'è ancora «${prossima ? prossima.textContent.trim() : "niente"}», atteso ${ATTESO.prossima + 1})`}`);
    const voci = [...document.querySelectorAll("#risultati > li")].map((li) => li.textContent.replace(/\s+/g, " ").trim());
    r.push(`perNumero=${voci.length === 1 && voci[0].includes(ATTESO.cognome) ? "ok"
      : `NO(tessera ${ATTESO.numero} di ${ATTESO.cognome}: ${voci.length} risultati${voci.length ? ", " + voci[0].slice(0, 60) : ""})`}`);
    // La barra (ricerca/comune.js): --barra-h è la sua altezza vera, come in web/shared.js.
    const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--barra-h"));
    const barra = document.querySelector(".barra").offsetHeight;
    r.push(`altezzaBarra=${Math.abs(h - barra) <= 1 ? "ok" : `NO(--barra-h ${h}, barra ${barra})`}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
