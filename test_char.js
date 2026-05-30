const fs = require('fs');
let content = fs.readFileSync('./src/utils/supportCardUtils.js', 'utf8');
content = content.replace('export const SUPPORT_CHARACTERS', 'const SUPPORT_CHARACTERS');
const supportChars = content.match(/const SUPPORT_CHARACTERS = \[([\s\S]*?)\];/)[0];
eval(supportChars);

const CHARACTER_NAME_TO_ID = SUPPORT_CHARACTERS.reduce((acc, character) => {
    character.aliases.forEach(alias => {
        acc[alias] = character.id;
    });
    return acc;
}, {});

console.log('Ichika:', CHARACTER_NAME_TO_ID['이치카']);
console.log('Miku:', CHARACTER_NAME_TO_ID['미쿠']);
