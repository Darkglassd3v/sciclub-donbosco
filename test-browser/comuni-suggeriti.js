// Soci (index.html): Città di nascita e Città di residenza suggeriscono, mentre si scrive, l'elenco
// ufficiale della libreria (searchPlaces, 6/11), il nome uguale per primo; scelto il comune, la
// provincia si compila dall'elenco, se il campo è vuoto: uno già scritto non si cambia.
// - Nascita: comuni e stati esteri esistiti alla data di nascita (nel 1957 c'è LU, non Lu e Cuccaro
//   Monferrato, nato nel 2019).
// - Residenza: solo i comuni di oggi (LU E CUCCARO MONFERRATO, non LU). Il CAP, che l'elenco non ha,
//   viene dalle schede (vista member_places), il più usato col comune.
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
  const type = async (id, value) => { el(id).value = value; el(id).dispatchEvent(new Event("input", { bubbles: true })); await new Promise((ok) => setTimeout(ok, 300)); };
  await type("f_citta", "nizza m");
  test("residenza", options(el("f_citta")).split(",")[0] === "NIZZA MONFERRATO", options(el("f_citta")) || "nessun suggerimento");
  await type("f_citta", "lu");
  const today = options(el("f_citta")).split(",");
  test("residenzaOggi", today[0] === "LU E CUCCARO MONFERRATO" && !today.includes("LU"), today.slice(0, 5).join(",") || "nessun suggerimento");
  await type("f_luogo_nascita", "canel");
  test("nascita", options(el("f_luogo_nascita")).split(",")[0] === "CANELLI", options(el("f_luogo_nascita")) || "nessun suggerimento");
  el("f_data_nascita").value = "1957-01-20";
  await type("f_luogo_nascita", "lu");
  const lu = options(el("f_luogo_nascita")).split(",");
  test("nascitaAllaData", lu[0] === "LU" && !lu.includes("LU E CUCCARO MONFERRATO"), lu.slice(0, 5).join(",") || "nessun suggerimento");
  const choose = (id, value) => { el(id).value = value; el(id).dispatchEvent(new Event("change", { bubbles: true })); };
  el("f_provincia").value = ""; el("f_cap").value = "";
  choose("f_citta", "NIZZA MONFERRATO");
  await new Promise((ok) => setTimeout(ok, 300));
  test("provinciaCap", el("f_provincia").value === "AT" && el("f_cap").value === "14049", `${el("f_provincia").value} ${el("f_cap").value}`);
  el("f_cap").value = "14050";
  choose("f_citta", "ASTI");
  test("capGiàScritto", el("f_cap").value === "14050", el("f_cap").value);
  el("f_provincia").value = ""; el("f_cap").value = "";
  choose("f_citta", "canelli");
  await new Promise((ok) => setTimeout(ok, 300));
  test("provinciaDallElenco", el("f_provincia").value === "AT" && el("f_cap").value === "", `${el("f_provincia").value} «${el("f_cap").value}»`);
  el("f_provincia_nascita").value = "";
  choose("f_luogo_nascita", "canelli");
  await new Promise((ok) => setTimeout(ok, 300));
  test("provinciaNascita", el("f_provincia_nascita").value === "AT", el("f_provincia_nascita").value);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 400));
