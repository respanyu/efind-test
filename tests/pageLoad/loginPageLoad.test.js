const { createDriver } = require('../../config/driver');
const { startTimer, endTimer } = require('../../utils/timer');
const { logTestResult } = require('../../utils/logger');
const { takeScreenshot } = require('../../utils/screenshot');
const config = require('../../config/config');
const { By } = require('selenium-webdriver');

const TEST_NAME = 'Verify Login Page Loads and Displays Form';
const LOGIN_PATH = '/user/login';

async function testLoginPageLoad() {
  const driver = await createDriver();

  const checks = [];
  let pageTitle = '';
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(config.baseUrl + LOGIN_PATH);
    checks.push('Login page URL opened');

    pageTitle = await driver.getTitle();
    if (!pageTitle || pageTitle.trim() === '') {
      throw new Error('Login page title is missing');
    }
    checks.push('Login page title is present');

    await driver.findElement(By.name('email'));
    checks.push('Email input field is present');

    await driver.findElement(By.name('password'));
    checks.push('Password input field is present');

    await driver.findElement(By.css('button[type="submit"]'));
    checks.push('Login submit button is present');

    responseTime = endTimer(start);
    checks.push(`Page loaded in ${responseTime} ms`);

    logTestResult('PASS', TEST_NAME, {
      'URL': config.baseUrl + LOGIN_PATH,
      'Page Title': pageTitle,
      'Response Time': `${responseTime} ms`,
      'Checks Passed': checks
    });

    return { name: TEST_NAME, status: 'PASS' };

  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, 'login_page_load');

    logTestResult('FAIL', TEST_NAME, {
      'URL': config.baseUrl + LOGIN_PATH,
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

module.exports = testLoginPageLoad;
