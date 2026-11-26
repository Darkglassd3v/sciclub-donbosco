// Cifre in alto alle pagine (riquadri .kpi), richiesta del 26/11/2026: le etichette, per esempio «Totale da incassare»
// nei Pagamenti, erano piccole e grigie. Ora almeno 17 px e in grassetto, in tutte le pagine (brand.css).
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  FAKE.risposta = () => [];
  window.addEventListener("load", () => setTimeout(() => {
    const label = document.querySelector(".kpi-label");
    const style = label && getComputedStyle(label);
    document.title = "RISULTATO " + `etichetta=${style && parseFloat(style.fontSize) >= 17 && Number(style.fontWeight) >= 600
      ? "ok" : `NO(${style?.fontSize} ${style?.fontWeight})`}`;
  }, 800));
}
