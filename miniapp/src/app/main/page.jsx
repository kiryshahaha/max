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
  Panel 
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
    try {
      setScheduleLoading(true);
      console.log('📅 Запрашиваем расписание для пользователя:', userId);

      // 1. Сначала проверяем бэкенд
      const backendResponse = await fetch(`http://127.0.0.1:8000/schedule/today?uid=${userId}`);
      
      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.status}`);
      }

      const backendData = await backendResponse.json();
      console.log('📊 Ответ от бэкенда:', backendData);

      const currentDate = new Date().toISOString().split('T')[0];

      // 2. Проверяем условия для обращения к парсеру
      if (
        !backendData.success || 
        !backendData.schedule || 
        backendData.schedule.schedule.length === 0 || 
        backendData.schedule.date !== currentDate
      ) {
        console.log('🔄 Обращаемся к парсеру для получения актуального расписания');
        await fetchFromParser(userId, currentDate);
      } else {
        // 3. Используем данные из бэкенда
        console.log('✅ Используем актуальное расписание из бэкенда');
        setTodaySchedule(backendData.schedule);
      }

    } catch (error) {
      console.error('❌ Ошибка получения расписания:', error);
      messageApi.error('Ошибка загрузки расписания');
    } finally {
      setScheduleLoading(false);
    }
  };

  const fetchFromParser = async (userId, currentDate) => {
    try {
      const username = user?.user_metadata?.original_username || user?.user_metadata?.username;
      const password = localStorage.getItem('guap_password');

      if (!username || !password) {
        messageApi.error('Данные для авторизации не найдены');
        return;
      }

      console.log('🚀 Отправляем запрос к парсеру:', { username, date: currentDate });

      const parserResponse = await fetch('/api/post-daily-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          date: currentDate,
          saveToDatabase: true
        }),
      });

      if (!parserResponse.ok) {
        throw new Error(`Parser error: ${parserResponse.status}`);
      }

      const parserData = await parserResponse.json();
      console.log('📊 Ответ от парсера:', parserData);

      if (parserData.success) {
        // Создаем объект расписания в формате бэкенда
        const scheduleObj = {
          date: currentDate,
          date_dd_mm: `${String(new Date().getDate()).padStart(2, '0')}.${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          day_name: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][new Date().getDay()],
          day_of_week: new Date().getDay(),
          schedule: parserData.schedule || []
        };

        setTodaySchedule(scheduleObj);
        messageApi.success('Расписание обновлено');
      } else {
        messageApi.error(parserData.message || 'Ошибка получения расписания');
      }

    } catch (error) {
      console.error('❌ Ошибка парсера:', error);
      messageApi.error('Ошибка обновления расписания');
    }
  };

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const username = session.user.user_metadata?.original_username || session.user.user_metadata?.username;
        
        if (username) {
          await fetch('http://localhost:3001/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          });
        }
      }

      await supabase.auth.signOut();
      localStorage.removeItem('guap_password');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      messageApi.error('Ошибка при выходе');
    }
  };

  const formatScheduleForSteps = (schedule) => {
    if (!schedule || !schedule.schedule) return [];

    return schedule.schedule.map((classItem, index) => ({
      title: classItem.subject || 'Не указано',
      description: `${classItem.timeRange || ''}${classItem.building ? `, ${classItem.building}` : ''}${classItem.location ? `, ${classItem.location}` : ''}`,
      subTitle: classItem.type || '',
      status: "wait" // Можно добавить логику для определения статуса
    }));
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
              <CellSimple>Загрузка расписания...</CellSimple>
            ) : todaySchedule && todaySchedule.schedule.length > 0 ? (
              <CellSimple showChevron>
                <Steps
                  direction="vertical"
                  items={formatScheduleForSteps(todaySchedule)}
                />
              </CellSimple>
            ) : (
              <CellSimple>
                На сегодня занятий нет
                <Button 
                  type="link" 
                  onClick={() => fetchTodaySchedule(user?.id)}
                  style={{ marginTop: '10px' }}
                >
                  Обновить
                </Button>
              </CellSimple>
            )}
          </CellList>
        </Container>

        <Divider></Divider>

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
