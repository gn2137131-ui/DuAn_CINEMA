const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/Movies.js');
let content = fs.readFileSync(filePath, 'utf8');

// add toast imports if missing
if (!content.includes('import toast from')) {
    content = `import toast from 'react-hot-toast';\n` + content;
}
if (!content.includes('import { confirmToast }')) {
    content = `import { confirmToast } from '../../utils/confirmToast';\n` + content;
}

// Replace window.confirm
content = content.replace(
    /if\s*\(\s*window\.confirm\("Bạn có chắc muốn ngừng chiếu bộ phim này\?"\)\s*\)\s*\{\s*try\s*\{\s*await axiosClient\.delete\(`\/movies\/\$\{id\}`\);\s*fetchMovies\(\);\s*\}\s*catch\s*\(err\)\s*\{\s*alert\("Cập nhật trạng thái thất bại!"\);\s*\}\s*\}/g,
    `confirmToast("Bạn có chắc muốn ngừng chiếu bộ phim này?", async () => {
            try {
                await axiosClient.delete(\`/movies/\${id}\`);
                toast.success("Ngừng chiếu thành công!");
                fetchMovies();
            } catch (err) {
                toast.error("Cập nhật trạng thái thất bại!");
            }
        });`
);

// Replace remaining alerts
content = content.replace(/alert\("Cập nhật trạng thái thất bại!"\);/g, 'toast.error("Cập nhật trạng thái thất bại!");');
content = content.replace(/alert\("Có lỗi xảy ra khi ghim phim!"\);/g, 'toast.error("Có lỗi xảy ra khi ghim phim!");');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated Movies.js");
