// PAGINA: admin.html
// RUOLO: tesoriere
// Pagamenti, sulla copia con 400 iscritti in più: tolto «Solo nuclei da incassare o a credito»,
// i familiari e i capofamiglia si leggono con tutti gli id. Messi tutti in un URL
// passano gli 8 KB che il gateway di Supabase accetta (414). Si devono vedere tutti.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    el("soloInsoluti").checked = false;
    await loadData();
    await wait(500);
    const t = el("statusToast");
    const err = t && t.style.display !== "none" && t.classList.contains("is-danger") ? t.textContent.slice(0, 80) : "";
    const n = lastOnes[0].length;
    document.title = `RISULTATO tutti=${!err && n === EXPECTED.nuclei ? "ok" : `NO(${n} nuclei su ${EXPECTED.nuclei}${err ? `, «${err}»` : ""})`}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
