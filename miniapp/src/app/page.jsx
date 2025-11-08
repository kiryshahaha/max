'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import TasksTable from '@/components/TasksTable/TasksTable';
import ReportsTable from '@/components/ReportsTable/ReportsTable';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setStatus('❌ Введите логин и пароль');
      return;
    }

    setIsLoading(true);
    setStatus('⏳ Выполняется вход и получение данных...');

    try {
      const endpoint = activeTab === 'tasks' ? '/api/post-tasks' : '/api/post-reports';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        if (activeTab === 'tasks' && data.tasks) {
          setTasks(data.tasks);
          setStatus(`✅ Получено ${data.tasks.length} задач`);
        } else if (activeTab === 'reports' && data.reports) {
          setReports(data.reports);
          setStatus(`✅ Получено ${data.reports.length} отчетов`);
        } else {
          setStatus(data.message || 'Данные успешно получены');
        }
      } else {
        setStatus(`❌ ${data.message || 'Ошибка получения данных'}`);
      }
    } catch (err) {
      console.error('Ошибка:', err);
      setStatus(`❌ Ошибка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (!username || !password) {
      setStatus('❌ Для обновления данных введите логин и пароль');
      return;
    }

    setIsLoading(true);
    setStatus('⏳ Обновляем данные...');

    try {
      const endpoint = activeTab === 'tasks' ? '/api/tasks' : '/api/reports';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        if (activeTab === 'tasks' && data.tasks) {
          setTasks(data.tasks);
          setStatus(`✅ Обновлено ${data.tasks.length} задач`);
        } else if (activeTab === 'reports' && data.reports) {
          setReports(data.reports);
          setStatus(`✅ Обновлено ${data.reports.length} отчетов`);
        } else {
          setStatus(data.message || 'Данные успешно обновлены');
        }
      } else {
        setStatus(`❌ ${data.message || 'Ошибка обновления данных'}`);
      }
    } catch (err) {
      console.error('Ошибка:', err);
      setStatus(`❌ Ошибка обновления: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = () => {
    if (status.includes('✅')) return styles.statusSuccess;
    if (status.includes('❌')) return styles.statusError;
    if (status.includes('⏳')) return styles.statusLoading;
    return '';
  };

  const getTaskStatusClass = (statusClass) => {
    if (statusClass.includes('bg-success')) return styles.statusSuccess;
    if (statusClass.includes('bg-warning')) return styles.statusWarning;
    if (statusClass.includes('bg-danger')) return styles.statusError;
    return styles.statusDefault;
  };

  const getReportStatusClass = (statusClass) => {
    if (statusClass.includes('bg-success')) return styles.statusSuccess;
    if (statusClass.includes('bg-warning')) return styles.statusWarning;
    if (statusClass.includes('bg-danger')) return styles.statusError;
    return styles.statusDefault;
  };

  const getDeadlineClass = (deadlineClass) => {
    if (deadlineClass.includes('text-warning')) return styles.deadlineWarning;
    if (deadlineClass.includes('text-danger')) return styles.deadlineError;
    return styles.deadlineDefault;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Вход в ЛК ГУАП</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />
        <button 
          type="submit" 
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Загрузка...' : 'Войти и получить данные'}
        </button>
      </form>

      {/* Табы для переключения между задачами и отчетами */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Задания ({tasks.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'reports' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Отчеты ({reports.length})
        </button>
      </div>
      
      {status && (
        <div className={`${styles.status} ${getStatusClass()}`}>
          {status}
          {(tasks.length > 0 || reports.length > 0) && (
            <button 
              onClick={handleRefreshData}
              className={styles.refreshButton}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔄 Обновить'}
            </button>
          )}
        </div>
      )}

      {/* Блок задач */}
      {activeTab === 'tasks' && tasks.length > 0 && (
        <>
          <div className={styles.tasksHeader}>
            <h3 className={styles.tasksTitle}>Найдено заданий: {tasks.length}</h3>
            <button 
              onClick={handleRefreshData}
              className={styles.refreshButtonLarge}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Обновление...' : '🔄 Обновить задачи'}
            </button>
          </div>
          <TasksTable 
            tasks={tasks}
            getTaskStatusClass={getTaskStatusClass}
            getDeadlineClass={getDeadlineClass}
          />
        </>
      )}

      {/* Блок отчетов */}
      {activeTab === 'reports' && reports.length > 0 && (
        <>
          <div className={styles.reportsHeader}>
            <h3 className={styles.reportsTitle}>Найдено отчетов: {reports.length}</h3>
            <button 
              onClick={handleRefreshData}
              className={styles.refreshButtonLarge}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Обновление...' : '🔄 Обновить отчеты'}
            </button>
          </div>
          <ReportsTable 
            reports={reports}
            getReportStatusClass={getReportStatusClass}
          />
        </>
      )}
    </div>
  );
}