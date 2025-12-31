const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../reports/pageLoad.log');

function logTestResult(status, testName, details) {
  const time = new Date().toISOString();

  const statusIcon = status === 'PASS' ? '✅' : '❌';
  const fieldIcon = '🔹';
  const listIcon = '✔';

  console.log(`\n${statusIcon} ${testName} [${status}]`);

  Object.entries(details).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      console.log(` ${fieldIcon} ${key}:`);
      value.forEach(v => console.log(`    ${listIcon} ${v}`));
    } else {
      console.log(` ${fieldIcon} ${key}: ${value}`);
    }
  });

  let fileLog = `[${time}] ${statusIcon} ${testName} [${status}]\n`;
  Object.entries(details).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      fileLog += `  ${fieldIcon} ${key}:\n`;
      value.forEach(v => {
        fileLog += `     ${listIcon} ${v}\n`;
      });
    } else {
      fileLog += `  ${fieldIcon} ${key}: ${value}\n`;
    }
  });

  fs.appendFileSync(logFilePath, fileLog);
}

module.exports = { logTestResult };
