"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientSupabase as supabase } from "./../../lib/supabase-client";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndInitialize();
  }, []);

  const checkAuthAndInitialize = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // 1. Если нет сессии Supabase - на авторизацию
      if (error || !session) {
        console.log('❌ Нет активной сессии Supabase');
        router.push('/auth');
        return;
      }

      console.log('✅ Активная сессия Supabase найдена');
      
      // 2. Проверяем refresh токен
      const hasValidRefreshToken = await checkRefreshToken();
      
      if (!hasValidRefreshToken) {
        console.log('❌ Нет валидного refresh токена');
        router.push('/auth');
        return;
      }

      // 3. Получаем пароль из localStorage
      const guapPassword = localStorage.getItem('guap_password');
      
      if (!guapPassword) {
        console.log('❌ Пароль не найден в localStorage');
        router.push('/auth');
        return;
      }

      // 4. Проверяем/инициализируем сессию парсера
      const parserValid = await checkAndInitParserSession(session.user, guapPassword);
      
      if (parserValid) {
        console.log('✅ Сессия парсера активна, переход в /main');
        router.push('/main');
      } else {
        console.log('❌ Не удалось инициализировать сессию парсера');
        await supabase.auth.signOut();
        localStorage.removeItem('guap_password');
        router.push('/auth?expired=true');
      }

    } catch (error) {
      console.error('Auth initialization error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const checkRefreshToken = async () => {
    try {
      // Проверяем валидность refresh токена через Supabase
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  };

  const checkAndInitParserSession = async (user, password) => {
    try {
      const username = user.user_metadata?.original_username || user.user_metadata?.username;
      
      if (!username) return false;

      // Сначала проверяем существующую сессию
      const sessionActive = await checkParserSession(username);
      
      if (sessionActive) {
        console.log('✅ Используется существующая сессия парсера');
        return true;
      }

      // Если сессии нет - инициализируем новую с паролем из localStorage
      console.log('🔄 Инициализация новой сессии парсера');
      return await initializeParserSession(username, password);

    } catch (error) {
      console.error('Parser session error:', error);
      return false;
    }
  };

  const checkParserSession = async (username) => {
    try {
      const response = await fetch('http://localhost:3001/api/scrape/check-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.sessionActive;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const initializeParserSession = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3001/api/scrape/init-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.success && result.sessionActive;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  return null;
}