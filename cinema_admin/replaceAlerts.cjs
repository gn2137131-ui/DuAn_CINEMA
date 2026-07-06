const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/pages/admin/movie/AddMovie.js',
    'src/pages/admin/movie/EditMovie.js',
    'src/pages/admin/showtime/AddShowtime.js',
    'src/pages/admin/showtime/EditShowtime.js',
    'src/pages/admin/Movies.js',
    'src/pages/admin/Reviews.js',
    'src/pages/admin/Login.js'
];

filesToProcess.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes('alert(')) {
        if (!content.includes("import toast from 'react-hot-toast'")) {
            content = "import toast from 'react-hot-toast';\n" + content;
        }

        content = content.replace(/alert\((.*?)\)/g, (match, p1) => {
            const lowerP1 = p1.toLowerCase();
            if (lowerP1.includes('thành công') || lowerP1.includes('đã tạo') || lowerP1.includes('cập nhật')) {
                return `toast.success(${p1})`;
            } else if (lowerP1.includes('lỗi') || lowerP1.includes('vui lòng') || lowerP1.includes('sai') || lowerP1.includes('không thể')) {
                return `toast.error(${p1})`;
            }
            return `toast.error(${p1})`;
        });

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
