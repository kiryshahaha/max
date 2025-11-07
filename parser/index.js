import { GuapTasksScraper } from './scrapers/guap-tasks-scraper.js';
import { ErrorHandler } from './utils/error-handler.js';

export async function scrapeGuapTasks(credentials) {
  const scraper = new GuapTasksScraper();
  
  try {
    await scraper.validateCredentials(credentials);
    const result = await scraper.scrapeTasks(credentials);
    return result;
  } catch (error) {
    return ErrorHandler.handleScrapingError(error);
  }
}