import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, differenceInMinutes } from 'date-fns';
import { getTaskStatus } from './taskUtils';
import { LOGO_BASE64 } from './logoData';

const C = {
  navy: '0C2C58',
  accent: '1CA5CE',
  pasteLight: 'FAF9F7',
  rule: 'B4AFA0',
  white: 'FFFFFF',
  muted: '646E78',
};

function addExcelHeader(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, title: string, subtitle?: string) {
  // Push table down by 7 rows
  worksheet.spliceRows(1, 0, [], [], [], [], [], [], []);
  
  const logoId = workbook.addImage({
    base64: `data:image/png;base64,${LOGO_BASE64}`,
    extension: 'png',
  });
  
  worksheet.addImage(logoId, {
    tl: { col: 0.2, row: 0.2 },
    ext: { width: 50, height: 50 }
  });

  worksheet.getCell('B2').value = 'KR STEEL';
  worksheet.getCell('B2').font = { name: 'Arial', size: 16, bold: true, color: { argb: C.navy } };
  
  worksheet.getCell('B3').value = 'SHIP RECYCLING FACILITY';
  worksheet.getCell('B3').font = { name: 'Arial', size: 8, color: { argb: C.accent } };

  worksheet.getCell('F2').value = 'GRIT - GEAR RELIABILITY & INTERVENTION TRACKER';
  worksheet.getCell('F2').font = { name: 'Arial', size: 10, bold: true, color: { argb: C.navy } };

  worksheet.getCell('F3').value = '';
  worksheet.getCell('F3').font = { name: 'Arial', size: 8, color: { argb: C.accent } };

  worksheet.getCell('A5').value = title.toUpperCase();  worksheet.getCell('A5').font = { name: 'Arial', size: 14, bold: true, color: { argb: C.navy } };
  
  if (subtitle) {
    worksheet.getCell('A6').value = subtitle;
    worksheet.getCell('A6').font = { name: 'Arial', size: 10, color: { argb: C.muted } };
  }
  
  worksheet.getCell('F6').value = `PRINTED: ${format(new Date(), "dd MMM yyyy, HH:mm")}`;
  worksheet.getCell('F6').font = { name: 'Arial', size: 8, color: { argb: C.muted } };
  
  for(let i = 1; i <= Math.max(8, worksheet.columnCount); i++) {
    worksheet.getCell(6, i).border = { bottom: { style: 'thin', color: { argb: C.rule } } };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSheetFromJson(worksheet: ExcelJS.Worksheet, sheetData: any[]) {
  if (sheetData.length === 0) return;
  
  // Set print-ready page setup
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
  };

  const keys = Object.keys(sheetData[0]);
  worksheet.columns = keys.map(key => {
    const k = key.toLowerCase();
    const isWide = k.includes('name') || k.includes('description') || k.includes('detail') || k.includes('observations') || k.includes('performed') || k.includes('remarks') || k.includes('parts');
    return {
      header: key,
      key: key,
      width: isWide ? 45 : 18
    };
  });
  
  worksheet.addRows(sheetData);
  
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
    cell.font = { bold: true, color: { argb: C.white } };
    cell.border = { bottom: { style: 'thin', color: { argb: C.rule } } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });

  // Alternate row styles and general borders
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFEAE7DF' } }
        };
        // Ensure text wraps cleanly for multi-line content
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      });
      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDFDFC' } };
        });
      }
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportEquipmentChecklistExcel(equipment: any, tasks: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Checklist');

  // Instead of standard grid, this is a special grid for checklist
  worksheet.columns = [
    { header: 'Checkpoint', key: 'checkpoint', width: 40 },
    { header: 'Daily', key: 'daily', width: 10 },
    { header: 'Weekly', key: 'weekly', width: 10 },
    { header: 'Monthly', key: 'monthly', width: 10 },
    { header: '3 Month', key: 'quarterly', width: 10 },
    { header: '6 Month', key: 'semi_annually', width: 10 },
    { header: 'Yearly', key: 'yearly', width: 10 },
    { header: '5 Yearly', key: 'five_yearly', width: 10 },
  ];

  tasks.forEach((task) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = { checkpoint: task.taskName };
    switch (task.frequency) {
      case 'daily': row.daily = '✓'; break;
      case 'weekly': row.weekly = '✓'; break;
      case 'monthly': row.monthly = '✓'; break;
      case 'quarterly': row.quarterly = '✓'; break;
      case 'semi_annually': row.semi_annually = '✓'; break;
      case 'yearly': row.yearly = '✓'; break;
      case 'five_yearly': row.five_yearly = '✓'; break;
    }
    worksheet.addRow(row);
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
    cell.font = { bold: true, color: { argb: C.white } };
  });

  // Add the extra info rows (safety measures)
  worksheet.addRow([]);
  const safetyRow = worksheet.addRow([`Safety Measures: ${equipment.safetyMeasures || 'N/A'}`]);
  worksheet.mergeCells(`A${safetyRow.number}:H${safetyRow.number}`);
  safetyRow.font = { bold: true };

  addExcelHeader(workbook, worksheet, `Equipment Checklist`, `Equipment Name: ${equipment.name} (${equipment.code})`);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Checklist_${equipment.code}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportEquipmentTasksExcel({ equipment, tasks }: { equipment: any, tasks: any[] }) {
  const sheetData = tasks.map((task, index) => {
    const statusText = getTaskStatus(task);
    return {
      'Sl No.': index + 1,
      'Task ID': task.taskId,
      'Task Name': task.taskName,
      'Frequency': task.frequency?.toUpperCase() || '—',
      'Last Done Date': task.lastCompletedDate ? format(new Date(task.lastCompletedDate), 'dd MMM yyyy') : 'NEVER',
      'Next Due Date': task.nextDueDate ? format(new Date(task.nextDueDate), 'dd MMM yyyy') : '—',
      'Criticality': task.criticality?.toUpperCase() || '—',
      'Status': statusText,
      'Remarks': task.taskDetail || '—',
    };
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');
  buildSheetFromJson(worksheet, sheetData);
  addExcelHeader(workbook, worksheet, `Asset Task List: ${equipment.name}`, `Code: ${equipment.code} · Location: ${equipment.location}`);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${equipment.code}_Tasks_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportTaskReportExcel({ tasks, equipment, groupBy }: { tasks: any[], equipment: any[], groupBy: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sheetData: any[] = [];
  tasks.forEach((task, index) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eq = equipment.find((e: any) => e.id === task.equipmentId);
    let group = "All Tasks";
    if (groupBy === "category") {
      group = eq?.category?.name || "Uncategorized";
    } else if (groupBy === "equipment") {
      group = eq ? `${eq.name} (${eq.code})` : "Unknown Equipment";
    }
    const statusText = getTaskStatus(task);
    sheetData.push({
      'Grouping': group,
      'Sl No.': index + 1,
      'Equipment Code': eq?.code || '—',
      'Equipment Name': eq?.name || '—',
      'Task ID': task.taskId,
      'Task Name': task.taskName,
      'Frequency': task.frequency?.toUpperCase() || '—',
      'Last Done Date': task.lastCompletedDate ? format(new Date(task.lastCompletedDate), 'dd MMM yyyy') : 'NEVER',
      'Next Due Date': task.nextDueDate ? format(new Date(task.nextDueDate), 'dd MMM yyyy') : '—',
      'Criticality': task.criticality?.toUpperCase() || '—',
      'Status': statusText,
      'Remarks': task.taskDetail || '—',
    });
  });

  if (groupBy === "none") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sheetData = sheetData.map(({ Grouping, ...rest }) => rest);
  } else {
    sheetData.sort((a, b) => a.Grouping.localeCompare(b.Grouping));
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');
  buildSheetFromJson(worksheet, sheetData);
  addExcelHeader(workbook, worksheet, `Scheduled Maintenance Tasks`, `Grouping: ${groupBy}`);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Task_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportEquipmentReportExcel({ equipment, groupBy }: { equipment: any[], groupBy: string }) {
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
      'Model': eq.model || '—',
      'Serial Number': eq.serialNumber || '—',
      'Capacity': eq.capacity || '—',
      'Unit': eq.unit || '—',
      'Quantity': eq.quantity || '—',
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

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Equipment');
  buildSheetFromJson(worksheet, sheetData);
  addExcelHeader(workbook, worksheet, `Shipyard Equipment Registry`, `Master Asset List · Grouped by ${groupBy}`);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Equipment_Registry_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportToExcel(data: any[], filename: string = 'Export') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  buildSheetFromJson(worksheet, data);
  addExcelHeader(workbook, worksheet, filename);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportMaintenanceExcel(data: any[], type: 'corrective' | 'preventive', filename: string = 'Maintenance_Report') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sheetData: any[] = [];

  if (type === 'corrective') {
    sheetData = data.map((item, index) => {
      const information = item.informationDate ? new Date(item.informationDate) : null;
      const start = item.serviceStartDate ? new Date(item.serviceStartDate) : null;
      const end = item.serviceEndDate ? new Date(item.serviceEndDate) : null;

      let maintenanceTimeStr = '—';
      if (start && end) {
        const mins = differenceInMinutes(end, start);
        maintenanceTimeStr = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }

      return {
        'Sl No.': index + 1,
        'Equipment Code': item.equipment?.code || '—',
        'Equipment Name': item.equipment?.name || '—',
        'Category': item.equipment?.category?.name || '—',
        'Model': item.equipment?.model || '—',
        'Serial Number': item.equipment?.serialNumber || '—',
        'Capacity': item.equipment?.capacity || '—',
        'Service Start': start ? format(start, 'dd MMM yyyy HH:mm') : '—',
        'Service End': end ? format(end, 'dd MMM yyyy HH:mm') : '—',
        'Maintenance Duration': maintenanceTimeStr,
        'Problem Type': item.problemType?.toUpperCase() || '—',
        'Work Type': item.workType?.toUpperCase() || '—',
        'Problem Description': item.problemDescription || '—',
        'Solution Details': item.solutionDetails || '—',
        'Used Parts': item.usedParts || '—',
        'Remarks': item.remarks || '',
      };
    });
  } else {
    sheetData = data.map((item, index) => {
      const date = item.maintenanceDate ? new Date(item.maintenanceDate) : null;
      
      let wasDateOverdue = false;
      if (item.targetDate && item.maintenanceDate) {
         const targetDateOnly = new Date(item.targetDate);
         targetDateOnly.setHours(0,0,0,0);
         const maintDateOnly = new Date(item.maintenanceDate);
         maintDateOnly.setHours(0,0,0,0);
         wasDateOverdue = maintDateOnly > targetDateOnly;
      }
      const performanceStatus = wasDateOverdue ? "LATE" : "ON-TIME";

      let nextDueDateStr = '—';
      if (item.task && item.task.nextDueDate) {
          nextDueDateStr = format(new Date(item.task.nextDueDate), 'dd MMM yyyy');
      }

      return {
        'Sl No.': index + 1,
        'Log ID': item.id,
        'Asset Code': item.equipment?.code || '—',
        'Asset Name': item.equipment?.name || '—',
        'Done Date': date ? format(date, 'dd MMM yyyy') : '—',
        'Maintenance Type': item.type?.toUpperCase(),
        'Frequency': item.maintenanceDetails || item.task?.frequency?.toUpperCase() || '—',
        'Next Due Date': nextDueDateStr,
        'Performance Status': performanceStatus,
        'Work Performed': item.solutionDetails || '—',
        'Parts Used': item.usedParts || '—',
        'Remarks': item.remarks || '',
      };
    });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Maintenance Log');
  buildSheetFromJson(worksheet, sheetData);
  const title = type === "corrective" ? "Corrective (Breakdown) Maintenance Report" : "Preventive (Scheduled) Maintenance Report";
  addExcelHeader(workbook, worksheet, title, `KR Steel Ship Recycling Yard · Maintenance Operations Log`);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `KR_Steel_${type}_Maintenance_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
}
