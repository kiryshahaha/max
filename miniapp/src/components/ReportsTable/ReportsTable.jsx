import styles from './ReportsTable.module.css';

export default function ReportsTable({ reports, getReportStatusClass }) {
  return (
    <div className={styles.reportsContainer}>
      <div className={styles.reportsHeader}>
        <h3 className={styles.reportsTitle}>Найдено отчетов: {reports.length}</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Действия</th>
              <th>№</th>
              <th>Задание</th>
              <th>Преподаватель</th>
              <th>Статус</th>
              <th>Баллы</th>
              <th>Дата загрузки</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => (
              <tr key={index}>
                <td>
                  <div className={styles.reportActions}>
                    {report.downloadButton && (
                      <a 
                        href={report.downloadButton} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.downloadLink}
                        title="Скачать отчет"
                      >
                        📥
                      </a>
                    )}
                    {report.removeButton && (
                      <a 
                        href={report.removeButton} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.removeLink}
                        title="Удалить отчет"
                      >
                        🗑️
                      </a>
                    )}
                  </div>
                </td>
                <td className={styles.numberCell}>
                  {report.number}
                </td>
                <td>
                  {report.taskLink ? (
                    <a 
                      href={report.taskLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      {report.taskName}
                    </a>
                  ) : (
                    report.taskName
                  )}
                </td>
                <td>
                  {report.teacherLink ? (
                    <a 
                      href={report.teacherLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.teacherLink}
                    >
                      {report.teacher}
                    </a>
                  ) : (
                    report.teacher
                  )}
                </td>
                <td>
                  <span className={getReportStatusClass(report.statusClass)}>
                    {report.status}
                  </span>
                </td>
                <td className={styles.scoreCell}>
                  {report.score}
                </td>
                <td className={styles.uploadDateCell}>
                  {report.uploadDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}