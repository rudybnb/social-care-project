import * as XLSX from 'xlsx';

interface SheetData {
    name: string;
    data: any[];
}

export const exportToExcel = (sheets: SheetData[], fileName: string) => {
    const wb = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
        const ws = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    XLSX.writeFile(wb, `${fileName}.xlsx`);
};
