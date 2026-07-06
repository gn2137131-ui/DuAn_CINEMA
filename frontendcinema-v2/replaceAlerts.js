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
        // Add import { toast } from 'sonner' if not exists
        if (!content.includes("import { toast } from 'sonner'") && !content.includes('import { toast } from "sonner"')) {
            content = "import { toast } from 'sonner';\n" + content;
        }

        // Replace alert with toast.error or toast.info based on context
        // Very basic heuristic: if it contains "thành công" or "copy", use success
        // Else use error (most alerts are errors or warnings)
        
        content = content.replace(/alert\((.*?)\)/g, (match, p1) => {
            const lowerP1 = p1.toLowerCase();
            if (lowerP1.includes('thành công') || lowerP1.includes('copy link') || lowerP1.includes('chúc mừng')) {
                return `toast.success(${p1})`;
            } else if (lowerP1.includes('vui lòng đăng nhập') || lowerP1.includes('không thể') || lowerP1.includes('lỗi')) {
                return `toast.error(${p1})`;
            }
            return `toast.error(${p1})`; // Default to error
        });

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
