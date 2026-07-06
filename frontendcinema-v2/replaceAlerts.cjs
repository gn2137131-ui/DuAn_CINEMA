const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/pages/SeatSelection.tsx',
    'src/pages/Checkout.tsx',
    'src/pages/BookingHistory.tsx',
    'src/pages/Movies.tsx',
    'src/pages/Profile.tsx',
    'src/pages/Membership.tsx',
    'src/pages/Confirmation.tsx',
    'src/pages/MovieDetail.tsx',
    'src/pages/Games.tsx',
    'src/pages/LuckyWheelGame.tsx',
    'src/pages/CardFlipGame.tsx',
    'src/pages/EggSmashGame.tsx',
    'src/pages/LuckyEnvelopeGame.tsx',
    'src/pages/MysteryBoxGame.tsx',
    'src/pages/ScratchCardGame.tsx',
    'src/pages/SlotMachineGame.tsx',
    'src/pages/Home.tsx',
    'src/components/CineBot.tsx'
];

filesToProcess.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes('alert(')) {
        if (!content.includes("import { toast } from 'sonner'") && !content.includes('import { toast } from "sonner"')) {
            content = "import { toast } from 'sonner';\n" + content;
        }

        content = content.replace(/alert\((.*?)\)/g, (match, p1) => {
            const lowerP1 = p1.toLowerCase();
            if (lowerP1.includes('thành công') || lowerP1.includes('copy link') || lowerP1.includes('chúc mừng') || lowerP1.includes('đã lưu')) {
                return `toast.success(${p1})`;
            } else if (lowerP1.includes('vui lòng đăng nhập') || lowerP1.includes('không thể') || lowerP1.includes('lỗi') || lowerP1.includes('rất tiếc')) {
                return `toast.error(${p1})`;
            }
            return `toast.error(${p1})`;
        });

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
