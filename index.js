const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;
const cacheDir = path.join(__dirname, 'cache');

const server = http.createServer(async (req, res) => {
    const urlPath = req.url;
    const httpCode = urlPath.substring(1); // Отримуємо код з URL (наприклад, 200)
    const imagePath = path.join(cacheDir, `${httpCode}.jpg`);

    if (req.method === 'GET') {
        try {
            const image = await fs.readFile(imagePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(image);
        } catch (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } else if (req.method === 'PUT') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const imageBuffer = Buffer.concat(chunks);
                await fs.writeFile(imagePath, imageBuffer);
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Created');
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });
    } else if (req.method === 'DELETE') {
        try {
            await fs.unlink(imagePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Deleted');
        } catch (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
