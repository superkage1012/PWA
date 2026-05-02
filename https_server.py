from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import ssl


HOST = "0.0.0.0"
PORT = 5173
ROOT = Path(__file__).resolve().parent
CERT_FILE = ROOT / "certs" / "localhost.pem"
KEY_FILE = ROOT / "certs" / "localhost.key"


def main() -> None:
    handler = SimpleHTTPRequestHandler
    server = ThreadingHTTPServer((HOST, PORT), handler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)
    server.socket = context.wrap_socket(server.socket, server_side=True)

    print(f"Serving HTTPS on https://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
