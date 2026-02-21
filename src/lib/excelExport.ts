import * as XLSX from 'xlsx';
import { format, differenceInMinutes } from 'date-fns';

export function exportEquipmentChecklistExcel(equipment: any, tasks: any[]) {
  const wsData: any[][] = [];

  // 1. Equipment Name
  wsData.push([`Equipment Name: ${equipment.name} (${equipment.code})`]);
  
  // 2. Header Row
  wsData.push(["Checkpoint", "Daily", "Weekly", "Monthly", "3 Month", "6 Month", "Yearly"]);

  // 3. Task Rows
  tasks.forEach((task) => {
    const row = [task.taskName, "", "", "", "", "", ""];
    
    // Check frequency and mark with checkmark
    switch (task.frequency) {
      case 'daily': row[1] = '✓'; break;
      case 'weekly': row[2] = '✓'; break;
      case 'monthly': row[3] = '✓'; break;
      case 'quarterly': row[4] = '✓'; break;
      case 'semi_annually': row[5] = '✓'; break;
      case 'yearly': row[6] = '✓'; break;
    }
    
    wsData.push(row);
  });

  // 4. Safety Measures Row
  wsData.push([`Safety Measures: ${equipment.safetyMeasures || 'N/A'}`]);

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  const workbook = XLSX.utils.book_new();

  // Merge Equipment Name cell across all columns
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
  
  // Merge Safety Measures cell across all columns (last row)
  const lastRowIdx = wsData.length - 1;
  worksheet['!merges'].push({ s: { r: lastRowIdx, c: 0 }, e: { r: lastRowIdx, c: 6 } });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 40 }, // Checkpoint
    { wch: 10 }, // Daily
    { wch: 10 }, // Weekly
    { wch: 10 }, // Monthly
    { wch: 10 }, // 3 Month
    { wch: 10 }, // 6 Month
    { wch: 10 }, // Yearly
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Checklist');
  XLSX.writeFile(workbook, `Checklist_${equipment.code}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportEquipmentTasksExcel({ equipment, tasks }: { equipment: any, tasks: any[] }) {
  const sheetData = tasks.map((task) => ({
    'Task ID': task.taskId,
    'Task Name': task.taskName,
    'Frequency': task.frequency || '—',
    'Task Detail': task.taskDetail || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();

  if (sheetData.length > 0) {
    const colWidths = Object.keys(sheetData[0]).map((key) => ({ wch: key === 'Task Detail' ? 40 : 20 }));
    worksheet['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, `${equipment.code}_Tasks_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportTaskReportExcel({ tasks, equipment, groupBy }: { tasks: any[], equipment: any[], groupBy: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sheetData: any[] = [];
  
  tasks.forEach((task) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eq = equipment.find((e: any) => e.id === task.equipmentId);
    let group = "All Tasks";
    if (groupBy === "category") {
      group = eq?.category?.name || "Uncategorized";
    } else if (groupBy === "equipment") {
      group = eq ? `${eq.name} (${eq.code})` : "Unknown Equipment";
    }

    sheetData.push({
      'Grouping': group,
      'Equipment Code': eq?.code || '—',
      'Equipment Name': eq?.name || '—',
      'Task ID': task.taskId,
      'Task Name': task.taskName,
      'Frequency': task.frequency || '—',
      'Task Detail': task.taskDetail || '—',
    });
  });

  if (groupBy === "none") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sheetData = sheetData.map(({ Grouping, ...rest }) => rest);
  } else {
    sheetData.sort((a, b) => a.Grouping.localeCompare(b.Grouping));
  }

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();

  if (sheetData.length > 0) {
    const colWidths = Object.keys(sheetData[0]).map((key) => ({ wch: key === 'Task Detail' ? 40 : 20 }));
    worksheet['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, `Task_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportEquipmentReportExcel({ equipment, groupBy }: { equipment: any[], groupBy: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sheetData: any[] = [];
  
  equipment.forEach((eq) => {
    let group = "All Equipment";
    if (groupBy === "category") {
      group = eq?.category?.name || "Uncategorized";
    }

    sheetData.push({
      'Grouping': group,
      'Code': eq.code || '—',
      'Name': eq.name || '—',
      'Category': eq.category?.name || '—',
      'Capacity': eq.capacity || '—',
      'Model': eq.model || '—',
      'Serial Number': eq.serialNumber || '—',
      'Brand': eq.brand || '—',
      'Location': eq.location || '—',
      'Running Hours': eq.runningHours || '—',
      'Test Cert No': eq.testCertNumber || '—',
      'Test Cert Validity': eq.testCertValidity || '—',
      'Test Cert Applied': eq.testCertApplied || '—',
      'Status': eq.status || '—',
      'Safety Measures': eq.safetyMeasures || '—',
      'Description': eq.description || '—',
    });
  });

  if (groupBy === "none") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sheetData = sheetData.map(({ Grouping, ...rest }) => rest);
  } else {
    sheetData.sort((a, b) => a.Grouping.localeCompare(b.Grouping));
  }

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();

  if (sheetData.length > 0) {
    const colWidths = Object.keys(sheetData[0]).map((key) => ({ wch: key === 'Description' ? 40 : 20 }));
    worksheet['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');
  XLSX.writeFile(workbook, `Equipment_Registry_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToExcel(data: any[], filename: string = 'Export') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  if (data.length > 0) {
    const colWidths = Object.keys(data[0]).map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

export function exportMaintenanceExcel(data: any[], type: 'corrective' | 'preventive', filename: string = 'Maintenance_Report') {
  let sheetData: any[] = [];

  if (type === 'corrective') {
    sheetData = data.map((item) => {
      const information = item.informationDate ? new Date(item.informationDate) : null;
      const start = item.serviceStartDate ? new Date(item.serviceStartDate) : null;
      const end = item.serviceEndDate ? new Date(item.serviceEndDate) : null;

      let maintenanceTimeStr = '—';
      if (start && end) {
        const mins = differenceInMinutes(end, start);
        maintenanceTimeStr = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }

      let breakdownTimeStr = '—';
      if (information && end) {
        const mins = differenceInMinutes(end, information);
        breakdownTimeStr = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }

      return {
        'Equipment Code': item.equipment?.code || '—',
        'Equipment Name': item.equipment?.name || '—',
        'Category': item.equipment?.category?.name || '—',
        'Model': item.equipment?.model || '—',
        'Serial Number': item.equipment?.serialNumber || '—',
        'Capacity': item.equipment?.capacity || '—',
        'Log Date': information ? format(information, 'dd MMM yyyy') : '—',
        'Service Start': start ? format(start, 'dd MMM yyyy HH:mm') : '—',
        'Service End': end ? format(end, 'dd MMM yyyy HH:mm') : '—',
        'Maintenance Duration': maintenanceTimeStr,
        'Total Breakdown': breakdownTimeStr,
        'Problem Type': item.problemType?.toUpperCase() || '—',
        'Work Type': item.workType?.toUpperCase() || '—',
        'Problem Description': item.problemDescription || '—',
        'Solution Details': item.solutionDetails || '—',
        'Used Parts': item.usedParts || '—',
        'Remarks': item.remarks || '',
      };
    });
  } else {
    // Preventive / Scheduled / Predictive
    sheetData = data.map((item) => {
      const date = item.maintenanceDate ? new Date(item.maintenanceDate) : 
                   item.performedAt ? new Date(item.performedAt) : null;

      return {
        'Equipment Code': item.equipment?.code || '—',
        'Equipment Name': item.equipment?.name || '—',
        'Category': item.equipment?.category?.name || '—',
        'Model': item.equipment?.model || '—',
        'Serial Number': item.equipment?.serialNumber || '—',
        'Maintenance Date': date ? format(date, 'dd MMM yyyy') : '—',
        'Maintenance Type': item.type?.toUpperCase(),
        'Task Name': item.task?.taskName || '—',
        'Task Frequency': item.task?.frequency?.toUpperCase() || '—',
        'Details/Observations': item.maintenanceDetails || item.problemDescription || '—',
        'Parts Used': item.usedParts || '—',
        'Work Performed': item.solutionDetails || '—',
        'Remarks': item.remarks || '',
      };
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  if (sheetData.length > 0) {
    const colWidths = Object.keys(sheetData[0]).map((key) => {
        if (['Problem Description', 'Solution Details', 'Details/Observations', 'Work Performed'].includes(key)) return { wch: 40 };
        return { wch: 20 };
    });
    worksheet['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance Log');

  XLSX.writeFile(workbook, `KR_Steel_${type}_Maintenance_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}
