const fs = require('fs');
const path = require('path');
const os = require('os');

const logDir = path.join(os.homedir(), 'AppData', 'Local', 'Roblox', 'logs');
const files = fs.readdirSync(logDir)
  .filter(f => f.endsWith('.log'))
  .map(f => { try { const full = path.join(logDir, f); return { path: full, mtime: fs.statSync(full).mtimeMs }; } catch { return null; } })
  .filter(Boolean)
  .sort((a, b) => b.mtime - a.mtime);

console.log('Latest log:', files[0].path);
const logFile = files[0].path;
const stat = fs.statSync(logFile);
console.log('File size:', stat.size);

// Read ENTIRE file with shared access
const fd = fs.openSync(logFile, 0x0000);
const buf = Buffer.alloc(stat.size);
fs.readSync(fd, buf, 0, stat.size, 0);
fs.closeSync(fd);
const text = buf.toString('utf8');
console.log('Text length:', text.length);

// Check offsets
console.log('UDMUX offset:', text.indexOf('UDMUX'));
console.log('placeid offset:', text.indexOf('placeid'));
console.log('universeid offset:', text.indexOf('universeid'));
console.log('UserName offset:', text.indexOf('UserName'));
console.log('userid offset:', text.indexOf('userid'));

// Extract data
const ipMatch = text.match(/UDMUX Address\s*=\s*([\d.]+)/g);
if (ipMatch) {
  const last = ipMatch[ipMatch.length - 1];
  const ip = last.match(/([\d.]+)$/);
  console.log('Server IP:', ip ? ip[1] : 'NONE');
}

const placeMatch = text.match(/placeid[\s:=]+(\d+)/gi);
console.log('PlaceId matches:', placeMatch);

const univMatch = text.match(/universeid[\s:=]+(\d+)/gi);
console.log('UniverseId matches:', univMatch);

const userIdMatch = text.match(/userid[\s:=]+(\d+)/gi);
console.log('UserId matches:', userIdMatch);

process.exit(0);
