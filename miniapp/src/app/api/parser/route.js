import { GuapTasksScraper } from './scrapers/guap-tasks-scraper.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ 
        message: '❌ Укажите логин и пароль' 
      }, { status: 400 });
    }

    const scraper = new GuapTasksScraper();
    const result = await scraper.scrapeTasks({ username, password });

    return Response.json(result);

  } catch (error) {
    console.error('Parser API Error:', error);
    return Response.json(
      { 
        message: `❌ Ошибка парсера: ${error.message}`,
        success: false 
      },
      { status: 500 }
    );
  }
}