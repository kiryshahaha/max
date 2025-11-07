// app/api/auth/user-service.js
import { adminSupabase } from "../../../../lib/supabase-client";

// Вспомогательные функции для работы с пользователями
export const userService = {
  // Создание или обновление пользователя
  async createOrUpdateUser(username, password) {
    try {
      // Определяем, является ли username email-ом
      let email;
      if (this.isValidEmail(username)) {
        // Если пользователь ввел email - используем как есть
        email = username;
      } else {
        // Если это логин - создаем временный email
        email = `${username}@guap-temp.com`;
      }
      
      // Сначала ищем пользователя по email
      const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
      
      if (listError) throw listError;
      
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        console.log(`Пользователь ${username} уже существует, обновляем...`);
        
        // Обновляем существующего пользователя
        const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password: password,
            user_metadata: {
              ...existingUser.user_metadata,
              username,
              original_username: username,
              last_login: new Date().toISOString()
            }
          }
        );

        if (updateError) throw updateError;
        
        console.log(`Обновлен пользователь: ${username}`);
        return { user: updatedUser, updated: true };
      } else {
        // Создаем нового пользователя
        const { data: user, error: createError } = await adminSupabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { 
            username,
            original_username: username,
            last_login: new Date().toISOString()
          }
        });

        if (createError) throw createError;

        console.log(`Создан пользователь: ${username}`);
        return { user, created: true };
      }
      
    } catch (error) {
      console.error('Ошибка создания/обновления пользователя:', error);
      throw error;
    }
  },

  // Проверка валидности email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Логирование входа
  async logLogin(username, success, tasksCount = 0, errorMessage = null) {
    try {
      const { data, error } = await adminSupabase
        .from('login_logs')
        .insert({
          username: username,
          success: success,
          tasks_count: tasksCount,
          error_message: errorMessage
        })
        .select();

      if (error) throw error;
      
      console.log(`Логин записан для пользователя: ${username}`);
      return data;
    } catch (error) {
      console.error('Ошибка записи лога:', error);
      // Не прерываем выполнение из-за ошибки логирования
    }
  }
};
