const { createDriver } = require('../../config/driver');
const { startTimer, endTimer } = require('../../utils/timer');
const { logTestResult } = require('../../utils/logger');
const { takeScreenshot } = require('../../utils/screenshot');
const config = require('../../config/config');

const TEST_NAME = 'Home Page Load';

async function testHomePageLoad() {
  const driver = await createDriver();

  const checks = [];
  let pageTitle = '';
  let responseTime = 0;


  try {
    const start = startTimer();

    await driver.get(config.baseUrl);
    checks.push('Homepage URL opened successfully');

    pageTitle = await driver.getTitle();
    if (!pageTitle || pageTitle.trim() === '') {
      throw new Error('Page title is missing');
    }
    checks.push('Page title is present');

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Page loaded within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Page loaded but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult('PASS', TEST_NAME, {
      'URL': config.baseUrl,
      'Page Title': pageTitle,
      'Response Time': `${responseTime} ms`,
      'Checks Passed': checks
    });

    return { name: TEST_NAME, status: 'PASS' };

  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, 'home_page_load');

    logTestResult('FAIL', TEST_NAME, {
      'URL': config.baseUrl,
      'Page Title': pageTitle || 'Not captured',
      'Response Time': responseTime ? `${responseTime} ms` : 'Not measured',
      'Failure Reason': error.message,
      'Screenshot': screenshotPath,
      'Checks Completed': checks
    });

    return { name: TEST_NAME, status: 'FAIL' };

  } finally {
    await driver.quit();
  }
}

module.exports = testHomePageLoad;
