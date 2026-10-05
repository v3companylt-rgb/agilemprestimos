"""
Servidor SPA simples - serve index.html para qualquer rota desconhecida
"""
import http.server
import os

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        # Redireciona /index.html para a raiz para manter URL limpa e evitar 404
        clean_path = self.path.split('?')[0]
        if clean_path == '/index.html':
            query = self.path[len(clean_path):]
            self.send_response(301)
            self.send_header('Location', '/' + query)
            self.end_headers()
            return
        if clean_path.endswith('/index.html') and len(clean_path) > 11:
            target = clean_path[:-10]
            query = self.path[len(clean_path):]
            self.send_response(301)
            self.send_header('Location', target + query)
            self.end_headers()
            return

        # Proxy para a API de consulta de CPF
        if clean_path == '/api/cpf-lookup':
            import urllib.request
            import urllib.parse
            query_dict = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            cpf = query_dict.get('cpf', [''])[0].strip()
            cpf_clean = ''.join(filter(str.isdigit, cpf))
            api_url = f"https://api-apela.online/?user=e2129a6b1eb9e84106863e47352dc1e5&cpf={cpf_clean}"
            try:
                req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(f'{{"status":500,"erro":"{str(e)}"}}'.encode('utf-8'))
                return

        # Tenta servir o arquivo normalmente
        path = self.translate_path(self.path)
        # Se o arquivo não existe (e não é um asset), serve o index.html
        if not os.path.exists(path) or os.path.isdir(path):
            # Verifica se tem index.html dentro da pasta (ex: /simulacao/ -> simulacao/index.html)
            if os.path.isdir(path):
                index = os.path.join(path, 'index.html')
                if os.path.exists(index):
                    super().do_GET()
                    return
            # Fallback: serve o root index.html (SPA mode)
            self.path = '/index.html'
        super().do_GET()

    def log_message(self, format, *args):
        print(f"  {self.address_string()} -> {format % args}")

if __name__ == '__main__':
    with http.server.HTTPServer(('', PORT), SPAHandler) as httpd:
        print(f"\n  Servidor rodando em: http://localhost:{PORT}")
        print(f"  Pressione Ctrl+C para parar\n")
        httpd.serve_forever()
