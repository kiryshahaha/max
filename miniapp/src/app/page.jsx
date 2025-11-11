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
      
      if (error || !session) {
        console.log('❌ Нет активной сессии Supabase');
        router.push('/auth');
        return;
      }

      console.log('✅ Активная сессия Supabase найдена');
      
      // Восстанавливаем сессию парсера
      const parserSuccess = await restoreParserSession(session.user);
      
      if (parserSuccess) {
        console.log('✅ Все сессии восстановлены, переход в /main');
        router.push('/main');
      } else {
        console.log('❌ Сессия парсера не восстановлена, переход на авторизацию');
        // Передаем флаг, что нужна переавторизация
        router.push('/auth?reauth=true');
      }

    } catch (error) {
      console.error('Auth initialization error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const restoreParserSession = async (user) => {
    try {
      const username = user.user_metadata?.original_username || user.user_metadata?.username;
      
      if (!username) {
        console.warn('Недостаточно данных для восстановления сессии парсера');
        return false;
      }

      // Только проверяем существующую сессию
      const checkResponse = await fetch('http://localhost:3001/api/scrape/check-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        
        if (checkResult.sessionActive) {
          console.log('✅ Активная сессия парсера найдена');
          return true;
        }
      }

      // Если сессии нет - НЕ пытаемся создать новую, требуем переавторизацию
      console.log('⌛ Сессия парсера истекла, требуется переавторизация');
      return false;

    } catch (error) {
      console.warn('Ошибка проверки сессии парсера:', error.message);
      return false;
    }
  };

}