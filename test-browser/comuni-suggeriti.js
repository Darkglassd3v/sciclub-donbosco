// Soci (index.html): Città di residenza suggerisce, mentre si scrive, i comuni già presenti nelle
// schede (vista member_places), i più usati per primi; scelto il comune, provincia e CAP si compilano
// da soli con i valori più usati, se il campo è vuoto: uno già scritto non si cambia.
// Città di nascita suggerisce invece l'elenco ufficiale di comuni e stati esteri della libreria
// (searchBirthPlaces, 6/11): solo quelli esistiti alla data di nascita (nel 1957 c'è LU, non
// Lu e Cuccaro Monferrato, nato nel 2019), il nome uguale per primo; scelto, la provincia si compila.
FAKE.risposta = (t) => t === "member_places" ? [
  { kind: "citta", place: "NIZZA MONFERRATO", province: "AT", postal_code: "14049", n: 202 },
  { kind: "citta", place: "ASTI", province: "AT", postal_code: "14100", n: 300 },
  { kind: "citta", place: "ASTI", province: "AT", postal_code: "14101", n: 2 },
  { kind: "nascita", place: "CANELLI", province: "AT", postal_code: null, n: 20 },
  { kind: "nascita", place: "ASTI", province: "AT", postal_code: null, n: 500 },
] : [];
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  await new Promise((ok) => setTimeout(ok, 600));
  const options = (input) => [...(document.getElementById(input.getAttribute("list") || "") || { options: [] }).options].map((o) => o.value).join(",");
  test("residenza", options(el("f_citta")) === "ASTI,NIZZA MONFERRATO", options(el("f_citta")) || "nessun suggerimento");
  const type = async (id, value) => { el(id).value = value; el(id).dispatchEvent(new Event("input", { bubbles: true })); await new Promise((ok) => setTimeout(ok, 300)); };
  await type("f_luogo_nascita", "canel");
  test("nascita", options(el("f_luogo_nascita")).split(",")[0] === "CANELLI", options(el("f_luogo_nascita")) || "nessun suggerimento");
  el("f_data_nascita").value = "1957-01-20";
  await type("f_luogo_nascita", "lu");
  const lu = options(el("f_luogo_nascita")).split(",");
  test("nascitaAllaData", lu[0] === "LU" && !lu.includes("LU E CUCCARO MONFERRATO"), lu.slice(0, 5).join(",") || "nessun suggerimento");
  const choose = (id, value) => { el(id).value = value; el(id).dispatchEvent(new Event("change", { bubbles: true })); };
  el("f_provincia").value = ""; el("f_cap").value = "";
  choose("f_citta", "NIZZA MONFERRATO");
  test("provinciaCap", el("f_provincia").value === "AT" && el("f_cap").value === "14049", `${el("f_provincia").value} ${el("f_cap").value}`);
  el("f_cap").value = "14050";
  choose("f_citta", "ASTI");
  test("capGiàScritto", el("f_cap").value === "14050", el("f_cap").value);
  el("f_provincia_nascita").value = "";
  choose("f_luogo_nascita", "canelli");
  await new Promise((ok) => setTimeout(ok, 300));
  test("provinciaNascita", el("f_provincia_nascita").value === "AT", el("f_provincia_nascita").value);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 400));
