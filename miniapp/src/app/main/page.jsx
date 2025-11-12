"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  CellHeader,
  CellList,
  CellSimple,
  Container,
  Dot,
  EllipsisText,
  Flex,
  Panel,
  Spinner
} from "@maxhub/max-ui";
import { Badge, Divider, Steps, Tag, message } from "antd";
import { clientSupabase as supabase } from "../../../lib/supabase-client";

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [fetchLock, setFetchLock] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.log('❌ Нет активной сессии');
        router.push('/auth');
        return;
      }

      setUser(session.user);
      await fetchTodaySchedule(session.user.id);

    } catch (error) {
      console.error('Auth check error:', error);
      messageApi.error('Ошибка авторизации');
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async (userId) => {
    if (scheduleLoading) {
      console.log('⏳ Запрос расписания уже выполняется...');
      return;
    }

    try {
      setScheduleLoading(true);
      console.log('📅 Запрашиваем расписание для пользователя:', userId);

      // 1. Запрашиваем расписание через наш API (который проверяет бэкенд)
      const scheduleResponse = await fetch(`/api/schedule/today?uid=${userId}`);

      if (!scheduleResponse.ok) {
        throw new Error(`Schedule API error: ${scheduleResponse.status}`);
      }

      const scheduleData = await scheduleResponse.json();
      console.log('📊 Ответ от schedule API:', scheduleData);

      // 2. ОБНОВЛЕННАЯ ЛОГИКА: если расписание не найдено ИЛИ флаг has_schedule = false
      const shouldUpdateFromParser = !scheduleData.success ||
        (scheduleData.schedule && scheduleData.schedule.has_schedule === false);

      if (scheduleData.success && scheduleData.schedule && !shouldUpdateFromParser) {
        console.log('✅ Используем актуальное расписание из бэкенда');
        console.log('   - Флаг has_schedule:', scheduleData.schedule.has_schedule);
        setTodaySchedule(scheduleData.schedule);
      } else {
        // 3. Если расписания нет или флаг has_schedule = false - обновляем через парсер
        console.log('🔄 Расписание не найдено или флаг has_schedule = false, обновляем через парсер');
        console.log('   - Причина:', !scheduleData.success ? 'API не успешно' : 'has_schedule = false');
        await updateScheduleFromParser(userId);
      }

    } catch (error) {
      console.error('❌ Ошибка получения расписания:', error);
      messageApi.error('Ошибка загрузки расписания');
    } finally {
      setScheduleLoading(false);
    }
  };

  const updateScheduleFromParser = async (userId) => {
    if (fetchLock) {
      console.log('⏳ Запрос уже выполняется, ждем...');
      return;
    }

    try {
      setFetchLock(true);

      // Получаем актуальные данные пользователя
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        messageApi.error('Сессия не найдена');
        return;
      }

      const guapUsername = session.user.user_metadata?.guap_username ||
        session.user.user_metadata?.original_username ||
        session.user.user_metadata?.username;
      const password = localStorage.getItem('guap_password');
      const currentDate = new Date().toISOString().split('T')[0];

      console.log('🔐 Данные для обновления расписания:', {
        guapUsername,
        passwordExists: !!password,
        currentDate
      });

      if (!guapUsername || !password) {
        console.error('❌ Отсутствуют данные для авторизации');
        messageApi.error('Данные для авторизации не найдены');
        return;
      }

      // 4. Используем API для обновления расписания через парсер
      console.log('🚀 Отправляем запрос на обновление расписания');
      const updateResponse = await fetch('/api/schedule/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: guapUsername,
          password,
          date: currentDate
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Update API error: ${updateResponse.status} - ${errorText}`);
      }

      const updateData = await updateResponse.json();
      console.log('📊 Ответ от update API:', updateData);

      if (updateData.success) {
        setTodaySchedule(updateData.schedule);
        messageApi.success('Расписание обновлено');
      } else {
        messageApi.error(updateData.message || 'Ошибка обновления расписания');
      }

    } catch (error) {
      console.error('❌ Ошибка обновления расписания:', error);
      messageApi.error('Ошибка обновления расписания');
    } finally {
      setFetchLock(false);
    }
  };

  // Остальные функции остаются без изменений
  const calculateActivePairProgress = (schedule) => {
    if (!schedule || !schedule.schedule) return undefined;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const classItem of schedule.schedule) {
      if (classItem.timeRange) {
        const [startTime, endTime] = classItem.timeRange.split('-');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (currentTime >= startMinutes && currentTime <= endMinutes) {
          const totalDuration = endMinutes - startMinutes;
          const elapsed = currentTime - startMinutes;
          return Math.min(Math.round((elapsed / totalDuration) * 100), 100);
        }
      }
    }

    return undefined;
  };

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Если сессии нет, просто переходим на главную
        router.push('/');
        return;
      }

      const username = session.user.user_metadata?.original_username || session.user.user_metadata?.username;

      // Используем API для выхода
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!logoutResponse.ok) {
        const errorText = await logoutResponse.text();
        throw new Error(`Logout API error: ${logoutResponse.status} - ${errorText}`);
      }

      const logoutData = await logoutResponse.json();

      if (logoutData.success) {
        // Очищаем локальное хранилище
        localStorage.removeItem('guap_password');
        router.push('/');
        messageApi.success('Успешный выход');
      } else {
        throw new Error(logoutData.message);
      }

    } catch (error) {
      console.error('Logout error:', error);
      messageApi.error('Ошибка при выходе');
      // В любом случае пытаемся перенаправить пользователя
      localStorage.removeItem('guap_password');
      router.push('/');
    }
  };

  const formatScheduleForSteps = (schedule) => {
    if (!schedule || !schedule.schedule || schedule.schedule.length === 0) return [];

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return schedule.schedule.map((classItem, index) => {
      let status = "wait";
      let percent = undefined;

      if (classItem.timeRange) {
        const [startTime, endTime] = classItem.timeRange.split('-');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (currentTime < startMinutes) {
          status = "wait";
        } else if (currentTime >= startMinutes && currentTime <= endMinutes) {
          status = "process";
          const totalDuration = endMinutes - startMinutes;
          const elapsed = currentTime - startMinutes;
          percent = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
        } else {
          status = "finish";
        }
      }

      return {
        title: classItem.subject || 'Не указано',
        description: `${classItem.timeRange || ''}${classItem.building ? `, ${classItem.building}` : ''}${classItem.location ? `, ${classItem.location}` : ''}`,
        subTitle: classItem.pairNumber || '',
        status,
        percent
      };
    });
  };

  return (
    <Panel mode="secondary" className="wrap">
      {contextHolder}
      <Flex direction="column" align="stretch" gap={5}>
        <Container>
          <Flex justify="end" style={{ marginBottom: '10px' }}>
            <Button onClick={handleLogout}>Выйти</Button>
          </Flex>

          {/* Расписание на сегодня */}
          <CellList
            filled
            mode="island"
            header={
              <CellHeader
                titleStyle="caps"
                after={<Dot appearance="accent-red"></Dot>}
              >
                Расписание на сегодня {todaySchedule?.date_dd_mm}
              </CellHeader>
            }
          >
            {scheduleLoading ? (
              <CellSimple><Spinner /></CellSimple>
            ) : todaySchedule ? (
              todaySchedule.schedule.length > 0 ? (
                <CellSimple showChevron>
                  <Steps
                    direction="vertical"
                    items={formatScheduleForSteps(todaySchedule)}
                    percent={calculateActivePairProgress(todaySchedule)}
                  />
                </CellSimple>
              ) : (
                <CellSimple>
                  На сегодня занятий нет
                  <Button
                    type="link"
                    onClick={() => !scheduleLoading && fetchTodaySchedule(user?.id)}
                    style={{ marginTop: '10px' }}
                    disabled={scheduleLoading}
                  >
                    Обновить
                  </Button>
                </CellSimple>
              )
            ) : (
              <CellSimple>
                Расписание не загружено
                <Button
                  type="link"
                  onClick={() => !scheduleLoading && fetchTodaySchedule(user?.id)}
                  style={{ marginTop: '10px' }}
                  disabled={scheduleLoading}
                >
                  Загрузить
                </Button>
              </CellSimple>
            )}
          </CellList>
        </Container>

        {/* <Divider></Divider> */}

        <Divider></Divider>

        <Container>
          <CellList
            filled
            mode="island"
            header={
              <CellHeader titleStyle="caps">Ближайшие дедлайны</CellHeader>
            }
          >
            <CellSimple
              after={<Tag color="error">{"19.08"}</Tag>}
              title="Основы программирования"
              subtitle="ЛР №5. «Множественное наследование в языке С++»"
            ></CellSimple>
            <CellSimple
              after={<Tag color="warning">{11.11}</Tag>}
              title="Основы программирования"
              subtitle="ЛР №5Д. «Виртуальные функции и абстрактные классы»"
            ></CellSimple>
            <CellSimple
              after={<Tag color="success">{14.12}</Tag>}
              title="Основы программирования"
              subtitle="ЛР №5Д. «Виртуальные функции и абстрактные классы»"
            ></CellSimple>
          </CellList>
        </Container>

        <Divider></Divider>

        <Container>
          <CellList
            filled
            mode="island"
            header={<CellHeader titleStyle="caps">Уведомления</CellHeader>}
          >
            <CellSimple
              title="Алгоритмы и структуры данных"
              after={<Badge status="error"></Badge>}
              subtitle={
                <a
                  href="https://pro.guap.ru/inside/student/tasks/168453"
                  rel="noreferrer"
                  target="_blank"
                >
                  <EllipsisText maxLines={1}>
                    ЛАБОРАТОРНАЯ РАБОТА №1 «АНАЛИЗ СЛОЖНОСТИ АЛГОРИТМОВ»
                  </EllipsisText>
                </a>
              }
            ></CellSimple>
            <CellSimple
              title="Алгоритмы и структуры данных"
              after={<Badge status="warning"></Badge>}
              subtitle={
                <a
                  href="https://pro.guap.ru/inside/student/tasks/168453"
                  rel="noreferrer"
                  target="_blank"
                >
                  <EllipsisText maxLines={1}>
                    ЛАБОРАТОРНАЯ РАБОТА №1 «АНАЛИЗ СЛОЖНОСТИ АЛГОРИТМОВ»
                  </EllipsisText>
                </a>
              }
            ></CellSimple>
            <CellSimple
              title="Алгоритмы и структуры данных"
              after={<Badge status="warning"></Badge>}
              subtitle={
                <a
                  href="https://pro.guap.ru/inside/student/tasks/168453"
                  rel="noreferrer"
                  target="_blank"
                >
                  <EllipsisText maxLines={1}>
                    ЛАБОРАТОРНАЯ РАБОТА №1 «АНАЛИЗ СЛОЖНОСТИ АЛГОРИТМОВ»
                  </EllipsisText>
                </a>
              }
            ></CellSimple>
          </CellList>
        </Container>
      </Flex>
    </Panel>
  );
}
