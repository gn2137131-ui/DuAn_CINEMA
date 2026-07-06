const fs = require('fs');
const html = fs.readFileSync('movie-chatbox.html', 'utf8');

// Find the second <style> block which starts with `* {`
const styleStart = html.indexOf('<style>\n* {');
const styleEnd = html.indexOf('</style>', styleStart);

if (styleStart !== -1 && styleEnd !== -1) {
  let css = html.substring(styleStart + 7, styleEnd).trim();
  
  // To avoid polluting global scope, let's prefix body rules to .cine-bot-wrapper
  // and remove body padding etc.
  css = css.replace(/body \{([\s\S]*?)\}/, (match, bodyRules) => {
    return `.cine-bot-wrapper {\n${bodyRules}\n}`;
  });

  fs.writeFileSync('frontendcinema-v2/src/components/CineBot.css', css);
  console.log('CineBot.css created successfully.');
} else {
  console.log('Style block not found.');
}
