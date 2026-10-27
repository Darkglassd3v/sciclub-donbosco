// Soci (index.html): un socio nuovo che è già in archivio non si scrive.
// save() mostra l'avviso invece della domanda di conferma; write(), chiamata
// subito prima di scrivere, si ferma anche lei e non manda niente al database.
let writings = 0;

FAKE.risposta = (t, r) => {
  if (r.filtri.some((f) => ["insert", "update", "upsert", "delete"].includes(f[0]))) {
    writings++;
    return [{ id: "NUOVO", updated_at: "2" }];
  }
  if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "name_key")) {
    return [{ id: "D", last_name: "ROSSI", first_name: "MARIO", birth_date: null, tax_code: null, city: "ASTI", card_number: null }];
  }
  return [];
};

const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));

window.addEventListener("load", () => setTimeout(async () => {
  el("f_cognome").value = "Rossi";
  el("f_nome").value = "Mario";
  el("f_telefono").value = "333";
  save();
  await wait(500);
  const fromSave = !el("avvisoDoppioni").hidden && !document.querySelector("dialog.finestra-domanda[open]");

  el("avvisoDoppioni").hidden = true;
  await write();
  const fromWrite = !el("avvisoDoppioni").hidden && writings === 0;

  document.title = `RISULTATO salva=${fromSave ? "ok" : "NO(niente avviso, o la domanda è comparsa)"}`
    + ` scrivi=${fromWrite ? "ok" : `NO(scritture ${writings})`}`;
}, 500));
