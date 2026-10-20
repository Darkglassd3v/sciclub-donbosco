// Soci (index.html): un socio nuovo che è già in archivio non si scrive.
// salva() mostra l'avviso invece della domanda di conferma; scrivi(), chiamata
// subito prima di scrivere, si ferma anche lei e non manda niente al database.
let scritture = 0;

FINTO.risposta = (t, r) => {
  if (r.filtri.some((f) => ["insert", "update", "upsert", "delete"].includes(f[0]))) {
    scritture++;
    return [{ id: "NUOVO", updated_at: "2" }];
  }
  if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "name_key")) {
    return [{ id: "D", last_name: "ROSSI", first_name: "MARIO", birth_date: null, tax_code: null, city: "ASTI", card_number: null }];
  }
  return [];
};

const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));

window.addEventListener("load", () => setTimeout(async () => {
  el("f_cognome").value = "Rossi";
  el("f_nome").value = "Mario";
  el("f_telefono").value = "333";
  salva();
  await aspetta(500);
  const daSalva = !el("avvisoDoppioni").hidden && !document.querySelector("dialog.finestra-domanda[open]");

  el("avvisoDoppioni").hidden = true;
  await scrivi();
  const daScrivi = !el("avvisoDoppioni").hidden && scritture === 0;

  document.title = `RISULTATO salva=${daSalva ? "ok" : "NO(niente avviso, o la domanda è comparsa)"}`
    + ` scrivi=${daScrivi ? "ok" : `NO(scritture ${scritture})`}`;
}, 500));
