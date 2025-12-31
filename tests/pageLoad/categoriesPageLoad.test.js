const { createDriver } = require("../../config/driver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const { By } = require('selenium-webdriver');
const config = require("../../config/config");

const TEST_NAME = "Verify All Categories Page Loads and Lists Categories";

async function testCategoriesPageLoad() {
  const driver = await createDriver();

  const checks = [];
  let pageTitle = "";
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/categories`);
    checks.push("Categories page URL opened successfully");

    pageTitle = await driver.getTitle();
    if (!pageTitle || pageTitle.trim() === "") {
      throw new Error("Page title is missing");
    }
    checks.push("Page title is present");

    const columns = await driver.findElements(
      By.css("div.columns.is-multiline")
    );
    if (columns.length === 0)
      throw new Error("Main categories container not found");
    checks.push("Main categories container found");

    const categoryLinks = await driver.findElements(
      By.css("div.column a.has-text-dark")
    );
    if (categoryLinks.length === 0) throw new Error("No categories found");
    checks.push(`Categories found (${categoryLinks.length} total)`);

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(`Page loaded within acceptable time (${responseTime} ms)`);
    } else {
      checks.push(`Page loaded but slower than expected (${responseTime} ms)`);
    }

    logTestResult("PASS", TEST_NAME, {
      URL: `${config.baseUrl}/categories`,
      "Page Title": pageTitle,
      "Response Time": `${responseTime} ms`,
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(
      driver,
      "Verify_All_Categories_Page_Loads_and_Lists_Categories"
    );

    logTestResult("FAIL", TEST_NAME, {
      URL: `${config.baseUrl}/categories`,
      "Page Title": pageTitle || "Not captured",
      "Response Time": responseTime ? `${responseTime} ms` : "Not measured",
      "Failure Reason": error.message,
      Screenshot: screenshotPath,
      "Checks Completed": checks,
    });

    return { name: TEST_NAME, status: "FAIL" };
  } finally {
    await driver.quit();
  }
}

module.exports = testCategoriesPageLoad;
