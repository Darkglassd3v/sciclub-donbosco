// Soci (index.html): un numero tessera già dato a un altro socio diventa rosso mentre si scrive,
// prima del Salva (richiesta del 12/11/2026). Il database ferma comunque il doppione.
// - Numero di un altro socio: campo segnato (campo-errore, aria-invalid) e, sotto, la riga
//   «Numero tessera già assegnato a un altro socio.».
// - "0037" è lo stesso numero di "37" (come cardNumber() al salvataggio).
// - Numero libero: niente rosso e niente riga.
// - Il socio aperto non è "un altro socio": il suo numero non è un doppione.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const MEMBER = { id: "M", last_name: "NUMERO", first_name: "NINO", updated_at: "1", enrolled_at: "2026-10-14", paid: 0, total: 40,
    total_manual: false, card_type: "TESSERA ORDINARIA - REALE MUTUA NEVE", card_number: "30" };
  // 21-35 (il 30 è di NUMERO NINO) e 37.
  const USED = [...Array.from({ length: 15 }, (_, i) => 21 + i), 37]
    .map((n) => ({ id: n === 30 ? "M" : "S" + n, card_number: String(n) }));
  FAKE.rpc.next_card_number = 36;

  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    if (t === "settings") return [{ key: "card_gaps_from", value: "21" }];
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id")) return [MEMBER];
    if (t === "members" && r.filtri.some((f) => f[0] === "not" && f[1] === "card_number")) return USED;
    return [];
  };

  const field = () => el("f_numero_tessera");
  const warning = () => document.getElementById("tesseraDoppia");
  const warningShown = () => !!warning() && getComputedStyle(warning()).display !== "none" && /già assegnato/.test(warning().textContent);
  const isRed = () => field().classList.contains("campo-errore") && field().getAttribute("aria-invalid") === "true";
  const write = (theValue) => {
    field().value = theValue;
    field().dispatchEvent(new Event("input", { bubbles: true }));
  };
  const state = () => `rosso ${isRed()}, riga «${warning()?.textContent || "assente"}» visibile ${warningShown()}`;

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);

    test("propostoLibero", field().value === "36" && !isRed() && !warningShown(), `numero «${field().value}», ${state()}`);
    write("37");
    test("doppione", isRed() && warningShown(), state());
    test("testo", warning()?.textContent.trim() === "Numero tessera già assegnato a un altro socio.", `«${warning()?.textContent}»`);
    write("36");
    test("libero", !isRed() && !warningShown(), state());
    write("0037");
    test("zeriDavanti", isRed() && warningShown(), state());
    write("");
    test("vuoto", !isRed() && !warningShown(), state());

    await loadMember("M");
    test("suoNumero", field().value === "30" && !isRed() && !warningShown(), `numero «${field().value}», ${state()}`);
    write("21");
    test("doppioneSocioAperto", isRed() && warningShown(), state());

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
