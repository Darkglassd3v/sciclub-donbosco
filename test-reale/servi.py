"""Sito e Supabase finto per le prove sulla copia del database (avvia.sh).

Serve le pagine dalla cartella data, e fa da Supabase sullo stesso indirizzo:
/rest/v1/... va a PostgREST (quello vero, sulla copia), /auth/v1/... risponde
con l'utente del token, senza password. Così la pagina usa supabase-js vero e
le richieste vere: filtri, rpc, RLS.

    python3 servi.py <porta> <cartella> <url di PostgREST> <segreto JWT>
"""
import base64
import http.server
import json
import sys
import urllib.error
import urllib.request

PORTA, CARTELLA, POSTGREST, SEGRETO = int(sys.argv[1]), sys.argv[2], sys.argv[3].rstrip("/"), sys.argv[4]


def utente_del_token(intestazione):
    """L'utente scritto nel token (la firma la controlla PostgREST, qui non serve)."""
    try:
        corpo = intestazione.split()[1].split(".")[1]
        dati = json.loads(base64.urlsafe_b64decode(corpo + "=" * (-len(corpo) % 4)))
    except (IndexError, ValueError):
        return None
    return {"id": dati.get("sub"), "aud": "authenticated", "role": dati.get("role"), "email": dati.get("email"),
            "app_metadata": {}, "user_metadata": {}, "created_at": "2026-01-01T00:00:00Z"}


class Gestore(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=CARTELLA, **k)

    def log_message(self, *a):
        pass

    def _rispondi(self, codice, corpo=b"", tipo="application/json", intestazioni=()):
        self.send_response(codice)
        self.send_header("Content-Type", tipo)
        for nome, valore in intestazioni:
            self.send_header(nome, valore)
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _supabase(self):
        if self.path.startswith("/auth/v1/"):
            utente = utente_del_token(self.headers.get("Authorization", ""))
            if self.path.startswith("/auth/v1/user") and utente and utente["id"]:
                return self._rispondi(200, json.dumps(utente).encode())
            if self.path.startswith("/auth/v1/logout"):
                return self._rispondi(204)
            return self._rispondi(401, b'{"message":"prova: niente login vero"}')
        if not self.path.startswith("/rest/v1/"):
            return False
        lunghezza = int(self.headers.get("Content-Length") or 0)
        corpo = self.rfile.read(lunghezza) if lunghezza else None
        richiesta = urllib.request.Request(POSTGREST + self.path[len("/rest/v1"):], data=corpo, method=self.command)
        for nome in ("Authorization", "Content-Type", "Prefer", "Accept", "Range", "Range-Unit", "Accept-Profile", "Content-Profile"):
            if self.headers.get(nome):
                richiesta.add_header(nome, self.headers[nome])
        try:
            with urllib.request.urlopen(richiesta) as risposta:
                codice, dati, intestazioni = risposta.status, risposta.read(), risposta.headers
        except urllib.error.HTTPError as errore:
            codice, dati, intestazioni = errore.code, errore.read(), errore.headers
        tenute = [(n, v) for n, v in intestazioni.items() if n.lower() in ("content-range", "preference-applied", "location")]
        self._rispondi(codice, dati, intestazioni.get("Content-Type", "application/json"), tenute)
        return True

    def _altrimenti(self, metodo):
        if self._supabase() is False:
            metodo()

    def do_GET(self):
        self._altrimenti(super().do_GET)

    def do_HEAD(self):
        self._altrimenti(super().do_HEAD)

    def do_POST(self):
        self._altrimenti(lambda: self._rispondi(404))

    do_PATCH = do_PUT = do_DELETE = do_POST


http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), Gestore).serve_forever()
