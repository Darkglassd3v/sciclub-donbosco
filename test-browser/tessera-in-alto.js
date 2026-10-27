// Soci (index.html): il numero tessera è fra i primi campi del modulo, sopra cognome e nome
// (richiesta del 27/10: in stagione si vede subito quale sarà la prossima tessera), e nel
// modulo vuoto c'è già il numero proposto (next_card_number) con la sua nota.
{
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const number = el("f_numero_tessera"), surname = el("f_cognome");
    const above = !!(number.compareDocumentPosition(surname) & Node.DOCUMENT_POSITION_FOLLOWING);
    r.push(`primoCampo=${above ? "ok" : "NO(il numero tessera viene dopo il cognome)"}`);
    r.push(`proposto=${number.value === "100" && !el("notaTessera").hidden ? "ok" : `NO(«${number.value}», nota ${el("notaTessera").hidden ? "nascosta" : "visibile"})`}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 1500));
}
