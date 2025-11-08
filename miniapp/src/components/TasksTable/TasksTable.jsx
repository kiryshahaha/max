
import styles from './TasksTable.module.css';

export default function TasksTable({ tasks, getTaskStatusClass, getDeadlineClass }) {
  return (
    <div className={styles.tasksContainer}>
      <div className={styles.tasksHeader}>
        <h3 className={styles.tasksTitle}>Найдено заданий: {tasks.length}</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дисциплина</th>
              <th>Номер</th>
              <th>Название задания</th>
              <th>Статус</th>
              <th>Баллы</th>
              <th>Тип задания</th>
              <th>Доп. статус</th>
              <th>Дедлайн</th>
              <th>Обновлено</th>
              <th>Преподаватель</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={index}>
                <td>
                  {task.subjectLink ? (
                    <a 
                      href={task.subjectLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.subjectLink}
                    >
                      {task.subject}
                    </a>
                  ) : (
                    task.subject
                  )}
                </td>
                <td className={styles.numberCell}>
                  {task.taskNumber}
                </td>
                <td>
                  {task.taskLink ? (
                    <a 
                      href={task.taskLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      {task.taskName}
                    </a>
                  ) : (
                    task.taskName
                  )}
                </td>
                <td>
                  <span className={getTaskStatusClass(task.statusClass)}>
                    {task.status}
                  </span>
                </td>
                <td className={styles.scoreCell}>
                  {task.score}
                </td>
                <td>
                  {task.taskType}
                </td>
                <td>
                  {task.additionalStatus}
                </td>
                <td className={getDeadlineClass(task.deadlineClass)}>
                  {task.deadline}
                </td>
                <td className={styles.updatedAtCell}>
                  {task.updatedAt}
                </td>
                <td>
                  {task.teacherLink ? (
                    <a 
                      href={task.teacherLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.teacherLink}
                    >
                      {task.teacher}
                    </a>
                  ) : (
                    task.teacher
                  )}
                </td>
                <td>
                  {task.actionButton && (
                    <a 
                      href={task.actionButton} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.actionLink}
                      title="Просмотреть задание"
                    >
                      👁️
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}