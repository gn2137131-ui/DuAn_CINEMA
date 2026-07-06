const fs = require('fs');
const path = require('path');

const fileReplacements = [
    {
        file: 'src/pages/admin/Movies.js',
        search: /if\s*\(\s*window\.confirm\(\s*"([^"]+)"\s*\)\s*\)\s*{([\s\S]*?)}\s*(?:else\s*{[\s\S]*?})?/g,
        replace: `confirmToast("$1", async () => {$2});`
    },
    {
        file: 'src/pages/admin/Reviews.js',
        search: /if\s*\(\s*!window\.confirm\(\s*'([^']+)'\s*\)\s*\)\s*return;/g,
        replace: `confirmToast("$1", async () => {`
    },
    {
        file: 'src/pages/admin/loyalty/Achievements.js',
        search: /if\s*\(\s*!window\.confirm\(\s*'([^']+)'\s*\)\s*\)\s*return;/g,
        replace: `confirmToast("$1", async () => {`
    },
    {
        file: 'src/pages/admin/loyalty/Tiers.js',
        search: /if\s*\(\s*!window\.confirm\(\s*'([^']+)'\s*\)\s*\)\s*return;/g,
        replace: `confirmToast("$1", async () => {`
    },
    {
        file: 'src/pages/admin/DiscountCodes.js',
        search: /const\s+isConfirmed\s*=\s*window\.confirm\([^)]+\);\s*if\s*\(\!isConfirmed\)\s*return;/g,
        replace: `confirmToast("Bạn có chắc chắn muốn thực hiện hành động này?", async () => {`
    },
    {
        file: 'src/pages/admin/Snacks.js',
        search: /const\s+isConfirmed\s*=\s*window\.confirm\([^)]+\);\s*if\s*\(\!isConfirmed\)\s*return;/g,
        replace: `confirmToast("Bạn có chắc chắn muốn xóa sản phẩm này?", async () => {`
    },
    {
        file: 'src/pages/booking/BookingDetailModal.js',
        search: /if\s*\(\s*window\.confirm\(\s*'([^']+)'\s*\)\s*\)\s*{([\s\S]*?)}\s*(?:else\s*{[\s\S]*?})?/g,
        replace: `confirmToast("$1", async () => {$2});`
    }
];

fileReplacements.forEach(({ file, search, replace }) => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes('window.confirm')) {
        if (!content.includes("confirmToast")) {
            // Import confirmToast from utils
            // The depth of import depends on file path
            const depth = file.split('/').length - 2;
            const prefix = '../'.repeat(depth);
            content = `import { confirmToast } from '${prefix}utils/confirmToast';\n` + content;
        }

        // For cases where early return was used, we need to wrap the rest of the function in the callback.
        // It's tricky to do with regex for early returns.
        // Let's do it manually for Reviews, Achievements, Tiers, DiscountCodes, Snacks.
        // For now, I will just log which ones I need to fix manually.
    }
});
