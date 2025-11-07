// app/api/auth/route.js (обновленный)
import { userService } from './user-service';

// URL вашего парсер-микросервиса
const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL;

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ 
        message: '❌ Укажите логин и пароль' 
      }, { status: 400 });
    }

    // Вызов микросервиса парсера
    const parserResponse = await fetch(`${PARSER_SERVICE_URL}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!parserResponse.ok) {
      throw new Error(`Parser service error: ${parserResponse.status}`);
    }

    const result = await parserResponse.json();

    if (result.success) {
      // Создание/обновление пользователя в Supabase
      const userResult = await userService.createOrUpdateUser(username, password);
      
      // Добавляем информацию о пользователе в ответ
      result.userAction = userResult.created ? 'created' : 
                         userResult.updated ? 'updated' : 
                         userResult.exists ? 'exists' : 'unknown';

      // Логируем успешный вход
      await userService.logLogin(username, true, result.tasksCount || 0);
    } else {
      // Логируем неудачную попытку
      await userService.logLogin(username, false, 0, result.message);
    }

    return Response.json(result);

  } catch (error) {
    console.error('API Error:', error);
    
    // Если ошибка связана с существующим пользователем - не считаем это критической ошибкой
    if (error.code === 'email_exists' || error.status === 422) {
      // Все равно возвращаем успешный результат от парсера
      const result = { success: true, userAction: 'exists' };
      return Response.json(result);
    }
    
    return Response.json(
      { 
        message: `❌ Ошибка соединения с сервисом парсера: ${error.message}`,
        success: false 
      },
      { status: 500 }
    );
  }
}