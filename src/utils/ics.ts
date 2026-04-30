export function generateICS(title: string, dueDate: Date, description: string): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CarMaintenanceTracker//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@carmaintenance`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART;VALUE=DATE:${dueDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
