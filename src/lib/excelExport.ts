import * as XLSX from 'xlsx';
import { format, differenceInMinutes } from 'date-fns';

export function exportMaintenanceExcel(data: any[], type: 'corrective' | 'preventive', filename: string = 'Maintenance_Report') {
  let sheetData: any[] = [];

  if (type === 'corrective') {
    sheetData = data.map((item) => {
      const intervention = item.interventionDate ? new Date(item.interventionDate) : null;
      const start = item.serviceStartDate ? new Date(item.serviceStartDate) : null;
      const end = item.serviceEndDate ? new Date(item.serviceEndDate) : null;

      let maintenanceTimeStr = '—';
      if (start && end) {
        const mins = differenceInMinutes(end, start);
        maintenanceTimeStr = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }

      let shutdownTimeStr = '—';
      if (intervention && end) {
        const mins = differenceInMinutes(end, intervention);
        shutdownTimeStr = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }

      return {
        'Equipment Code': item.equipment?.code || '—',
        'Equipment Name': item.equipment?.name || '—',
        'Intervention Date/Time': intervention ? format(intervention, 'dd MMM yyyy HH:mm') : '—',
        'Service Start Date/Time': start ? format(start, 'dd MMM yyyy HH:mm') : '—',
        'Service End Date/Time': end ? format(end, 'dd MMM yyyy HH:mm') : '—',
        'Maintenance Time': maintenanceTimeStr,
        'Shutdown Time': shutdownTimeStr,
        'Problem Description': item.problemDescription || '—',
        'Solution Details': item.solutionDetails || '—',
        'Used Parts': item.usedParts || '—',
        'Work Type': item.workType || '—',
        'Problem Type': item.problemType || '—',
        'Remarks': item.remarks || '',
      };
    });
  } else {
    // Preventive / Scheduled / Predictive
    sheetData = data.map((item) => {
      return {
        'Equipment Code': item.equipment?.code || '—',
        'Equipment Name': item.equipment?.name || '—',
        'Maintenance Type': item.type,
        'Maintenance Date': item.performedAt ? format(new Date(item.performedAt), 'dd MMM yyyy HH:mm') : '—',
        'Job Name': item.job?.jobName || '—',
        'Job Frequency': item.job?.frequency || '—',
        'Job Code': item.job?.jobCode || '—',
        'Job Category': item.job?.category || '—',
      };
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  if (sheetData.length > 0) {
    const colWidths = Object.keys(sheetData[0]).map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}
