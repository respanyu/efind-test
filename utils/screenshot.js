const fs = require('fs');
const path = require('path');
async function takeScreenshot(driver, testName) {
  try {
    const timestamp = Date.now();

    const folderPath = path.join(__dirname, '../reports/screenshots', testName.replace(/\s+/g, '_'));
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, `${testName.replace(/\s+/g, '_')}_${timestamp}.png`);

    const image = await driver.takeScreenshot();
    fs.writeFileSync(filePath, image, 'base64');

    return filePath;
  } catch (err) {
    console.error('❌ Failed to take screenshot:', err);
    return 'Screenshot Failed';
  }
}

module.exports = { takeScreenshot };
