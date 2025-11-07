import { BaseScraper } from './base-scraper.js';
import { GuapAuthStrategy } from '../auth/strategies/guap-auth.js';

export class GuapTasksScraper extends BaseScraper {
  constructor() {
    super();
    this.authStrategy = GuapAuthStrategy;
  }

  async scrapeTasks(credentials) {
    let browser;
    try {
      browser = await this.browserManager.launch();
      const page = await this.browserManager.createPage(browser);

      // Аутентификация
      const finalUrl = await this.authStrategy.login(page, credentials);
      
      if (!this.authStrategy.isLoginSuccessful(finalUrl)) {
        // Проверяем наличие ошибки авторизации
        const errorText = await page.evaluate(() => {
          const errorElement = document.querySelector('.alert-error');
          return errorElement ? errorElement.textContent.trim() : null;
        });
        
        if (errorText) {
          throw new Error(errorText);
        }
        throw new Error('Неверный логин или пароль');
      }

      // Переход к задачам
      await this.navigateToTasks(page);
      
      // Парсинг данных
      const tasksData = await this.parseTasksTable(page);
      
      return {
        success: true,
        message: `✅ Успешный вход! Найдено заданий: ${tasksData.length}`,
        tasks: tasksData,
        tasksCount: tasksData.length
      };

    } catch (error) {
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async navigateToTasks(page) {
    console.log('Переходим на страницу заданий...');
    await page.goto('https://pro.guap.ru/inside/student/tasks/', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Ждем загрузки таблицы
    await page.waitForFunction(() => {
      const tables = document.querySelectorAll('table');
      return tables.length > 0;
    }, { timeout: 10000 });
  }

  async parseTasksTable(page) {
    return await page.evaluate(() => {
      const tasks = [];
      const tables = document.querySelectorAll('table');
      
      if (tables.length === 0) return tasks;

      const rows = tables[0].querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          const subjectLink = cells[2]?.querySelector('a.blue-link, a');
          const taskType = cells[3]?.querySelector('a.link-switch-blue, a');
          const statusBadge = cells[4]?.querySelector('.badge, .status');
          const scoreSpan = cells[5]?.querySelector('span');
          const actionButton = cells[0]?.querySelector('a.btn, a');
          
          const task = {
            subject: subjectLink?.textContent?.trim() || cells[2]?.textContent?.trim() || '',
            subjectLink: subjectLink?.href || '',
            taskType: taskType?.textContent?.trim() || cells[3]?.textContent?.trim() || '',
            taskLink: taskType?.href || '',
            status: statusBadge?.textContent?.trim() || cells[4]?.textContent?.trim() || '',
            statusClass: statusBadge?.className || '',
            score: scoreSpan?.textContent?.trim() || cells[5]?.textContent?.trim() || '0 / 0',
            actionButton: actionButton?.href || ''
          };
          
          if (task.subject || task.taskType) {
            tasks.push(task);
          }
        }
      });
      
      return tasks;
    });
  }
}