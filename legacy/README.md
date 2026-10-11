# Legacy

Quello che non si usa più, tenuto come riferimento.

| Cartella | Cosa | Su GitHub |
|---|---|---|
| `gestione-soci/`, `pannello-pagamenti/`, `riepilogo-2026/` | la versione 1.x su Apps Script (vedi `docs/MIGRAZIONE_2.0.md`) | sì |
| `original_data/` | il foglio soci originale | no: dati personali |
| `new_structure/` | `SOCI 2026.xlsx`, da cui si genera la migrazione (`supabase/scripts/generate_migration.py`) | no: dati personali |
| `dati26/` | i fogli 2026 delle liste dell'assicurazione (usati da `supabase/scripts/cf_dati26.py`) e la scheda di tesseramento originale | no: dati personali |

Le cartelle con i dati sono escluse da `.gitignore` e restano solo in locale
(o su Drive). La scheda di tesseramento in uso, col QR del canale WhatsApp, è
in [`../grafica/scheda-tesseramento/`](../grafica/scheda-tesseramento/).
