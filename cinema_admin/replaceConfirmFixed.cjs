const fs = require('fs');
const path = require('path');

const replaceConfirmInFile = (filePath, regex, replacement) => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes('window.confirm')) {
        if (!content.includes("confirmToast")) {
            const depth = filePath.split('/').length - 2;
            const prefix = '../'.repeat(Math.max(0, depth));
            content = `import { confirmToast } from '${prefix}utils/confirmToast';\n` + content;
        }

        content = content.replace(regex, replacement);

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Replaced confirm in ${filePath}`);
    }
};

// Movies.js
replaceConfirmInFile(
    'src/pages/admin/Movies.js',
    /if\s*\(\s*window\.confirm\(\s*"([^"]+)"\s*\)\s*\)\s*{([\s\S]*?)}\s*catch/g,
    `confirmToast("$1", async () => {$2} catch`
);

// Reviews.js has two window.confirms. Let's do it with string replace since regex is complex for block.
const reviewsPath = path.join(__dirname, 'src/pages/admin/Reviews.js');
if (fs.existsSync(reviewsPath)) {
    let content = fs.readFileSync(reviewsPath, 'utf8');
    if (content.includes('window.confirm')) {
        if (!content.includes("confirmToast")) {
            content = `import { confirmToast } from '../../utils/confirmToast';\n` + content;
        }
        
        content = content.replace(/if\s*\(\!window\.confirm\('Bạn có chắc chắn muốn xóa đánh giá này\?'\)\)\s*return;/g, 
            `return confirmToast('Bạn có chắc chắn muốn xóa đánh giá này?', async () => {
      try {
        await axiosClient.delete(\`/admin/reviews/\${id}\`);
        toast.success('Đã xóa đánh giá thành công');
        fetchReviews();
      } catch (err) {
        console.error('Lỗi khi xóa đánh giá:', err);
        toast.error('Không thể xóa đánh giá');
      }
    });`);
        content = content.replace(/try {\s*await axiosClient\.delete\(`\/admin\/reviews\/\${id}`\);\s*toast\.success\('Đã xóa đánh giá thành công'\);\s*fetchReviews\(\);\s*} catch \(err\) {\s*console\.error\('Lỗi khi xóa đánh giá:', err\);\s*toast\.error\('Không thể xóa đánh giá'\);\s*}/, '');

        content = content.replace(/if\s*\(\!window\.confirm\('Bạn có chắc chắn muốn xóa bình luận này\?'\)\)\s*return;/g, 
            `return confirmToast('Bạn có chắc chắn muốn xóa bình luận này?', async () => {
      try {
        await axiosClient.delete(\`/admin/reviews/\${reviewId}/comments/\${commentId}\`);
        toast.success('Đã xóa bình luận thành công');
        fetchReviews();
      } catch (err) {
        console.error('Lỗi khi xóa bình luận:', err);
        toast.error('Không thể xóa bình luận');
      }
    });`);
        content = content.replace(/try {\s*await axiosClient\.delete\(`\/admin\/reviews\/\${reviewId}\/comments\/\${commentId}`\);\s*toast\.success\('Đã xóa bình luận thành công'\);\s*fetchReviews\(\);\s*} catch \(err\) {\s*console\.error\('Lỗi khi xóa bình luận:', err\);\s*toast\.error\('Không thể xóa bình luận'\);\s*}/, '');

        fs.writeFileSync(reviewsPath, content, 'utf8');
        console.log('Replaced confirm in src/pages/admin/Reviews.js');
    }
}
