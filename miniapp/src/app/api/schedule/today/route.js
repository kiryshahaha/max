// app/api/schedule/today/route.js
import { getAdminSupabase } from "../../../../../lib/supabase-client";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('uid');

    if (!userId) {
      return Response.json({ 
        message: '❌ User ID is required',
        success: false
      }, { status: 400 });
    }

    console.log('📅 Запрашиваем расписание для пользователя:', userId);

    // 1. Сначала проверяем бэкенд (как было в оригинальной логике)
    const backendResponse = await fetch(`http://127.0.0.1:8000/schedule/today?uid=${userId}`);

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`);
    }

    const backendData = await backendResponse.json();
    console.log('📊 Ответ от бэкенда:', backendData);

    const currentDate = new Date().toISOString().split('T')[0];

    // 2. УЛУЧШЕННАЯ ПРОВЕРКА: учитываем флаг has_schedule от бэкенда
    const hasValidSchedule = backendData.success &&
      backendData.schedule &&
      backendData.schedule.date === currentDate &&
      backendData.schedule.has_schedule !== false; // Ключевое изменение!

    console.log('🔍 Детальная проверка данных:', {
      success: backendData.success,
      hasSchedule: !!backendData.schedule,
      scheduleDate: backendData.schedule?.date,
      currentDate,
      hasScheduleFlag: backendData.schedule?.has_schedule,
      hasValidSchedule
    });

    // 3. Если расписание есть и флаг has_schedule не false - используем его
    if (hasValidSchedule) {
      console.log('✅ Используем актуальное расписание из бэкенда');
      console.log('   - Количество занятий:', backendData.schedule.schedule?.length || 0);
      console.log('   - Флаг has_schedule:', backendData.schedule.has_schedule);
      return Response.json({
        success: true,
        schedule: backendData.schedule,
        source: 'backend'
      });
    } else {
      console.log('🔄 Расписание отсутствует или устарело в бэкенде');
      console.log('   - Причина:', !backendData.schedule ? 'Нет объекта schedule' : 
        backendData.schedule.date !== currentDate ? 'Дата не совпадает' : 
        'Флаг has_schedule = false');
      return Response.json({
        success: false,
        message: 'Расписание не найдено в бэкенде',
        schedule: null
      });
    }

  } catch (error) {
    console.error('❌ Schedule API Error:', error);
    return Response.json(
      { 
        message: `❌ Ошибка получения расписания: ${error.message}`,
        success: false
      },
      { status: 500 }
    );
  }
}