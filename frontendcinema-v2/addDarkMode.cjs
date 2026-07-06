const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/pages/Login.tsx',
    'src/pages/Register.tsx',
    'src/pages/SeatSelection.tsx',
    'src/pages/Checkout.tsx',
    'src/pages/Confirmation.tsx',
    'src/pages/MovieDetail.tsx'
];

filesToProcess.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Root containers
    content = content.replace(/min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50/g, 'min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-slate-950 dark:to-slate-900 dark:text-white');
    content = content.replace(/min-h-screen bg-gray-50/g, 'min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-white');
    content = content.replace(/min-h-screen flex flex-col bg-gray-50/g, 'min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 dark:text-white');
    
    // Backgrounds
    content = content.replace(/bg-white(?!\s*\/| dark| opacity)/g, 'bg-white dark:bg-slate-900');
    content = content.replace(/bg-gray-50(?!\s*\/| dark)/g, 'bg-gray-50 dark:bg-slate-800');
    content = content.replace(/bg-gray-100(?!\s*\/| dark)/g, 'bg-gray-100 dark:bg-slate-800');
    
    // Texts
    content = content.replace(/text-gray-900(?!\s*\/| dark)/g, 'text-gray-900 dark:text-gray-100');
    content = content.replace(/text-gray-800(?!\s*\/| dark)/g, 'text-gray-800 dark:text-gray-200');
    content = content.replace(/text-gray-700(?!\s*\/| dark)/g, 'text-gray-700 dark:text-gray-300');
    content = content.replace(/text-gray-600(?!\s*\/| dark)/g, 'text-gray-600 dark:text-gray-400');
    content = content.replace(/text-gray-500(?!\s*\/| dark)/g, 'text-gray-500 dark:text-gray-400');
    
    // Borders
    content = content.replace(/border-gray-200(?!\s*\/| dark)/g, 'border-gray-200 dark:border-slate-700');
    content = content.replace(/border-gray-300(?!\s*\/| dark)/g, 'border-gray-300 dark:border-slate-700');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Added dark mode classes to ${file}`);
});
