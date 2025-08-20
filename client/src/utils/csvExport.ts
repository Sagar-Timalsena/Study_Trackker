import type { StudySession, Subject } from "@shared/schema";

export interface SessionWithSubject extends StudySession {
  subject: Subject;
}

export interface CSVExportData {
  sessions: SessionWithSubject[];
  subjects: Subject[];
}

export const exportToCSV = (data: CSVExportData, filename: string = 'study-tracker-export') => {
  // Create subject-wise daily data
  const subjectData: Record<string, Record<string, number>> = {};
  
  // Initialize subjects
  data.subjects.forEach(subject => {
    subjectData[subject.name] = {};
  });

  // Process sessions
  data.sessions.forEach(session => {
    const date = new Date(session.sessionDate).toLocaleDateString('en-US');
    const subjectName = session.subject.name;
    
    if (!subjectData[subjectName]) {
      subjectData[subjectName] = {};
    }
    
    if (!subjectData[subjectName][date]) {
      subjectData[subjectName][date] = 0;
    }
    
    subjectData[subjectName][date] += parseFloat(session.duration as string);
  });

  // Get all unique dates
  const allDates = new Set<string>();
  data.sessions.forEach(session => {
    allDates.add(new Date(session.sessionDate).toLocaleDateString('en-US'));
  });
  
  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Create CSV content
  let csvContent = 'Subject,Total Hours,' + sortedDates.join(',') + '\n';
  
  // Add data for each subject
  Object.keys(subjectData).forEach(subjectName => {
    const subjectTotalHours = Object.values(subjectData[subjectName])
      .reduce((sum, hours) => sum + hours, 0);
    
    let row = `"${subjectName}",${subjectTotalHours.toFixed(2)}`;
    
    sortedDates.forEach(date => {
      const hours = subjectData[subjectName][date] || 0;
      row += `,${hours.toFixed(2)}`;
    });
    
    csvContent += row + '\n';
  });

  // Calculate daily totals
  let totalRow = '"Total",';
  const grandTotal = Object.values(subjectData)
    .reduce((total, subjectDays) => 
      total + Object.values(subjectDays).reduce((sum, hours) => sum + hours, 0), 0
    );
  
  totalRow += grandTotal.toFixed(2);
  
  sortedDates.forEach(date => {
    const dayTotal = Object.values(subjectData)
      .reduce((total, subjectDays) => total + (subjectDays[date] || 0), 0);
    totalRow += `,${dayTotal.toFixed(2)}`;
  });
  
  csvContent += totalRow + '\n';

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDetailedSessionsToCSV = (sessions: SessionWithSubject[], filename: string = 'study-sessions-detailed') => {
  const csvHeaders = 'Date,Subject,Duration (Hours),Notes,Session Time\n';
  
  const csvRows = sessions.map(session => {
    const date = new Date(session.sessionDate).toLocaleDateString('en-US');
    const time = new Date(session.sessionDate).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const subject = `"${session.subject.name}"`;
    const duration = parseFloat(session.duration as string).toFixed(2);
    const notes = `"${(session.notes || '').replace(/"/g, '""')}"`;
    
    return `${date},${subject},${duration},${notes},${time}`;
  }).join('\n');
  
  const csvContent = csvHeaders + csvRows;
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};