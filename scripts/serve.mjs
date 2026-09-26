import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpeg':'image/jpeg', '.pdf':'application/pdf', '.bib':'text/plain; charset=utf-8', '.mp4':'video/mp4', '.xml':'application/xml' };
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    let file = path.resolve(root,relative);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file=path.join(file,'index.html');
    const content=await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}).end(content);
  } catch {
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end(await readFile(path.join(root,'404.html')));
  }
});
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${server.address().port}`));
