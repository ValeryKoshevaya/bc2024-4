const http = require('http');
const fs = require('fs');
const path = require('path');
const superagent = require('superagent');
const { program } = require('commander');

// Налаштування параметрів командного рядка
program
  .requiredOption('-h, --host <host>', 'Server host address')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cacheDir>', 'Path to cache directory');

program.parse(process.argv);

const { host, port, cache } = program.opts();

// Перевірка наявності кеш-директорії
if (!fs.existsSync(cache)) {
  console.error(`Cache directory does not exist: ${cache}`);
  process.exit(1);
}

// Створення веб-сервера
const server = http.createServer(async (req, res) => {
  const statusCode = req.url.slice(1); // отримуємо статусний код з URL (без "/")
  
  if (!statusCode || isNaN(statusCode)) {
    res.statusCode = 400;
    res.end('Please provide a valid status code in the URL.');
    return;
  }

  const cachePath = path.join(cache, `${statusCode}.jpg`);

  // Перевіряємо, чи існує кешований файл
  if (fs.existsSync(cachePath)) {
    console.log(`Serving cached image for status code ${statusCode}`);
    const cachedImage = fs.readFileSync(cachePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/jpeg');
    res.end(cachedImage);
  } else {
    // Якщо файл не кешований, завантажуємо з http.cat і кешуємо
    try {
      console.log(`Fetching image from http.cat for status code ${statusCode}`);
      const response = await superagent.get(`https://http.cat/${statusCode}`);

      // Зберігаємо зображення в кеш
      fs.writeFileSync(cachePath, response.body);
      
      // Відправляємо відповідь клієнту
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/jpeg');
      res.end(response.body);
    } catch (error) {
      console.error(`Error fetching image for status code ${statusCode}:`, error.message);
      res.statusCode = 500;
      res.end('Error fetching the image.');
    }
  }
});

// Запуск сервера
server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
