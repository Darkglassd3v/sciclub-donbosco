// Dati del lancio della stagione 2026/27, una sola volta per le pagine (pagine.html) e per la prova
// (prova.js). Le gite sono quelle salvate in produzione il 12/11/2026 (tabella social_events); la
// serata viene dal testo del direttivo in grafica/presentazione_stagione.md.

const SERATA = {
  data: "2026-11-25",
  ora: "21:00",
  luogo: "Circolo Way Assauto",
  indirizzo: "corso Pietro Chiesa 20, Asti",
  extra: "Buffet e brindisi finale",
};

// Le gite di dicembre, come le disegna il calendario del mese del generatore (solo le gite: il
// weekend al Sestriere sta fra le novità).
const DICEMBRE = [
  { data: "2026-12-01", meta: "Val Thorens" },
  { data: "2026-12-06", meta: "Val Thorens" },
  { data: "2026-12-08", meta: "Cervinia Valtournenche" },
  { data: "2026-12-13", meta: "Sestriere" },
  { data: "2026-12-15", meta: "Pila" },
  { data: "2026-12-20", meta: "Cervinia" },
];

// La terza pagina di «Si parte!»: le occasioni da non perdere nel primo mese.
const NOVITA = [
  { quando: "13 dicembre", cosa: "Prova gratuita di sci e snowboard con i maestri", dove: "Sestriere" },
  { quando: "11-13 dicembre", cosa: "Dream Weekend", dove: "Sestriere" },
  { quando: "Dal 9 gennaio", cosa: "Iniziano i corsi di sci e snowboard", dove: "Monginevro e Sestriere" },
];

if (typeof module !== "undefined") module.exports = { SERATA, DICEMBRE, NOVITA };
