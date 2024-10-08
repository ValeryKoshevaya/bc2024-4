const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent');

const app = express();
const PORT = 3001; // 

const CACHE_DIR = path.join(__dirname, './cache');

// Middleware для обробки даних з запиту
app.use(express.raw({ type: 'image/jpeg', limit: '10mb' }));

// Функція для збереження картинки у кеш
const saveImageToCache = async (statusCode, imageBuffer) => {
    const filePath = path.join(CACHE_DIR, `${statusCode}.jpg`);
    await fs.writeFile(filePath, imageBuffer);
};

// Функція для отримання картинки з кешу
const getImageFromCache = async (statusCode) => {
    const filePath = path.join(CACHE_DIR, `${statusCode}.jpg`);
    try {
        return await fs.readFile(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null; // Якщо файл не знайдено, повертаємо null
        }
        throw error; // Якщо сталася інша помилка, прокинемо її далі
    }
};

// GET запит для отримання картинки з кешу або http.cat
app.get('/:statusCode', async (req, res) => {
    const { statusCode } = req.params;

    // Спочатку намагаємося отримати картинку з кешу
    let image = await getImageFromCache(statusCode);

    if (!image) {
        try {
            // Якщо картинки немає в кеші, запитуємо з http.cat
            const response = await superagent.get(`https://http.cat/${statusCode}`);
            image = response.body; // отримуємо картинку
            await saveImageToCache(statusCode, image); // зберігаємо в кеш
            res.status(200).contentType('image/jpeg').send(image); // відправляємо клієнту
        } catch (error) {
            // Якщо сталася помилка під час запиту
            console.error(`Error fetching from http.cat: ${error.message}`);
            res.status(404).send('Not Found');
        }
    } else {
        // Якщо картинка є в кеші, повертаємо її
        res.status(200).contentType('image/jpeg').send(image);
    }
});

// PUT запит для збереження картинки
app.put('/:statusCode', async (req, res) => {
    const { statusCode } = req.params;
    await saveImageToCache(statusCode, req.body);
    res.status(201).send('Created');
});

// DELETE запит для видалення картинки
app.delete('/:statusCode', async (req, res) => {
    const { statusCode } = req.params;
    const filePath = path.join(CACHE_DIR, `${statusCode}.jpg`);
    try {
        await fs.unlink(filePath);
        res.status(200).send('Deleted');
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).send('Not Found');
        } else {
            res.status(500).send('Internal Server Error');
        }
    }
});

// Запускаємо сервер
app.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
