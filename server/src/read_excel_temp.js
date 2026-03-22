import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');

const workbook = xlsx.readFile('/Users/mridulgupta2911/Downloads/huihui/client/list of students.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

console.log('Total Rows:', data.length);
if (data.length > 0) {
    console.log('Headers:', Object.keys(data[0]));
    console.log('Sample Data 1:', data[0]);
}
