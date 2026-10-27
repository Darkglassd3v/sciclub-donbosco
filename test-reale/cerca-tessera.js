// PAGINA: ricerca/index.html
// RUOLO: superadmin
// Cerca socio, il numero tessera come il nome (richiesta del 27/10): in stagione serve sapere da
// quale tessera ripartire e di chi è un numero.
// - in cima, il prossimo numero tessera, lo stesso che propone Soci (next_card_number());
// - scritto un numero, esce il socio con quella tessera, e solo lui (uguale, non «che inizia per»).
{
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
    const voci = [...document.querySelectorAll("#risultati > li")].map((li) => li.textContent.replace(/\s+/g, " ").trim());
    r.push(`perNumero=${voci.length === 1 && voci[0].includes(ATTESO.cognome) ? "ok"
      : `NO(tessera ${ATTESO.numero} di ${ATTESO.cognome}: ${voci.length} risultati${voci.length ? ", " + voci[0].slice(0, 60) : ""})`}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
