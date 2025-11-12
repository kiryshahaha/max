// app/api/schedule/today/route.js
import { getAdminSupabase } from "@/lib/supabase-client";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('uid');

    if (!userId) {
      return Response.json({ 
        success: false, 
        message: '❌ UID пользователя обязателен' 
      }, { status: 400 });
    }

    const adminSupabase = getAdminSupabase();
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Форматируем дату для отображения
    const dateObj = new Date();
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    const formattedData = {
      date: currentDate,
      date_dd_mm: `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}`,
      day_name: dayNames[dateObj.getDay()],
      day_of_week: dateObj.getDay(),
      schedule: []
    };

    // Получаем данные из БД
    const { data: userData, error } = await adminSupabase
      .from('user_data')
      .select('today_schedule, today_date, schedule_updated_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Ошибка получения расписания:', error);
      throw error;
    }

    // Проверяем актуальность расписания
    if (userData && userData.today_date === currentDate && userData.today_schedule) {
      formattedData.schedule = userData.today_schedule;
      console.log('✅ Используем актуальное расписание из БД');
    } else {
      console.log('📋 Расписание не найдено или неактуально');
      if (userData && userData.today_date !== currentDate) {
        console.log('📅 Дата расписания не совпадает с текущей');
      }
    }

    return Response.json({
      success: true,
      uid: userId,
      schedule: formattedData
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return Response.json(
      { 
        success: false,
        message: `❌ Ошибка получения расписания: ${error.message}` 
      },
      { status: 500 }
    );
  }
}