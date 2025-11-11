//MAX/parser/auth/strategies/guap-auth.js

export class GuapAuthStrategy {
  static loginUrl = 'https://sso.guap.ru/realms/master/protocol/openid-connect/auth?state=8b484836b81aba3fd74d30292f4211b9&scope=profile%20email&response_type=code&approval_prompt=auto&redirect_uri=https%3A%2F%2Fpro.guap.ru%2Foauth%2Fcallback&client_id=prosuai';

  static async login(page, credentials) {
    try {
      await page.goto(this.loginUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Ждем и заполняем поля с увеличенным таймаутом
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.waitForSelector('#password-input', { timeout: 10000 });
      
      await page.type('#username', credentials.username);
      await page.type('#password-input', credentials.password);

      // Нажимаем кнопку входа
      await page.waitForSelector('input[type="submit"]', { timeout: 10000 });
      
      const navigationPromise = page.waitForNavigation({ 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      });
      
      await page.click('input[type="submit"]');
      
      try {
        await navigationPromise;
      } catch (e) {
        console.log('Навигация после входа не завершилась за 15 секунд, продолжаем...');
      }

      return page.url();
    } catch (error) {
      console.error('Ошибка авторизации в ГУАП:', error);
      throw error;
    }
  }

  static isLoginSuccessful(url) {
    return url.includes('pro.guap.ru') || url.includes('callback');
  }
}