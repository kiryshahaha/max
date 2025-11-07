//MAX/parser/utils/error-handler.js

export class ErrorHandler {
  static handleScrapingError(error) {
    console.error('Ошибка скрапинга:', error);
    
    if (error.message.includes('Неверный логин или пароль')) {
      return {
        message: '❌ Неверный логин или пароль',
        status: 401
      };
    }
    
    if (error.message.includes('Укажите логин и пароль')) {
      return {
        message: error.message,
        status: 400
      };
    }
    
    return {
      message: '⚠️ Ошибка при выполнении скрипта: ' + error.message,
      status: 500
    };
  }
}