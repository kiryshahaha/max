import express from 'express';
import cors from 'cors';
import { scrapeGuapTasks } from './index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/scrape', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '❌ Укажите логин и пароль'
      });
    }

    console.log(`Запрос на парсинг для пользователя: ${username}`);
    const result = await scrapeGuapTasks({ username, password });
    
    res.json(result);
  } catch (error) {
    console.error('Ошибка в API парсера:', error);
    res.status(500).json({
      success: false,
      message: `❌ Ошибка парсера: ${error.message}`
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'GUAP Parser' });
});

app.listen(PORT, () => {
  console.log(`🚀 Parser service running on port ${PORT}`);
});