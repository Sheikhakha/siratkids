const fs = require('fs');
const c = fs.readFileSync('js/quran_source/mutashabihat.js', 'utf8');
const marker = '["mutashabihat"]=';
const idx = c.indexOf(marker);
const after = c.slice(idx + marker.length);
let depth = 0, start = after.indexOf('{'), end = start, inStr = false, esc = false;
for (let i = start; i < after.length; i++) {
  const ch = after[i];
  if (esc) { esc = false; continue; }
  if (ch === '\\') { esc = true; continue; }
  if (ch === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (ch === '{') depth++;
  if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
}
const objStr = after.slice(start, end + 1);
console.log('objStr len:', objStr.length, 'first:', objStr.slice(0,60), 'last:', objStr.slice(-60));
let d = null;
try { d = eval('(' + objStr + ')'); } catch (e) { console.log('parse err', e.message); process.exit(1); }
console.log('d type:', typeof d, 'keys:', d && Object.keys(d));
const byAyah = d.byAyah || {};
const phrases = d.phrases || {};
console.log('has 1:1:', !!byAyah['1:1']);
console.log('has 1:2:', !!byAyah['1:2']);
console.log('has 2:23:', !!byAyah['2:23']);
console.log('byAyah key count:', Object.keys(byAyah).length);
console.log('phrases count:', Object.keys(phrases).length);
if (byAyah['1:1']) console.log('1:1 entries:', JSON.stringify(byAyah['1:1']).slice(0, 200));
if (byAyah['1:2']) console.log('1:2 entries:', JSON.stringify(byAyah['1:2']).slice(0, 200));
const p50 = phrases['50'] || {};
console.log('phrase 50 keys:', Object.keys(p50));
console.log('phrase 50 text:', p50.text || '');
console.log('phrase 50 refs sample:', JSON.stringify((p50.refs || []).slice(0, 12)));
