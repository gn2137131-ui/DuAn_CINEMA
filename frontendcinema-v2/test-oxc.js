import fs from 'fs';
import path from 'path';
import { parseSync } from 'oxc-parser';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('./src');
let failed = false;
for (const file of files) {
    try {
        const sourceText = fs.readFileSync(file, 'utf8');
        parseSync(sourceText, { sourceFilename: file });
    } catch (e) {
        console.error(`FAILED ON FILE: ${file}`);
        console.error(e);
        failed = true;
    }
}
if (!failed) console.log("ALL FILES PASSED OXC-PARSER");
