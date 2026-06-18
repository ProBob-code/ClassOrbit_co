const data = JSON.parse(require('fs').readFileSync('eslint-out.json', 'utf8'));
const cwd = process.cwd();
for (const file of data) {
  if (!file.messages.length) continue;
  const rel = file.filePath.startsWith(cwd) ? file.filePath.slice(cwd.length + 1) : file.filePath;
  for (const m of file.messages) {
    console.log(rel + ':' + m.line + ':' + m.column + '  [' + (m.ruleId || 'unknown') + ']  ' + m.message.split('\n')[0]);
  }
}
