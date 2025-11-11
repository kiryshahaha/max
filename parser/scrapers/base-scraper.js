//MAX/parser/scrapers/base-scraper.js

import { BrowserManager } from '../core/browser-manager.js';

export class BaseScraper {
  constructor() {
    this.browserManager = BrowserManager;
  }

  async validateCredentials(credentials) {
    if (!credentials.username || !credentials.password) {
      throw new Error('⛔ Укажите логин и пароль');
    }
  }
}